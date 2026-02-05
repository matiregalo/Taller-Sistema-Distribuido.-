import { Request, Response, NextFunction } from 'express';
import { complaintsService, ValidationError } from '../services/complaints.service.js';
import { CreateTicketRequest } from '../types/ticket.types.js';
import { logger } from '../utils/logger.js';

export const complaintsController = {
  /**
   * POST /complaints
   * Create a new complaint ticket
   */
  createComplaint: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const request: CreateTicketRequest = req.body;

      logger.debug('Received create complaint request', {
        lineNumber: request.lineNumber,
        incidentType: request.incidentType,
      });

      const ticket = await complaintsService.createTicket(request);

      res.status(201).json(ticket);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /complaints/:ticketId
   * Get a complaint ticket by ID
   */
  getComplaintById: (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      const { ticketId } = req.params;

      logger.debug('Received get complaint request', { ticketId });

      const ticket = complaintsService.getTicketById(ticketId);

      if (!ticket) {
        res.status(404).json({ error: 'Ticket not found' });
        return;
      }

      res.status(200).json(ticket);
    } catch (error) {
      next(error);
    }
  },
};
