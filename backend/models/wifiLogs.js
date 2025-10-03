const mongoose = require('mongoose');

const wifiLogsSchema = new mongoose.Schema({
  device_hash: { type: String, required: true },       
  ap_id: { type: String, required: true },   // location where swipe happened
  timestamp: { type: Date, required: true }    
}, {
  timestamps: true
});

module.exports = mongoose.model("WifiLog", wifiLogsSchema);