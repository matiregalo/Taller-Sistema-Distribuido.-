import type { Ticket, TicketEventPayload } from '../types/ticket.types.js';
import type { IMessageSerializer } from './IMessageSerializer.js';

export class TicketMessageSerializer implements IMessageSerializer {
    serializeTicketCreated(ticket: Ticket): Buffer {
        const payload: TicketEventPayload = {
            ticketId: ticket.ticketId,
            lineNumber: ticket.lineNumber,
            type: ticket.incidentType,
            description: ticket.description,
            createdAt: ticket.createdAt.toISOString(),
        };
        return Buffer.from(JSON.stringify(payload));
    }
}
