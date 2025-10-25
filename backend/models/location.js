import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  location_name: {
    type: String, 
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
    capacity: { 
    type: Number,
    default: 2000, 
    min: 0,
  }
}, {
  timestamps: true 
});

locationSchema.index({ current_population: -1 });
locationSchema.index({ location_name: 1 });

const Location = mongoose.model('Location', locationSchema);

export default Location;
