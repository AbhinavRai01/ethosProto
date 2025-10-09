const mongoose = require('mongoose');

const faceEmbeddingSchema = new mongoose.Schema({
    face_id: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    embedding: {
        type: [Number],
        required: true
    }
}, { timestamps: true
});

module.exports = mongoose.model('FaceEmbedding', faceEmbeddingSchema);
