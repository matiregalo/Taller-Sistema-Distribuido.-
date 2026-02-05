import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/validation.error.js';
import { logger } from '../utils/logger.js';

interface ErrorResponse {
  error: string;
  details?: string;
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (err instanceof ValidationError) {
    const response: ErrorResponse = {
      error: 'Validation Error',
      details: err.message,
    };
    res.status(400).json(response);
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    const response: ErrorResponse = {
      error: 'Invalid JSON',
      details: 'Request body contains invalid JSON',
    };
    res.status(400).json(response);
    return;
  }

  const response: ErrorResponse = {
    error: 'Internal Server Error',
  };
  res.status(500).json(response);
};
