const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const dotenv = require('dotenv');

// Import all the models
const Booking = require('../models/labBookings');
const CctvFrame = require('../models/CctvFrams');
const LibraryCheckout = require('../models/libraryCheckout');
const FreeTextNote = require('../models/freeTextNotes');
const CampusCardSwipe = require('../models/campusCardSwipes'); 
const WifiLog = require('../models/wifiLogs');
const FaceImage = require('../models/faceImages');
const FaceEmbedding = require('../models/faceEmbeddings');

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
        const jsonData = readExcelFile(req.file.path);
        
        const swipes = jsonData.map((row) => ({
            card_id: row["card_id"] || row["Card ID"],
            timestamp: row["timestamp"] || row["Timestamp"],
            location_id: row["location_id"] || row["Location ID"] 
        }));

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
            const attendedValue = row["attended (YES/NO)"] || row["attended"] || row["Attended"];
            
            const isAttended = ['true', 'yes', '1'].includes(String(attendedValue).toLowerCase());

            return {
                entity_id: row["entity_id"] || row["Entity ID"],
                room_id: row["room_id"] || row["Room ID"],
                start_time: row["start_time"] || row["Start Time"],
                end_time: row["end_time"] || row["End Time"],
                attended: isAttended
            };
        });

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
        const response = await fetch(`${process.env.FLASK_API}/cctv-cleaner`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonData)
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Flask API Error Response:", errorBody);
            throw new Error(`Flask API call failed with status: ${response.status}`);
        }
        const cleanedData = await response.json();

        const frames = cleanedData.map((row) => ({
            location_id: row["location_id"] || row["Location ID"],
            timestamp: new Date(row["timestamp"] || row["Timestamp"]),
            face_id: row["face_id"] || row["Face ID"]
        }));

        const deleteResult = await CctvFrame.deleteMany({});
        await CctvFrame.insertMany(frames);
        
        res.json({ 
            message: "CCTV data replaced successfully", 
            deletedCount: deleteResult.deletedCount,
            insertedCount: frames.length 
        });
    } catch (err) {
        console.error("❌ Error uploading CCTV frames:", err);
        res.status(500).json({ error: err.message });
    }
};

const uploadLibraryCheckouts = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const jsonData = readExcelFile(req.file.path);
        const checkouts = jsonData.map((row) => ({
            entity_id: row["entity_id"] || row["Entity ID"],
            book_id: row["book_id"] || row["Book ID"],
            timestamp: row["timestamp"] || row["Timestamp"],
        }));
        const validCheckouts = checkouts.filter(checkout =>
            checkout.timestamp instanceof Date && !isNaN(checkout.timestamp)
        );
        if (validCheckouts.length === 0) {
            return res.status(400).json({ error: "File contains no valid checkout records with readable timestamps." });
        }
        await LibraryCheckout.deleteMany({});
        await LibraryCheckout.insertMany(validCheckouts);

        res.json({ message: "Library checkouts uploaded successfully", insertedCount: validCheckouts.length });
    } catch (err) {
        console.error("❌ Error uploading library checkouts:", err);
        res.status(500).json({ error: err.message });
    }
};;

const uploadFreeTextNotes = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        const jsonData = readExcelFile(req.file.path);
        const notes = jsonData.map((row) => ({
            entity_id: row["entity_id"] || row["Entity ID"],
            category: row["category"] || row["Category"],
            text: row["text"] || row["Text"],
            timestamp: row["timestamp"] || row["Timestamp"], 
        }));
        const validNotes = notes.filter(note => 
            note.timestamp instanceof Date && !isNaN(note.timestamp)
        );
        if (validNotes.length === 0) {
            return res.status(400).json({ error: "File contains no valid note records with readable timestamps." });
        }
        await FreeTextNote.deleteMany({});
        await FreeTextNote.insertMany(validNotes);
        
        res.json({ 
            message: "Free text notes uploaded successfully", 
            insertedCount: validNotes.length 
        });
    } catch (err) {
        console.error("❌ Error uploading free text notes:", err);
        res.status(500).json({ error: err.message });
    }
};

