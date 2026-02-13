import { HttpError } from './http.error.js';

export class MessagingError extends HttpError {
    constructor(message: string, public readonly ticketId?: string) {
        super(message, 503);
        this.name = 'MessagingError';
    }
}
