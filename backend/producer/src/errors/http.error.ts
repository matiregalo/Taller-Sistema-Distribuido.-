/**
 * Base HTTP error class with statusCode.
 * All domain errors that map to HTTP responses should extend this class (OCP §3.2).
 * Error handlers can check `instanceof HttpError` generically instead of
 * checking each concrete subclass.
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
