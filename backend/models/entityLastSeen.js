import mongoose from 'mongoose';

/**
 * This schema stores the most recent activity for any given entity.
 * The _id will be the entity_id, card_id, face_id, or device_hash,
 * allowing for a fast and efficient 'upsert' operation.
 */
const entityLastSeenSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  }, // This will be the entity_id, card_id, etc.
  
  last_seen_timestamp: { 
    type: Date, 
    required: true 
  },
  
  last_seen_location: { 
    type: String, 
    required: true 
  },
  
  last_seen_source: { 
    type: String, 
    required: true 
  }
}, {
  timestamps: true 
});

entityLastSeenSchema.index({ last_seen_timestamp: -1 });

const EntityLastSeen = mongoose.model('EntityLastSeen', entityLastSeenSchema);

export default EntityLastSeen;
