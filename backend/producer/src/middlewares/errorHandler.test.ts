import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorHandler } from './errorHandler.js';
import { ValidationError } from '../errors/validation.error.js';
import type { Request, Response, NextFunction } from 'express';

describe('errorHandler', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let resStatus: ReturnType<typeof vi.fn>;
  let resJson: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    resJson = vi.fn();
    resStatus = vi.fn().mockReturnValue({ json: resJson });
    mockReq = {};
    mockRes = { status: resStatus, json: resJson } as unknown as Partial<Response>;
    mockNext = vi.fn();
  });

  it('responde 400 con Validation Error cuando el error es ValidationError', () => {
    const err = new ValidationError('lineNumber is required');
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(resStatus).toHaveBeenCalledWith(400);
    expect(resJson).toHaveBeenCalledWith({
      error: 'Validation Error',
      details: 'lineNumber is required',
    });
  });

  it('responde 400 con Invalid JSON cuando es SyntaxError y tiene body', () => {
    const err = new SyntaxError('Unexpected token');
    (err as SyntaxError & { body?: unknown }).body = {};
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(resStatus).toHaveBeenCalledWith(400);
    expect(resJson).toHaveBeenCalledWith({
      error: 'Invalid JSON',
      details: 'Request body contains invalid JSON',
    });
  });

  it('responde 500 con Internal Server Error para cualquier otro error', () => {
    const err = new Error('Database connection failed');
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(resStatus).toHaveBeenCalledWith(500);
    expect(resJson).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
  });

  it('SyntaxError sin body no se trata como JSON inválido (500)', () => {
    const err = new SyntaxError('Other syntax error');
    errorHandler(err, mockReq as Request, mockRes as Response, mockNext);
    expect(resStatus).toHaveBeenCalledWith(500);
    expect(resJson).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
