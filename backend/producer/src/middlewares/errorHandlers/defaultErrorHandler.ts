import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger.js';

export const defaultErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    logger.error('Unhandled error', {
        name: err.name,
        message: err.message,
        stack: err.stack,
    });
    res.status(500).json({
        error: 'Internal Server Error',
        details: 'An unexpected error occurred',
    });
};
