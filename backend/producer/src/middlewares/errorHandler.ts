import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../services/complaints.service.js';
import { logger } from '../utils/logger.js';

interface ErrorResponse {
  error: string;
  details?: string;
}

/**
 * Global error handling middleware
 */
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

  // Handle validation errors
  if (err instanceof ValidationError) {
    const response: ErrorResponse = {
      error: 'Validation Error',
      details: err.message,
    };
    res.status(400).json(response);
    return;
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && 'body' in err) {
    const response: ErrorResponse = {
      error: 'Invalid JSON',
      details: 'Request body contains invalid JSON',
    };
    res.status(400).json(response);
    return;
  }

  // Default: Internal server error
  const response: ErrorResponse = {
    error: 'Internal Server Error',
  };
  res.status(500).json(response);
};
