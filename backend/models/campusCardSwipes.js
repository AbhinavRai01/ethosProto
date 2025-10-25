const mongoose = require("mongoose");

const campusCardSwipeSchema = new mongoose.Schema({
  card_id: { type: String, required: true },      
  location_id: { type: String, required: true },   
  timestamp: { type: Date, required: true }        
}, {
  timestamps: true 
});

module.exports = mongoose.model("CampusCardSwipe", campusCardSwipeSchema);
