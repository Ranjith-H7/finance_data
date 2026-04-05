import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/users.js';
import type { Request, Response } from 'express';
import { resolveJwtSecret } from '../utils/jwtSecret.js';

const createAuthResponse = (user: { _id: unknown; name: string; email: string; role: string; status: string }) => {
  const jwtSecret = resolveJwtSecret();
  const token = jwt.sign(
    { id: user._id, role: user.role },
    jwtSecret,
    { expiresIn: '1d' }
  );

  return {
    token,
    user: {
      _id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPassword = String(password ?? '');

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    const isMatch = await bcrypt.compare(normalizedPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json(createAuthResponse(user));
  } catch (_error) {
    res.status(500).json({ message: 'Error logging in' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const normalizedName = String(name ?? '').trim();
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedPassword = String(password ?? '');

    if (!normalizedName || !normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
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
      role: 'viewer',
      status: 'active',
    });

    const authResponse = createAuthResponse(user);

    res.status(201).json(authResponse);
  } catch (_error) {
    res.status(500).json({ message: 'Error registering user' });
  }
};