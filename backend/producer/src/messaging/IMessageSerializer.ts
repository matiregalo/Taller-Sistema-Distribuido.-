import type { Ticket } from '../types/ticket.types.js';

export interface IMessageSerializer {
    serializeTicketCreated(ticket: Ticket): Buffer;
}
