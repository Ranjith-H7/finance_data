import type { Response } from 'express';
import User from '../models/users.js';
import AnalystPermission from '../models/analystPermission.js';
import type { PermissionScope } from '../models/analystPermission.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const normalizeScope = (scope: unknown): PermissionScope | null => {
  if (scope === 'all_users' || scope === 'single_user') {
    return scope;
  }

  return null;
};

export const requestDataAccess = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'analyst' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only analysts can request data access' });
    }

    const scope = normalizeScope(req.body.scope);
    const userId = req.body.userId ? String(req.body.userId) : '';
    const reason = String(req.body.reason ?? '').trim();

    if (!scope) {
      return res.status(400).json({ message: 'Invalid permission scope' });
    }

    if (scope === 'single_user' && !userId) {
      return res.status(400).json({ message: 'A userId is required for single-user access' });
    }

    if (scope === 'single_user') {
      const targetUser = await User.findById(userId).select('_id role status');

      if (!targetUser) {
        return res.status(404).json({ message: 'Requested user not found' });
      }
    }

    const existingRequest = await AnalystPermission.findOne({
      analystId: req.user.id,
      scope,
      status: { $in: ['pending', 'approved'] },
      ...(scope === 'single_user' ? { userId } : { userId: { $exists: false } }),
    });

    if (existingRequest) {
      return res.status(409).json({ message: 'A similar access request already exists' });
    }

    const isAdminRequest = req.user.role === 'admin';
    const accessRequestPayload = {
      analystId: req.user.id,
      scope,
      status: isAdminRequest ? 'approved' : 'pending',
      ...(scope === 'single_user' ? { userId } : {}),
      ...(reason ? { reason } : {}),
      ...(isAdminRequest ? { reviewedBy: req.user.id, reviewedAt: new Date() } : {}),
    };

    const accessRequest = await AnalystPermission.create(accessRequestPayload);

    await logAuditEvent({
      actorId: req.user.id,
      action: 'permission.request',
      targetType: 'permission',
      targetId: String(accessRequest._id),
      details: { scope, userId: userId || null, status: accessRequest.status },
    });

    res.status(201).json(accessRequest);
  } catch (error) {
    res.status(500).json({ message: 'Error creating access request', error });
  }
};

export const getMyDataAccessRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const requests = await AnalystPermission.find({ analystId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your access requests', error });
  }
};

export const getAllDataAccessRequests = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const requests = await AnalystPermission.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching access requests', error });
  }
};

export const reviewDataAccessRequest = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const updatedRequest = await AnalystPermission.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: 'Access request not found' });
    }

    await logAuditEvent({
      actorId: req.user.id,
      action: 'permission.review',
      targetType: 'permission',
      targetId: String(updatedRequest._id),
      details: { status },
    });

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ message: 'Error reviewing access request', error });
  }
};

export const revokeDataAccess = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { id } = req.params;
    const deletedRequest = await AnalystPermission.findByIdAndDelete(id);

    if (!deletedRequest) {
      return res.status(404).json({ message: 'Access request not found' });
    }

    await logAuditEvent({
      actorId: req.user.id,
      action: 'permission.revoke',
      targetType: 'permission',
      targetId: String(deletedRequest._id),
      details: { analystId: String(deletedRequest.analystId), scope: deletedRequest.scope },
    });

    res.status(200).json({ message: 'Access request removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing access request', error });
  }
};