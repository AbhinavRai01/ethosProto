import mongoose from 'mongoose';

const etlStateSchema = new mongoose.Schema({
  _id: { 
    type: String, 
    required: true 
  },
  
  lastProcessedTimestamp: { 
    type: Date, 
    required: true 
  },
}, {
  timestamps: true
});

const EtlState = mongoose.model('EtlState', etlStateSchema);

export default EtlState;
