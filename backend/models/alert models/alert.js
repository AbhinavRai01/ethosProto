import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  // Use the entity_id as the primary key for alerts
  _id: { 
    type: String, 
    required: true 
  },
  
  entity_name: { 
    type: String, 
    default: 'Unknown' 
  },

  status: {
    type: String,
    enum: ['active', 'resolved', 'dismissed'], // Changed 'acknowledged'
    default: 'active',
    index: true
  },

  priority: { // <-- NEW FIELD
    type: String,
    enum: ['normal', 'high'],
    default: 'normal',
    index: true
  },
  
  dismissed_until: { // <-- NEW FIELD
    type: Date,
    index: true // Will be set when a user dismisses an alert
  },

  last_seen_timestamp: { type: Date },
  last_seen_location: { type: String },
  last_seen_source: { type: String },
  
  // This is when the alert was first generated
  alert_generated_at: { 
    type: Date, 
    default: Date.now 
  },

  risk_score:{
    type: Number,
    default: 0,
    required: true
  }
}, {
  timestamps: true // This will update `updatedAt` every time the alert is re-confirmed
});

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;

