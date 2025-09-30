const mongoose = require("mongoose");

const campusCardSwipeSchema = new mongoose.Schema({
  card_id: { type: String, required: true },       // links to entity.card_id
  location_id: { type: String, required: true },   // location where swipe happened
  timestamp: { type: Date, required: true }        // when it happened
}, {
  timestamps: true // adds createdAt, updatedAt for auditing
});

module.exports = mongoose.model("CampusCardSwipe", campusCardSwipeSchema);
