const mongoose = require('mongoose');

// Define the schema for the Room Booking
const bookingSchema = new mongoose.Schema({
    // booking_id is handled by MongoDB's default _id field, which is a unique identifier.
    
    entity_id: {
        type: String,
        required: [true, 'An entity ID is required for the booking.'],
        trim: true,
        // Example: 'F100000'. Could also be a reference to another model if you have a User/Entity collection:
        // type: mongoose.Schema.Types.ObjectId,
        // ref: 'Entity' 
    },
    
    room_id: {
        type: String,
        required: [true, 'A room ID is required for the booking.'],
        trim: true,
        // Example: 'CR-301'
    },
    
    start_time: {
        type: Date,
        required: [true, 'A start time is required.'],
    },
    
    end_time: {
        type: Date,
        required: [true, 'An end time is required.'],
        // Add a custom validator to ensure the end time is after the start time
        validate: {
            validator: function(value) {
                // `this` refers to the document being saved
                return value > this.start_time;
            },
            message: 'End time must be after the start time.'
        }
    },
    
    attended: {
        type: Boolean,
        // The booking is not attended until explicitly marked, so `false` is a sensible default.
        default: false, 
    }
}, {
    // Add timestamps for createdAt and updatedAt fields
    timestamps: true 
});

// Create the model from the schema
const LabBooking = mongoose.model('Booking', bookingSchema);

module.exports = LabBooking;
