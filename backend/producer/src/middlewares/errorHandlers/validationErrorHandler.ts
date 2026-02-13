import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../errors/validation.error.js';

export const validationErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof ValidationError) {
        res.status(400).json({
            error: 'Validation Error',
            details: err.message,
        });
        return;
    }
    next(err);
};
