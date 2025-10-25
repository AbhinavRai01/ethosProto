import mongoose from 'mongoose';

const entityRiskSchema = new mongoose.Schema({
  // Use entity_id as the primary key for faster lookups
  _id: {
    type: String, // Corresponds to entity_id
    required: true,
  },
  risk_score: {
    type: Number,
    required: true,
    default: 10, // Default risk score
    min: 0,
  }
}, {
  timestamps: true // Tracks when the risk score was last updated
});

// Index the risk score if you need to query entities by risk level
entityRiskSchema.index({ risk_score: 1 });

const EntityRisk = mongoose.model('EntityRisk', entityRiskSchema);

export default EntityRisk;
