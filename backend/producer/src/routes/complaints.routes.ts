import { Router } from 'express';
import { complaintsController } from '../controllers/complaints.controller.js';
import { validateComplaintRequest } from '../middlewares/validateComplaintRequest.js';

const router = Router();

// POST /complaints - Validate input, then create a new complaint (publish event)
router.post('/', validateComplaintRequest, complaintsController.createComplaint);

export { router as complaintsRouter };
