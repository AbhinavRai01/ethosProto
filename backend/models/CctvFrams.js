const mongoose = require('mongoose');

// Define the schema for the CCTV Frame
const cctvFrameSchema = new mongoose.Schema({
    // frame_id is handled by MongoDB's default _id field.
    face_id: {
        type: String,
    },
    
    location_id: {
        type: String,
        required: [true, 'A location ID is required for the frame.'],
    },
    
    timestamp: {
        type: Date,
        required: [true, 'A timestamp is required for the frame.'],
    },
    
    
}, {
    timestamps: true 
});

cctvFrameSchema.index({ timestamp: -1 });

// Create the model from the schema
const CctvFrame = mongoose.model('CctvFrame', cctvFrameSchema);

module.exports = CctvFrame;
