import type { Ticket } from '../types/ticket.types.js';

export interface IMessagingFacade {
    publishTicketCreated(ticket: Ticket): Promise<void>;
}
