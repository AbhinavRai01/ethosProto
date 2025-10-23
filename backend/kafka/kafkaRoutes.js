import { Router } from 'express';
import {
  handleCardSwipe,
  handleCctvFrame,
  handleFreeTextNote,
  handleLabBooking,
  handleLibraryCheckout,
  handleWifiLog
} from './kafkaController.js';

const router = Router();

// Route for card swipes
router.post('/cardswipes', handleCardSwipe);

// Route for CCTV frames
router.post('/cctv-frame', handleCctvFrame);

// Route for free text notes
router.post('/note', handleFreeTextNote);

// Route for lab bookings
router.post('/booking', handleLabBooking);

// Route for library checkouts
router.post('/checkout', handleLibraryCheckout);

// Route for WiFi logs
router.post('/wifi-log', handleWifiLog);

export default router;

