import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '../services/databaseService';
import { User } from '../../types';

let developmentSecret: string | undefined;

const getJwtSecret = (): string => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }

  developmentSecret ??= crypto.randomBytes(32).toString('hex');
  return developmentSecret;
};

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { id: string; email: string; role: string };
    const user = db.findUserById(decoded.id);
    if (!user) {
      res.status(401).json({ message: 'Invalid or expired session. User not found.' });
      return;
    }
    if (user.status !== 'ACTIVE') {
      res.status(403).json({ message: 'Account is not active.' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || !['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
    res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    return;
  }
  next();
};

export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'SUPER_ADMIN') {
    res.status(403).json({ message: 'Access denied. Super Admin privileges required.' });
    return;
  }
  next();
};

export const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};
