import mongoose from 'mongoose';

const violationAlertSchema = new mongoose.Schema({
  entity_id: {
    type: String,
    required: true,
    trim: true,
  },
  location_id: {
    type: String,
    required: true,
    uppercase: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  violation_type: {
    type: String,
    required: true,
    enum: ['ACCESS_DENIED', 'UNAUTHORIZED_AREA', 'WRONG_TIME', 'OTHER'],
    default: 'OTHER',
  },
  status: {
    type: String,
    enum: ['active', 'dismissed', 'resolved'],
    default: 'active',
  },

  risk_score:{
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

violationAlertSchema.index({ entity_id: 1 });
violationAlertSchema.index({ location_id: 1 });
violationAlertSchema.index({ status: 1 });
violationAlertSchema.index({ timestamp: -1 });

const ViolationAlert = mongoose.model('ViolationAlert', violationAlertSchema);

export default ViolationAlert;
