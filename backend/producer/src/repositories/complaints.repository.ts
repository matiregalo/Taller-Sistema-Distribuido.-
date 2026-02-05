import { Ticket } from '../types/ticket.types.js';
import { logger } from '../utils/logger.js';

const tickets: Map<string, Ticket> = new Map();

export const complaintsRepository = {
  save: (ticket: Ticket): Ticket => {
    tickets.set(ticket.ticketId, ticket);
    logger.debug('Ticket saved to repository', { ticketId: ticket.ticketId });
    return ticket;
  },

  findById: (ticketId: string): Ticket | undefined => {
    const ticket = tickets.get(ticketId);
    if (!ticket) {
      logger.debug('Ticket not found', { ticketId });
    }
    return ticket;
  },

  findAll: (): Ticket[] => {
    return Array.from(tickets.values());
  },

  clear: (): void => {
    tickets.clear();
    logger.debug('Repository cleared');
  },

  count: (): number => {
    return tickets.size;
  },
};
