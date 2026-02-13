import { Request, Response, NextFunction } from 'express';
import { complaintsService } from '../services/complaints.service.js';
import { CreateTicketRequest } from '../types/ticket.types.js';
import { logger } from '../utils/logger.js';

export const complaintsController = {
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
};
