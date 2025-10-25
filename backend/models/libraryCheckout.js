const mongoose = require('mongoose');

// Define the schema for a Library Checkout event
const libraryCheckoutSchema = new mongoose.Schema({

    entity_id: {
        type: String,
        required: [true, 'An entity ID (user) is required for the checkout.'],
        trim: true,
    },

    book_id: {
        type: String,
        required: [true, 'A book ID is required for the checkout.'],
        trim: true,
    },

    timestamp: {
        type: Date,
        required: [true, 'A timestamp for the checkout is required.'],
        default: Date.now,
    },

}, {
    timestamps: true
});

// Create indexes for fields that will be frequently queried
libraryCheckoutSchema.index({ entity_id: 1 });
libraryCheckoutSchema.index({ book_id: 1 });
libraryCheckoutSchema.index({ timestamp: -1 });

const LibraryCheckout = mongoose.model('LibraryCheckout', libraryCheckoutSchema);

module.exports = LibraryCheckout;
