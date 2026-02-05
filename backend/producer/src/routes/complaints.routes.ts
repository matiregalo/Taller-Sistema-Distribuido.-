import { Router } from 'express';
import { complaintsController } from '../controllers/complaints.controller.js';

const router = Router();

// POST /complaints - Create a new complaint
router.post('/', complaintsController.createComplaint);

// GET /complaints/:ticketId - Get a complaint by ID
router.get('/:ticketId', complaintsController.getComplaintById);

export { router as complaintsRouter };
