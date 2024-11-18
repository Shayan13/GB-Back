import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        phoneNumber: string;
      }
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(new AppError('Authentication token required', 401));
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = user as { id: string; phoneNumber: string };
    next();
  } catch (error) {
    return next(new AppError('Invalid token', 403));
  }
};