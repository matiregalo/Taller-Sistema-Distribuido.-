import { v4 as uuidv4 } from 'uuid';
import { complaintsRepository } from '../repositories/complaints.repository.js';
import { publishTicketEvent } from '../messaging/rabbitmq.js';
import { logger } from '../utils/logger.js';
import { ValidationError } from '../errors/validation.error.js';
import {
  Ticket,
  CreateTicketRequest,
  TicketEventPayload,
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

export const complaintsService = {
  createTicket: async (request: CreateTicketRequest): Promise<Ticket> => {
    validateCreateRequest(request);

    const ticket: Ticket = {
      ticketId: uuidv4(),
      lineNumber: request.lineNumber,
      email: request.email,
      incidentType: request.incidentType as IncidentType,
      description: request.description || null,
      status: 'RECEIVED',
      priority: 'PENDING',
      createdAt: new Date(),
    };

    complaintsRepository.save(ticket);

    logger.info('Ticket created', {
      ticketId: ticket.ticketId,
      incidentType: ticket.incidentType,
    });

    const eventPayload: TicketEventPayload = {
      ticketId: ticket.ticketId,
      lineNumber: ticket.lineNumber,
      incidentType: ticket.incidentType,
      description: ticket.description,
      createdAt: ticket.createdAt.toISOString(),
    };

    await publishTicketEvent(eventPayload);

    return ticket;
  },

  getTicketById: (ticketId: string): Ticket | undefined => {
    if (!ticketId || typeof ticketId !== 'string') {
      throw new ValidationError('ticketId is required and must be a string');
    }

    return complaintsRepository.findById(ticketId);
  },
};
