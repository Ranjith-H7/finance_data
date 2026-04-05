import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import User from '../models/users.js';
import { resolveJwtSecret } from '../utils/jwtSecret.js';

export type UserRole = 'viewer' | 'analyst' | 'admin';

export interface AuthRequest extends Request {
  user?: { id: string; role: UserRole; status: 'active' | 'inactive' };
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const tokenParts = authHeader.split(' ');
    const jwtToken = tokenParts.length === 2 ? tokenParts[1] : authHeader;

    if (!jwtToken) {
      return res.status(401).json({ message: 'Token is missing' });
    }

    const decoded = jwt.verify(jwtToken, resolveJwtSecret()) as unknown as JwtPayload & {
      id: string;
      role: UserRole;
    };

    if (!decoded?.id || !decoded?.role) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.id).select('role status');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    req.user = {
      id: decoded.id,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const checkRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
};