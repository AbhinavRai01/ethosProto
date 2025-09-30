const mongoose = require('mongoose');

// Define the schema for a Free Text Note
const freeTextNoteSchema = new mongoose.Schema({
    // note_id is handled by MongoDB's default _id field.

    entity_id: {
        type: String,
        required: [true, 'An entity ID is required for the note.'],
        trim: true,
        // This could also be a reference to a User/Entity collection:
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'Entity'
    },

    category: {
        type: String,
        required: [true, 'A category is required for the note.'],
        trim: true,
        // Example categories, you can customize this list
      //  enum: ['Academic', 'Behavioral', 'Administrative', 'Personal', 'General'],
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
    
    // You could also add an author field if multiple people can add notes
    // author_id: {
    //     type: String,
    //     required: [true, 'An author ID is required.']
    // }

}, {
    // Adds createdAt and updatedAt timestamps to the document
    timestamps: true
});

// Create indexes for fields that will be frequently queried to improve performance
freeTextNoteSchema.index({ entity_id: 1 });
freeTextNoteSchema.index({ category: 1 });
freeTextNoteSchema.index({ timestamp: -1 });

// Create the model from the schema
const FreeTextNote = mongoose.model('FreeTextNote', freeTextNoteSchema);

module.exports = FreeTextNote;