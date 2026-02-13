import type { TicketEventPayload } from '../types/ticket.types.js';

export interface IMessageBroker {
    publish(payload: TicketEventPayload): Promise<void>;
}
