import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // ToDo: Integrate sentry and any other health checkers
  logger.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
};