const uploadWifiLogs = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const jsonData = readExcelFile(req.file.path);
        const logs = jsonData.map((row) => ({
            device_hash: row["device_hash"] || row["Device Hash"],
            ap_id: row["ap_id"] || row["AP ID"],
            timestamp: row["timestamp"] || row["Timestamp"],
        }));
        
        const validLogs = logs.filter(l => l.timestamp instanceof Date && !isNaN(l.timestamp));
        if (validLogs.length === 0) return res.status(400).json({ error: "No valid WiFi log records found." });

        await WifiLog.deleteMany({});
        await WifiLog.insertMany(validLogs);
        res.json({ message: "WiFi logs uploaded successfully", insertedCount: validLogs.length });
    } catch (err) {
        console.error("❌ Error uploading WiFi logs:", err);
        res.status(500).json({ error: err.message });
    }
};

const uploadFaceImages = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No .zip file uploaded" });
        }
        const facesDir = path.join(__dirname, '..', 'public', 'faces');
        if (!fs.existsSync(facesDir)) {
            fs.mkdirSync(facesDir, { recursive: true });
        }
        const imageRecords = [];
        await fs.createReadStream(req.file.path)
            .pipe(unzipper.Parse())
            .on('entry', function (entry) {
                const fileName = entry.path;
                const fileType = entry.type;
                const fileExtension = path.extname(fileName).toLowerCase();

                if (fileType === 'File' && ['.png', '.jpg', '.jpeg'].includes(fileExtension)) {
                    const faceId = path.basename(fileName, fileExtension);
                    const savePath = path.join(facesDir, fileName);
                    
                    entry.pipe(fs.createWriteStream(savePath));
                    
                    imageRecords.push({
                        face_id: faceId,
                        image_path: `/faces/${fileName}` 
                    });
                } else {
                    entry.autodrain();
                }
            })
            .promise();
        if (imageRecords.length > 0) {
            await FaceImage.deleteMany({});
            await FaceImage.insertMany(imageRecords);
        }
        res.json({ message: "Face images uploaded successfully", insertedCount: imageRecords.length });
    } catch (err) {
        console.error("❌ Error uploading face images:", err);
        res.status(500).json({ error: err.message });
    }
};

const uploadFaceEmbeddings = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        const jsonData = readExcelFile(req.file.path);
        
        const embeddings = jsonData.map((row) => {
            const embeddingString = row["embedding"] || row["Embedding"];
            let embeddingArray = [];
            if (embeddingString) {
                try {
                    embeddingArray = JSON.parse(embeddingString);
                } catch (e) {
                    console.error(`Failed to parse embedding for face_id: ${row["face_id"]}`);
                }
            }
            return {
                face_id: row["face_id"] || row["Face ID"],
                embedding: embeddingArray
            };
        });

        const validEmbeddings = embeddings.filter(e => e.face_id && Array.isArray(e.embedding) && e.embedding.length > 0);
        if (validEmbeddings.length === 0) return res.status(400).json({ error: "No valid face embedding records found." });

        await FaceEmbedding.deleteMany({});
        await FaceEmbedding.insertMany(validEmbeddings);
        res.json({ message: "Face embeddings uploaded successfully", insertedCount: validEmbeddings.length });
    } catch (err) {
        console.error("❌ Error uploading face embeddings:", err);
        res.status(500).json({ error: err.message });
    }
};


module.exports = {
    upload, // The multer middleware
    uploadCampusCardSwipes,
    uploadBookings,
    uploadCctvFrames,
    uploadLibraryCheckouts,
    uploadFreeTextNotes,
    uploadWifiLogs,
    uploadFaceImages,
    uploadFaceEmbeddings
};