import { Request, Response, NextFunction } from 'express';
import { MessagingError } from '../../errors/messaging.error.js';
import { logger } from '../../utils/logger.js';

export const messagingErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof MessagingError) {
        logger.error('Messaging error', {
            ticketId: err.ticketId,
            message: err.message,
        });
        res.status(503).json({
            error: 'Service Unavailable',
            details: 'The messaging service is temporarily unavailable',
        });
        return;
    }
    next(err);
};
