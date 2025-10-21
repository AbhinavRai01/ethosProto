import express from 'express';
const router = express.Router();

// Import the controller functions and the multer middleware from your controller file
import {
    uploadCampusCardSwipes,
    uploadBookings,
    uploadCctvFrames,
    uploadLibraryCheckouts,
    uploadFreeTextNotes,
    uploadWifiLogs,
    uploadFaceImages,
    uploadFaceEmbeddings
} from '../controllers/uploadController.js';

import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

// --- Define API routes for uploading each type of Excel file ---

// Each route uses the 'upload.single('file')' middleware to handle the file upload
// The 'file' string must match the name attribute of the file input in your frontend form.

// POST /api/uploads/swipes
router.post('/swipes', upload.single('file'), uploadCampusCardSwipes);

// POST /api/uploads/bookings
router.post('/bookings', upload.single('file'), uploadBookings);

// POST /api/uploads/cctv
router.post('/cctv', upload.single('file'), uploadCctvFrames);

// POST /api/uploads/library
router.post('/library', upload.single('file'), uploadLibraryCheckouts);

// POST /api/uploads/notes
router.post('/notes', upload.single('file'), uploadFreeTextNotes);

router.post('/wifi', upload.single('file'), uploadWifiLogs);

router.post('/faces', upload.single('file'), uploadFaceImages);

router.post('/embeddings', upload.single('file'), uploadFaceEmbeddings);

export default router
