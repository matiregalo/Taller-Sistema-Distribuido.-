import type { ILogger } from './ILogger';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

const formatMessage = (
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
): string => {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${ctx}`;
};

export const logger: ILogger = {
    info: (message: string, context?: Record<string, unknown>): void => {
        console.log(formatMessage('INFO', message, context));
    },
    warn: (message: string, context?: Record<string, unknown>): void => {
        console.warn(formatMessage('WARN', message, context));
    },
    error: (message: string, context?: Record<string, unknown>): void => {
        console.error(formatMessage('ERROR', message, context));
    },
    debug: (message: string, context?: Record<string, unknown>): void => {
        if (process.env.NODE_ENV === 'development') {
            console.log(formatMessage('DEBUG', message, context));
        }
    },
};
