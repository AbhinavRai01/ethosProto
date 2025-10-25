const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    
    entity_id: {
        type: String,
        required: [true, 'An entity ID is required for the booking.'],
    },
    
    room_id: {
        type: String,
        required: [true, 'A room ID is required for the booking.'],
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
                return value > this.start_time;
            },
            message: 'End time must be after the start time.'
        }
    },
    
    attended: {
        type: Boolean,
    }
}, {
    timestamps: true 
});

const LabBooking = mongoose.model('Booking', bookingSchema);

module.exports = LabBooking;
