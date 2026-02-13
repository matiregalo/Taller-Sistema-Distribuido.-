import { describe, it, expect, vi, beforeEach } from 'vitest';
import { complaintsService } from './complaints.service';
import { IncidentType } from '../types/incident';

describe('complaintsService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('console', { ...console, error: vi.fn() });
  });

  describe('createComplaint', () => {
    it('envía exactamente lo que el backend espera: lineNumber, email, incidentType, description (sin prioridad)', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ticketId: 'abc-123', status: 'RECEIVED' }),
      } as unknown as Response);

      const payload = {
        email: 'user@test.com',
        lineNumber: '099123456',
        incidentType: IncidentType.NO_SERVICE,
        description: 'Sin internet',
      };

      await complaintsService.createComplaint(payload);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/complaints'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: payload.email,
            lineNumber: payload.lineNumber,
            incidentType: payload.incidentType,
            description: payload.description,
          }),
        })
      );
      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body).not.toHaveProperty('priority');
      expect(body).toEqual({
        email: 'user@test.com',
        lineNumber: '099123456',
        incidentType: 'NO_SERVICE',
        description: 'Sin internet',
      });
    });

    it('no incluye description cuando no se envía (tipos distintos de OTHER)', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ticketId: 'xyz-456', status: 'RECEIVED' }),
      } as unknown as Response);

      await complaintsService.createComplaint({
        email: 'a@b.com',
        lineNumber: '0123456789',
        incidentType: IncidentType.ROUTER_ISSUE,
      });

      const body = JSON.parse((mockFetch.mock.calls[0][1] as RequestInit).body as string);
      expect(body).not.toHaveProperty('description');
      expect(body.incidentType).toBe('ROUTER_ISSUE');
    });

    it('devuelve la respuesta del API (ticketId y status)', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ticketId: 'ticket-1', status: 'RECEIVED' }),
      } as unknown as Response);

      const result = await complaintsService.createComplaint({
        email: 'x@y.com',
        lineNumber: '099111222',
        incidentType: IncidentType.SLOW_CONNECTION,
      });

      expect(result).toEqual({ ticketId: 'ticket-1', status: 'RECEIVED' });
    });

    it('lanza error con mensaje del backend cuando la respuesta no es ok', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ details: 'Email inválido' }),
      } as unknown as Response);

      await expect(
        complaintsService.createComplaint({
          email: 'bad',
          lineNumber: '123',
          incidentType: IncidentType.OTHER,
          description: 'test',
        })
      ).rejects.toThrow('Email inválido');
    });

    it('maneja error cuando el backend devuelve JSON sin details', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Validation failed' }),
      } as unknown as Response);

      await expect(
        complaintsService.createComplaint({
          email: 'a@b.com',
          lineNumber: '123',
          incidentType: IncidentType.BILLING_QUESTION,
        })
      ).rejects.toThrow('Validation failed');
    });

    it('maneja respuesta no ok con body no JSON', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('not json');
        },
      } as unknown as Response);

      await expect(
        complaintsService.createComplaint({
          email: 'a@b.com',
          lineNumber: '123',
          incidentType: IncidentType.NO_SERVICE,
        })
      ).rejects.toThrow('Error en la solicitud');
    });
  });
});
