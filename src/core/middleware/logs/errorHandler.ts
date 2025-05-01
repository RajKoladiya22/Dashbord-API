import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`${req.method} ${req.url} — ${err.message}`);  // log error
  res.status(err.status || 500).json({ message: 'Internal Server Error', error: err.message });
}
