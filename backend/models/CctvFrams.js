const mongoose = require('mongoose');

// Define the schema for the CCTV Frame
const cctvFrameSchema = new mongoose.Schema({
    // frame_id is handled by MongoDB's default _id field.
    
    location_id: {
        type: String,
        required: [true, 'A location ID is required for the frame.'],
        trim: true,
        // Example: 'ENTRANCE_CAM_01'
    },
    
    timestamp: {
        type: Date,
        required: [true, 'A timestamp is required for the frame.'],
        default: Date.now,
    },
    
    face_id: {
        type: String,
        required: [true, 'A face ID is required for the frame.'],
        trim: true,
        // This could reference another collection where face data is stored.
        // For example:
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'FaceProfile'
    },
    
    // Optional: You might want to store the image data or a path to it.
    // imageUrl: {
    //     type: String,
    //     required: [true, 'An image URL or path is required.']
    // }

}, {
    // Add timestamps for when the record was created and last updated.
    timestamps: true 
});

// Create an index on timestamp for faster time-based queries
cctvFrameSchema.index({ timestamp: -1 });

// Create the model from the schema
const CctvFrame = mongoose.model('CctvFrame', cctvFrameSchema);

module.exports = CctvFrame;
