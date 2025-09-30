const mongoose = require('mongoose');

// Define the schema for a Library Checkout event
const libraryCheckoutSchema = new mongoose.Schema({
    // checkout_id is handled by MongoDB's default _id field.

    entity_id: {
        type: String,
        required: [true, 'An entity ID (user) is required for the checkout.'],
        trim: true,
        // For more robust applications, this could reference a User/Entity collection:
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'Entity'
    },

    book_id: {
        type: String,
        required: [true, 'A book ID is required for the checkout.'],
        trim: true,
        // This could also reference a Book collection:
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'Book'
    },

    timestamp: {
        type: Date,
        required: [true, 'A timestamp for the checkout is required.'],
        default: Date.now,
    },
    
    // Optional: You might want to add a due date and a returned status
    // dueDate: {
    //     type: Date,
    //     required: true
    // },
    // returned: {
    //     type: Boolean,
    //     default: false
    // }

}, {
    // Adds createdAt and updatedAt timestamps to the document
    timestamps: true
});

// Create indexes for fields that will be frequently queried
libraryCheckoutSchema.index({ entity_id: 1 });
libraryCheckoutSchema.index({ book_id: 1 });
libraryCheckoutSchema.index({ timestamp: -1 });

// Create the model from the schema
const LibraryCheckout = mongoose.model('LibraryCheckout', libraryCheckoutSchema);

module.exports = LibraryCheckout;
