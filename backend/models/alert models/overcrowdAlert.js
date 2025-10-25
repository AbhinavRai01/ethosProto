import mongoose from 'mongoose';

const overcrowdAlertSchema = new mongoose.Schema({
  location_name: {
    type: String,
    required: true,
    uppercase: true,
  },
  population: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active',
  },

  risk_score:{
    type: Number,
    default: 0,
    required: true
  }
  // The 'timestamp at which alert was created' is handled by 'createdAt'
}, {
  timestamps: true // Adds createdAt and updatedAt
});

overcrowdAlertSchema.index({ location_name: 1 });
overcrowdAlertSchema.index({ status: 1 });

const OvercrowdAlert = mongoose.model('OvercrowdAlert', overcrowdAlertSchema);

export default OvercrowdAlert;
