const mongoose = require('mongoose');

const freeTextNoteSchema = new mongoose.Schema({

    entity_id: {
        type: String,
        required: [true, 'An entity ID is required for the note.'],
        trim: true,
    },

    category: {
        type: String,
        required: [true, 'A category is required for the note.'],
        trim: true,
        default: 'General'
    },

    text: {
        type: String,
        required: [true, 'The note text cannot be empty.'],
        trim: true,
    },

    timestamp: {
        type: Date,
        required: [true, 'A timestamp is required.'],
        default: Date.now,
    },
}, {
    timestamps: true
});

freeTextNoteSchema.index({ entity_id: 1 });
freeTextNoteSchema.index({ category: 1 });
freeTextNoteSchema.index({ timestamp: -1 });

// Create the model from the schema
const FreeTextNote = mongoose.model('FreeTextNote', freeTextNoteSchema);

module.exports = FreeTextNote;