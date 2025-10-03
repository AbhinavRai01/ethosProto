const mongoose = require('mongoose');

const faceImageSchema = new mongoose.Schema({
 face_id: {
        type: String,
        required: [true, 'A face ID is required for the frame.'],
        trim: true,
    },
    image_path: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("FaceImage", faceImageSchema);