import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  location_name: {
    type: String, // e.g., "LIB_ENT", "CAF_01", "AUDITORIUM"
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  current_population: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },

  risk_factor:{
    type: Number,
    required : true,
    default: 5
  },
    capacity: { // <-- NEW FIELD
    type: Number,
    default: 2000, // Keep your previous default
    min: 0,
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for sorting by population
locationSchema.index({ current_population: -1 });
// Index for finding by name
locationSchema.index({ location_name: 1 });

const Location = mongoose.model('Location', locationSchema);

export default Location;
