const express = require('express');
const router = express.Router();

// Import the controller functions and the multer middleware from your controller file
const {
    upload,
    uploadCampusCardSwipes,
    uploadBookings,
    uploadCctvFrames,
    uploadLibraryCheckouts,
    uploadFreeTextNotes
} = require('../controllers/uploadController');

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

module.exports = router;
