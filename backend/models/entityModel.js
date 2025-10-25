const mongoose = require("mongoose");

const entitySchema = new mongoose.Schema({
  entity_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String },
  email: { type: String, lowercase: true, trim: true },
  department: { type: String },
  student_id: { type: String },
  staff_id: { type: String },
  card_id: { type: String },
  device_hash: { type: String },
  face_id: { type: String },
}, {
  timestamps: true 
});

module.exports = mongoose.model("Entity", entitySchema);
