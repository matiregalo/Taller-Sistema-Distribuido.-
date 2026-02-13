import { Request, Response, NextFunction } from 'express';

export const jsonSyntaxErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (err instanceof SyntaxError && 'body' in err) {
        res.status(400).json({
            error: 'Invalid JSON',
            details: 'The request body contains invalid JSON',
        });
        return;
    }
    next(err);
};
