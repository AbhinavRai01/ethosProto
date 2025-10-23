import { Router } from 'express';
import { getActiveAlerts,getHighPriorityAlerts,getDismissedAlerts, dismissAlert } from '../controllers/alertController.js';

const router = Router();

// GET /api/datasteam/alerts
// Fetches all alerts with status 'active'
router.get('/active/:page', getActiveAlerts);
router.get('/high/:page', getHighPriorityAlerts);
router.get('/dismissed/:page',getDismissedAlerts);
// PATCH /api/datasteam/alerts/:id/dismiss
// Moves an alert's status to 'dismissed' for 12 hours
router.patch('/:id/dismiss', dismissAlert);

export default router;
