const mongoose = require('mongoose');

// Define the schema for the CCTV Frame
const cctvFrameSchema = new mongoose.Schema({
    // frame_id is handled by MongoDB's default _id field.
    face_id: {
        type: String,
        //required: [true, 'A face ID is required for the frame.'],
        //trim: true,
        // This could reference another collection where face data is stored.
        // For example:
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'FaceProfile'
    },
    
    location_id: {
        type: String,
        required: [true, 'A location ID is required for the frame.'],
        //trim: true,
        // Example: 'ENTRANCE_CAM_01'
    },
    
    timestamp: {
        type: Date,
        required: [true, 'A timestamp is required for the frame.'],
        //default: Date.now,
    },
    
    
}, {
    // Add timestamps for when the record was created and last updated.
    timestamps: true 
});

// Create an index on timestamp for faster time-based queries
cctvFrameSchema.index({ timestamp: -1 });

// Create the model from the schema
const CctvFrame = mongoose.model('CctvFrame', cctvFrameSchema);

module.exports = CctvFrame;
