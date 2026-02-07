import { describe, it, expect, vi, beforeEach } from 'vitest';
import { complaintsController } from './complaints.controller.js';
import * as complaintsService from '../services/complaints.service.js';
import { IncidentType } from '../types/ticket.types.js';
import type { Request, Response, NextFunction } from 'express';

vi.mock('../services/complaints.service.js', () => ({
  complaintsService: {
    createTicket: vi.fn(),
    getTicketById: vi.fn(),
  },
}));

describe('complaintsController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    vi.mocked(complaintsService.complaintsService.createTicket).mockReset();
    vi.mocked(complaintsService.complaintsService.getTicketById).mockReset();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    mockNext = vi.fn();
  });

  describe('createComplaint', () => {
    it('devuelve 201 y el ticket cuando createTicket resuelve', async () => {
      const ticket = {
        ticketId: 't-1',
        status: 'RECEIVED' as const,
        priority: 'PENDING' as const,
        lineNumber: '099',
        email: 'a@b.com',
        incidentType: IncidentType.NO_SERVICE,
        description: null,
        createdAt: new Date(),
      };
      vi.mocked(complaintsService.complaintsService.createTicket).mockResolvedValue(ticket);
      mockReq = { body: { lineNumber: '099', email: 'a@b.com', incidentType: IncidentType.NO_SERVICE } };

      await complaintsController.createComplaint(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(ticket);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('llama a next(error) cuando createTicket lanza', async () => {
      const err = new Error('DB error');
      vi.mocked(complaintsService.complaintsService.createTicket).mockRejectedValue(err);
      mockReq = { body: { lineNumber: '099', email: 'a@b.com', incidentType: IncidentType.NO_SERVICE } };

      await complaintsController.createComplaint(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(err);
    });
  });

  describe('getComplaintById', () => {
    it('devuelve 404 cuando el ticket no existe', () => {
      vi.mocked(complaintsService.complaintsService.getTicketById).mockReturnValue(undefined);
      mockReq = { params: { ticketId: 'id-123' } };

      complaintsController.getComplaintById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Ticket not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('devuelve 200 y el ticket cuando existe', () => {
      const ticket = {
        ticketId: 'id-123',
        status: 'IN_PROGRESS' as const,
        priority: 'HIGH' as const,
        lineNumber: '099',
        email: 'a@b.com',
        incidentType: IncidentType.NO_SERVICE,
        description: null,
        createdAt: new Date(),
      };
      vi.mocked(complaintsService.complaintsService.getTicketById).mockReturnValue(ticket);
      mockReq = { params: { ticketId: 'id-123' } };

      complaintsController.getComplaintById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(ticket);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('llama a next(error) cuando getTicketById lanza', () => {
      const err = new Error('Unexpected');
      vi.mocked(complaintsService.complaintsService.getTicketById).mockImplementation(() => {
        throw err;
      });
      mockReq = { params: { ticketId: 'id-123' } };

      complaintsController.getComplaintById(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(err);
    });
  });
});
