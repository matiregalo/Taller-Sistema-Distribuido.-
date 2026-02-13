import { describe, it, expect, vi, beforeEach } from 'vitest';
import { complaintsRepository } from '../repositories/complaints.repository.js';
import { IncidentType } from '../types/ticket.types.js';
import { ValidationError } from '../errors/validation.error.js';
import type { IMessagingFacade } from '../messaging/IMessagingFacade.js';
import { createComplaintsService } from './complaints.service.js';

// Mock IMessagingFacade
const mockMessaging: IMessagingFacade = {
  publishTicketCreated: vi.fn().mockResolvedValue(undefined),
};

describe('complaintsService', () => {
  const validRequest = {
    lineNumber: '099123456',
    email: 'user@example.com',
    incidentType: IncidentType.NO_SERVICE,
  };

  // Create service with injected mock
  const complaintsService = createComplaintsService(mockMessaging);

  beforeEach(() => {
    vi.clearAllMocks();
    complaintsRepository.clear();
  });

  describe('createTicket', () => {
    it('persiste el ticket con status RECEIVED y priority PENDING', async () => {
      const ticket = await complaintsService.createTicket(validRequest);

      expect(ticket.status).toBe('RECEIVED');
      expect(ticket.priority).toBe('PENDING');
      expect(ticket.ticketId).toBeDefined();
      expect(typeof ticket.ticketId).toBe('string');
    });

    it('siempre devuelve ticketId', async () => {
      const ticket = await complaintsService.createTicket(validRequest);
      expect(ticket.ticketId).toBeDefined();
      expect(ticket.ticketId.length).toBeGreaterThan(0);
    });

    it('publica evento via IMessagingFacade (sin lógica de priorización)', async () => {
      const ticket = await complaintsService.createTicket(validRequest);

      expect(mockMessaging.publishTicketCreated).toHaveBeenCalledTimes(1);
      const publishedTicket = vi.mocked(mockMessaging.publishTicketCreated).mock.calls[0][0];
      expect(publishedTicket.ticketId).toBe(ticket.ticketId);
      expect(publishedTicket.lineNumber).toBe(validRequest.lineNumber);
      expect(publishedTicket.incidentType).toBe(validRequest.incidentType);
      // Facade receives the full Ticket, not a TicketEventPayload
      expect(publishedTicket).not.toHaveProperty('priority', expect.stringMatching(/HIGH|MEDIUM|LOW/));
    });

    it('rechaza request sin lineNumber', async () => {
      await expect(
        complaintsService.createTicket({
          ...validRequest,
          lineNumber: '',
        } as typeof validRequest)
      ).rejects.toThrow(ValidationError);
      await expect(
        complaintsService.createTicket({
          ...validRequest,
          lineNumber: undefined as unknown as string,
        })
      ).rejects.toThrow(/lineNumber/);
    });

    it('rechaza request sin email válido', async () => {
      await expect(
        complaintsService.createTicket({
          ...validRequest,
          email: 'invalid',
        })
      ).rejects.toThrow(ValidationError);
      await expect(
        complaintsService.createTicket({
          ...validRequest,
          email: '',
        } as typeof validRequest)
      ).rejects.toThrow(/email/);
    });

    it('rechaza request sin incidentType válido', async () => {
      await expect(
        complaintsService.createTicket({
          ...validRequest,
          incidentType: 'INVALID_TYPE' as IncidentType,
        })
      ).rejects.toThrow(/incidentType/);
    });

    it('exige description cuando incidentType es OTHER', async () => {
      await expect(
        complaintsService.createTicket({
          ...validRequest,
          incidentType: IncidentType.OTHER,
          description: '',
        })
      ).rejects.toThrow(/description.*OTHER/);

      await expect(
        complaintsService.createTicket({
          ...validRequest,
          incidentType: IncidentType.OTHER,
        })
      ).rejects.toThrow(/description/);

      const withDesc = await complaintsService.createTicket({
        ...validRequest,
        incidentType: IncidentType.OTHER,
        description: 'Detalle del otro tipo',
      });
      expect(withDesc.ticketId).toBeDefined();
      expect(withDesc.status).toBe('RECEIVED');
      expect(withDesc.priority).toBe('PENDING');
    });

    it('guarda el ticket en el repositorio', async () => {
      const ticket = await complaintsService.createTicket(validRequest);
      const found = complaintsRepository.findById(ticket.ticketId);
      expect(found).toBeDefined();
      expect(found?.status).toBe('RECEIVED');
      expect(found?.priority).toBe('PENDING');
    });
  });

  describe('getTicketById', () => {
    it('devuelve el ticket si existe', async () => {
      const created = await complaintsService.createTicket(validRequest);
      const found = complaintsService.getTicketById(created.ticketId);
      expect(found).toBeDefined();
      expect(found?.ticketId).toBe(created.ticketId);
      expect(found?.status).toBe('RECEIVED');
    });

    it('devuelve undefined si el ticket no existe', () => {
      const found = complaintsService.getTicketById('id-inexistente');
      expect(found).toBeUndefined();
    });

    it('lanza ValidationError si ticketId vacío o no string', () => {
      expect(() => complaintsService.getTicketById('')).toThrow(ValidationError);
      expect(() =>
        complaintsService.getTicketById(undefined as unknown as string)
      ).toThrow();
    });
  });
});
