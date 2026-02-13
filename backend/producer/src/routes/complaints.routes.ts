import { Router } from 'express';
import { complaintsController } from '../controllers/complaints.controller.js';

const router = Router();

// POST /complaints - Create a new complaint (publish event)
router.post('/', complaintsController.createComplaint);

export { router as complaintsRouter };
