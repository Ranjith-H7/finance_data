import type { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import User from '../models/users.js';
import FinanceRecord from '../models/financeRecord.js';
import AnalystPermission from '../models/analystPermission.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// CREATE USER (POST)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role, status } = req.body;
    const normalizedName = String(name ?? '').trim();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPassword = String(password ?? '');
    const normalizedRole = role ?? 'viewer';
    const normalizedStatus = status ?? 'active';

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (!['viewer', 'analyst', 'admin'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    if (!['active', 'inactive'].includes(normalizedStatus)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      status: normalizedStatus,
    });

    const actorId = req.user && typeof req.user === 'object' && 'id' in req.user ? String((req.user as { id: string }).id) : String(user._id);
    await logAuditEvent({
      actorId,
      action: 'user.create',
      targetType: 'user',
      targetId: String(user._id),
      details: { email: normalizedEmail, role: normalizedRole, status: normalizedStatus },
    });

    const { password: _password, ...userResponse } = user.toObject();
    res.status(201).json(userResponse);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: number }).code === 11000) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    res.status(500).json({ message: 'Error creating user', error });
  }
};

// GET ALL USERS
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q ?? req.query.search ?? '').trim();

    if (!query) {
      const users = await User.find().select('_id name email role status').limit(10);
      return res.status(200).json(users);
    }

    if (mongoose.Types.ObjectId.isValid(query)) {
      const exactUser = await User.findById(query).select('_id name email role status');

      if (exactUser) {
        return res.status(200).json([exactUser]);
      }
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      $or: [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { email: { $regex: escapedQuery, $options: 'i' } },
      ],
    })
      .select('_id name email role status')
      .limit(10);

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error searching users', error });
  }
};

export const updateUserAccess = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role, status } = req.body;

    if (role === undefined && status === undefined) {
      return res.status(400).json({ message: 'At least one of role or status must be provided' });
    }

    if (role !== undefined && !['viewer', 'analyst', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    if (status !== undefined && !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const updatePayload: Record<string, unknown> = {};

    if (role !== undefined) updatePayload.role = role;
    if (status !== undefined) updatePayload.status = status;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.user && typeof req.user === 'object' && 'id' in req.user) {
      await logAuditEvent({
        actorId: String((req.user as { id: string }).id),
        action: 'user.update_access',
        targetType: 'user',
        targetId: String(updatedUser._id),
        details: updatePayload,
      });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user access', error });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const id = String(req.params.id ?? '').trim();

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    if (req.user.id === id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const userObjectId = new mongoose.Types.ObjectId(id);

    const existingUser = await User.findById(userObjectId).select('_id');
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Promise.all([
      FinanceRecord.deleteMany({ userId: userObjectId }),
      AnalystPermission.deleteMany({ $or: [{ analystId: userObjectId }, { userId: userObjectId }, { reviewedBy: userObjectId }] }),
      User.findByIdAndDelete(userObjectId),
    ]);

    await logAuditEvent({
      actorId: req.user.id,
      action: 'user.delete',
      targetType: 'user',
      targetId: id,
      details: { cascaded: ['FinanceRecord', 'AnalystPermission'] },
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
};