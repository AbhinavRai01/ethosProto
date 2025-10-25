const mongoose = require('mongoose');

const cctvFrameSchema = new mongoose.Schema({
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

const CctvFrame = mongoose.model('CctvFrame', cctvFrameSchema);

module.exports = CctvFrame;
