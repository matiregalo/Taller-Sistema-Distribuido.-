import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { RabbitMQConnectionManager } from '../messaging/RabbitMQConnectionManager.js';
import { TicketMessageSerializer } from '../messaging/TicketMessageSerializer.js';
import { MessagingFacade } from '../messaging/MessagingFacade.js';
import { config } from '../config/index.js';
import type { IMessagingFacade } from '../messaging/IMessagingFacade.js';
import {
  Ticket,
  CreateTicketRequest,
  IncidentType,
} from '../types/ticket.types.js';

const buildTicket = (request: CreateTicketRequest): Ticket => ({
  ticketId: uuidv4(),
  lineNumber: request.lineNumber,
  email: request.email,
  incidentType: request.incidentType,
  description: request.description || null,
  status: 'RECEIVED',
  priority: 'PENDING',
  createdAt: new Date(),
});

// Default Facade instance (uses Singleton + Serializer)
const defaultMessaging: IMessagingFacade = new MessagingFacade(
  RabbitMQConnectionManager.getInstance(),
  new TicketMessageSerializer(),
  { exchange: config.rabbitmq.exchange, routingKey: config.rabbitmq.routingKey }
);

// Factory function for dependency injection (testability)
export const createComplaintsService = (
  messaging: IMessagingFacade = defaultMessaging
) => ({
  createTicket: async (request: CreateTicketRequest): Promise<Ticket> => {
    // Validation is now handled by validateComplaintRequest middleware (SRP §3.1)
    const ticket = buildTicket(request);

    logger.info('Ticket created', {
      ticketId: ticket.ticketId,
      incidentType: ticket.incidentType,
    });

    // Publish event — persistence is handled by the Consumer (§2.2)
    // Facade throws MessagingError if it fails
    await messaging.publishTicketCreated(ticket);

    return ticket;
  },
});

// Default instance for backward compatibility
export const complaintsService = createComplaintsService();
