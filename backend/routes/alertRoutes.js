import { Router } from 'express';
import {
  getActiveAlerts,
  getHighPriorityAlerts,
  getDismissedAlerts,
  dismissAlert,
  getActiveOvercrowdAlerts,
  getActiveViolationAlerts,
  getAllAlertsSortedByScore,
  getAlertScoreExtremes // Import the new function
} from '../controllers/alertController.js';

const router = Router();

// Routes for Missing Person Alerts
router.get('/missing/active/:page', getActiveAlerts);
router.get('/missing/high/:page', getHighPriorityAlerts); // Note: This now fetches ALL high priority types
router.get('/missing/dismissed/:page', getDismissedAlerts);
router.patch('/missing/:id/dismiss', dismissAlert);

// Routes for Overcrowding Alerts
router.get('/overcrowd/active/:page', getActiveOvercrowdAlerts);

// Routes for Violation Alerts
router.get('/violation/active/:page', getActiveViolationAlerts);

// NEW Route for All Active Alerts Sorted by Score
router.get('/all/sorted-by-score/:page', getAllAlertsSortedByScore);
router.get('/extremes', getAlertScoreExtremes);

export default router;

