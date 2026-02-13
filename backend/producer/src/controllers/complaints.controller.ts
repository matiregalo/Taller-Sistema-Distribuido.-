import { Request, Response, NextFunction } from 'express';
import { complaintsService } from '../services/complaints.service.js';
import { logger } from '../utils/logger.js';

export const complaintsController = {
  createComplaint: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract only the fields needed — ISP §3.4
      const { lineNumber, email, incidentType, description } = req.body;

      logger.debug('Received create complaint request', {
        lineNumber,
        incidentType,
      });

      const ticket = await complaintsService.createTicket({
        lineNumber,
        email,
        incidentType,
        description,
      });

      res.status(201).json(ticket);
    } catch (error) {
      next(error);
    }
  },
};
