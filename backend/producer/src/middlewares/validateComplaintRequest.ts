import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/validation.error.js';
import { IncidentType, CreateTicketRequest } from '../types/ticket.types.js';

const VALID_INCIDENT_TYPES: IncidentType[] = [
  IncidentType.NO_SERVICE,
  IncidentType.INTERMITTENT_SERVICE,
  IncidentType.SLOW_CONNECTION,
  IncidentType.ROUTER_ISSUE,
  IncidentType.BILLING_QUESTION,
  IncidentType.OTHER,
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validation middleware for complaint creation requests (SRP §3.1).
 * Extracts validation logic from the service layer into a middleware.
 * Throws ValidationError (HttpError 400) on invalid input.
 */
export const validateComplaintRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const request = req.body as CreateTicketRequest;

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

  next();
};
