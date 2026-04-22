import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth.service';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.userId = userId;
  next();
};
