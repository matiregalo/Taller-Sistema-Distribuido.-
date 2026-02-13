import { v4 as uuidv4 } from 'uuid';
import { complaintsRepository } from '../repositories/complaints.repository.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../errors/validation.error.js';
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

const VALID_INCIDENT_TYPES: IncidentType[] = [
  IncidentType.NO_SERVICE,
  IncidentType.INTERMITTENT_SERVICE,
  IncidentType.SLOW_CONNECTION,
  IncidentType.ROUTER_ISSUE,
  IncidentType.BILLING_QUESTION,
  IncidentType.OTHER,
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateCreateRequest = (request: CreateTicketRequest): void => {
  if (!request.lineNumber || typeof request.lineNumber !== 'string') {
    throw new ValidationError('lineNumber is required and must be a string');
  }

  if (!request.email || typeof request.email !== 'string') {
    throw new ValidationError('email is required and must be a string');
  }

  if (!EMAIL_REGEX.test(request.email)) {
    throw new ValidationError('email must be a valid email address');
  }

  if (!request.incidentType || typeof request.incidentType !== 'string') {
    throw new ValidationError('incidentType is required and must be a string');
  }

  if (!VALID_INCIDENT_TYPES.includes(request.incidentType as IncidentType)) {
    throw new ValidationError(
      `incidentType must be one of: ${VALID_INCIDENT_TYPES.join(', ')}`
    );
  }

  if (request.incidentType === IncidentType.OTHER && (!request.description || request.description.trim() === '')) {
    throw new ValidationError('description is required when incidentType is OTHER');
  }
};

const buildTicket = (request: CreateTicketRequest): Ticket => ({
  ticketId: uuidv4(),
  lineNumber: request.lineNumber,
  email: request.email,
  incidentType: request.incidentType as IncidentType,
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
    validateCreateRequest(request);

    const ticket = buildTicket(request);

    complaintsRepository.save(ticket);

    logger.info('Ticket created', {
      ticketId: ticket.ticketId,
      incidentType: ticket.incidentType,
    });

    // Facade: simple and clear — throws MessagingError if it fails
    await messaging.publishTicketCreated(ticket);

    return ticket;
  },

  getTicketById: (ticketId: string): Ticket | undefined => {
    if (!ticketId || typeof ticketId !== 'string') {
      throw new ValidationError('ticketId is required and must be a string');
    }

    return complaintsRepository.findById(ticketId);
  },
});

// Default instance for backward compatibility
export const complaintsService = createComplaintsService();
