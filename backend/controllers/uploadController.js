const multer = require('multer');
const xlsx = require('xlsx');

// Import all the models
const Booking = require('../models/labBookings');
const CctvFrame = require('../models/CctvFrams');
const LibraryCheckout = require('../models/libraryCheckout');
const FreeTextNote = require('../models/freeTextNotes');
const CampusCardSwipe = require('../models/campusCardSwipes'); // Assuming this is the correct path

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Helper function to read Excel file
const readExcelFile = (filePath) => {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
};

// 1. Campus Card Swipes (from your example)
const uploadCampusCardSwipes = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        // This now returns data with real JavaScript Date objects
        const jsonData = readExcelFile(req.file.path);
        
        const swipes = jsonData.map((row) => ({
            card_id: row["card_id"] || row["Card ID"],
            timestamp: row["timestamp"] || row["Timestamp"],
            location_id: row["location_id"] || row["Location ID"] // Added a more likely header name
        }));

        // --- FIX #3: Add validation to ensure data integrity ---
        const validSwipes = swipes.filter(swipe => 
            swipe.timestamp instanceof Date && !isNaN(swipe.timestamp)
        );
        
        if (validSwipes.length === 0) {
            return res.status(400).json({ error: "File contains no valid swipe records with readable timestamps." });
        }

        // It's best practice to clear old data to prevent duplicates on re-upload
        await CampusCardSwipe.deleteMany({});
        await CampusCardSwipe.insertMany(validSwipes);

        res.json({ 
            message: "Campus card swipes uploaded successfully", 
            insertedCount: validSwipes.length 
        });
    } catch (err) {
        console.error("❌ Error uploading campus card swipes:", err);
        res.status(500).json({ error: err.message });
    }
};

// 2. Bookings
const uploadBookings = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        const jsonData = readExcelFile(req.file.path);

        const bookings = jsonData.map((row) => {
            // --- THIS IS THE FIX ---
            // The code now checks for the correct header "attended (YES/NO)" first.
            const attendedValue = row["attended (YES/NO)"] || row["attended"] || row["Attended"];
            
            // This logic correctly handles "Yes", "yes", "TRUE", "true", 1, etc.
            const isAttended = ['true', 'yes', '1'].includes(String(attendedValue).toLowerCase());

            return {
                entity_id: row["entity_id"] || row["Entity ID"],
                room_id: row["room_id"] || row["Room ID"],
                start_time: row["start_time"] || row["Start Time"],
                end_time: row["end_time"] || row["End Time"],
                attended: isAttended
            };
        });

        // Add validation for bookings
        const validBookings = bookings.filter(b => 
            b.start_time instanceof Date && !isNaN(b.start_time) &&
            b.end_time instanceof Date && !isNaN(b.end_time)
        );

        if (validBookings.length === 0) {
            return res.status(400).json({ error: "No valid booking records with readable timestamps found." });
        }
        
        await Booking.deleteMany({});
        await Booking.insertMany(validBookings);
        
        res.json({ message: "Bookings uploaded successfully", insertedCount: validBookings.length });

    } catch (err) {
        console.error("❌ Error uploading bookings:", err);
        res.status(500).json({ error: err.message });
    }
};

// 3. CCTV Frames
const uploadCctvFrames = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const jsonData = readExcelFile(req.file.path);
        const frames = jsonData.map((row) => ({
            location_id: row["location_id"] || row["Location ID"],
            timestamp: new Date(row["timestamp"] || row["Timestamp"]),
            face_id: row["face_id"] || row["Face ID"]
        }));

        await CctvFrame.insertMany(frames);
        res.json({ message: "CCTV frames uploaded successfully", insertedCount: frames.length });
    } catch (err) {
        console.error("❌ Error uploading CCTV frames:", err);
        res.status(500).json({ error: err.message });
    }
};

// 4. Library Checkouts
const uploadLibraryCheckouts = async (req, res) => {
    console.log("Reached uploadLibraryCheckouts controller");
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const jsonData = readExcelFile(req.file.path);
        const checkouts = jsonData.map((row) => ({
            entity_id: row["entity_id"] || row["Entity ID"],
            book_id: row["book_id"] || row["Book ID"],
            timestamp: new Date(row["timestamp"] || row["Timestamp"]),
        }));

        await LibraryCheckout.insertMany(checkouts);
        res.json({ message: "Library checkouts uploaded successfully", insertedCount: checkouts.length });
    } catch (err) {
        console.error("❌ Error uploading library checkouts:", err);
        res.status(500).json({ error: err.message });
    }
};

// 5. Free Text Notes
const uploadFreeTextNotes = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        const jsonData = readExcelFile(req.file.path);
        const notes = jsonData.map((row) => ({
            entity_id: row["entity_id"] || row["Entity ID"],
            category: row["category"] || row["Category"],
            text: row["text"] || row["Text"],
            timestamp: new Date(row["timestamp"] || row["Timestamp"]),
        }));

        await FreeTextNote.insertMany(notes);
        res.json({ message: "Free text notes uploaded successfully", insertedCount: notes.length });
    } catch (err) {
        console.error("❌ Error uploading free text notes:", err);
        res.status(500).json({ error: err.message });
    }
};


module.exports = {
    upload, // The multer middleware
    uploadCampusCardSwipes,
    uploadBookings,
    uploadCctvFrames,
    uploadLibraryCheckouts,
    uploadFreeTextNotes
};
