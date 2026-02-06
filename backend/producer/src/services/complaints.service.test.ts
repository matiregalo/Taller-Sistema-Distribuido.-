import { describe, it, expect, vi, beforeEach } from 'vitest';
import { complaintsService } from './complaints.service.js';
import { complaintsRepository } from '../repositories/complaints.repository.js';
import * as rabbitmq from '../messaging/rabbitmq.js';
import { IncidentType } from '../types/ticket.types.js';
import { ValidationError } from '../errors/validation.error.js';

vi.mock('../messaging/rabbitmq.js', () => ({
  publishTicketEvent: vi.fn().mockResolvedValue(true),
}));

describe('complaintsService', () => {
  const validRequest = {
    lineNumber: '099123456',
    email: 'user@example.com',
    incidentType: IncidentType.NO_SERVICE,
  };

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

    it('publica evento complaint.received (sin lógica de priorización)', async () => {
      await complaintsService.createTicket(validRequest);

      expect(rabbitmq.publishTicketEvent).toHaveBeenCalledTimes(1);
      const payload = vi.mocked(rabbitmq.publishTicketEvent).mock.calls[0][0];
      expect(payload).toHaveProperty('ticketId');
      expect(payload).toHaveProperty('lineNumber', validRequest.lineNumber);
      expect(payload).toHaveProperty('type', validRequest.incidentType);
      expect(payload).not.toHaveProperty('priority');
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
