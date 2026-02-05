import { Ticket } from '../types/ticket.types.js';
import { logger } from '../utils/logger.js';

// In-memory storage
const tickets: Map<string, Ticket> = new Map();

export const complaintsRepository = {
  /**
   * Save a new ticket to the in-memory store
   */
  save: (ticket: Ticket): Ticket => {
    tickets.set(ticket.ticketId, ticket);
    logger.debug('Ticket saved to repository', { ticketId: ticket.ticketId });
    return ticket;
  },

  /**
   * Find a ticket by its ID
   */
  findById: (ticketId: string): Ticket | undefined => {
    const ticket = tickets.get(ticketId);
    if (!ticket) {
      logger.debug('Ticket not found', { ticketId });
    }
    return ticket;
  },

  /**
   * Get all tickets (useful for debugging)
   */
  findAll: (): Ticket[] => {
    return Array.from(tickets.values());
  },

  /**
   * Clear all tickets (useful for testing)
   */
  clear: (): void => {
    tickets.clear();
    logger.debug('Repository cleared');
  },

  /**
   * Get the count of stored tickets
   */
  count: (): number => {
    return tickets.size;
  },
};
