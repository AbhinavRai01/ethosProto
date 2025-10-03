const express = require('express');
const router = express.Router();

const { uploadEntities, getSwipesByEntityId, getUserById, getCCTVCapturesByEntityId, getBookingsByEntityId, getDeviceByEntityId, getCheckoutsByEntityId, getNotesByEntityId, getFacesByEntityId } = require('../controllers/userController');

const multer = require("multer");
const upload = multer({ dest: 'uploads/' });
// Route to upload entities via Excel file
router.post('/upload', upload.single('file'), uploadEntities);
router.get('/:userId', getUserById);
router.get('/:entityId/swipes', getSwipesByEntityId);
router.get('/:entityId/captures', getCCTVCapturesByEntityId);
router.get('/:entityId/bookings', getBookingsByEntityId);
router.get('/:entityId/device', getDeviceByEntityId);
router.get('/:entityId/checkouts', getCheckoutsByEntityId);
router.get('/:entityId/notes', getNotesByEntityId);
router.get('/:entityId/face', getFacesByEntityId);

module.exports = router;