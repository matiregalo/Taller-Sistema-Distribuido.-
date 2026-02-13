/**
 * Lightweight logger for the frontend.
 * Abstracts console calls so they can be centrally controlled,
 * silenced in tests, or replaced by a remote logging service.
 */
export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.info(`[INFO] ${message}`, ...args);
  },
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]): void => {
    console.error(`[ERROR] ${message}`, ...args);
  },
};
