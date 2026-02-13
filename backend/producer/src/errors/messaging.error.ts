export class MessagingError extends Error {
    constructor(message: string, public readonly ticketId?: string) {
        super(message);
        this.name = 'MessagingError';
    }
}
