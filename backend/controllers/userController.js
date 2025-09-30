const mongoose = require('mongoose');
const express = require('express');
const multer = require("multer");
const xlsx = require("xlsx");
const Entity = require('../models/entityModel');
const campusCardSwipes = require('../models/campusCardSwipes');
const CctvFrame = require('../models/CctvFrams');
const LabBooking = require('../models/labBookings');

const upload = multer({ dest: 'uploads/' });

const uploadEntities = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 1. Read the Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    // 2. Transform Excel rows → Entity objects
    const entities = jsonData.map((row) => ({
      entity_id: row["entity_id"] || row["Entity ID"], // handles different header naming
      name: row["name"] || row["Name"],
      role: row["role"] || row["Role"],
      email: row["email"] || row["Email"],
      department: row["department"] || row["Department"],
      student_id: row["student_id"] || row["Student ID"],
      staff_id: row["staff_id"] || row["Staff ID"],
      card_id: row["card_id"] || row["Card ID"],
      device_hash: row["device_hash"] || row["Device Hash"],
      face_id: row["face_id"] || row["Face ID"],
    }));

    // 3. Save to MongoDB (bulk insert)
    await Entity.insertMany(entities);

    // 4. Respond
    res.json({
      message: "Entities uploaded successfully",
      insertedCount: entities.length,
    });
  } catch (err) {
    console.error("❌ Error uploading entities:", err);
    res.status(500).json({ error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId;
    console.log("Fetching user with ID:", userId);
    const user = await Entity.findOne({entity_id: userId});

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('❌ Error fetching user by ID:', err);
    res.status(500).json({ error: err.message });
  }
};

const getSwipesByEntityId = async (req, res) => {
  try {
    const entityId = req.params.entityId;
    const cardId = await Entity.findOne({ entity_id: entityId }).select('card_id');

    console.log("Card ID:", cardId);
    const swipes = await campusCardSwipes.find({ card_id: cardId.card_id });
    //console.log("Swipes found:", swipes);
    res.json(swipes);
  } catch (err) {
    console.error('❌ Error fetching swipes by entity ID:', err);
    res.status(500).json({ error: err.message });
  }
};

const getCCTVCapturesByEntityId = async (req, res) => {
    try {
        const entityId = req.params.entityId;
        const faceId = await Entity.findOne({ entity_id: entityId }).select('face_id');
        console.log("Face ID:", faceId);
        const CCTVCaptures = await CctvFrame.find({ face_id: faceId.face_id });
        //console.log("CCTV captures found:", CCTVCaptures);
        res.json(CCTVCaptures);
    } catch (err) {
        console.error('❌ Error fetching CCTV captures by entity ID:', err);
        res.status(500).json({ error: err.message });
    }
};

const getBookingsByEntityId = async (req,res) => {
  try {
    const entityId = req.params.entityId;
    const Bookings = await LabBooking.find({ entity_id: entityId })
    console.log("Bookings found:", Bookings);
    res.json(Bookings);
  } catch(err) {
     console.error('❌ Error fetching Bookings by entity ID:', err);
        res.status(500).json({ error: err.message });
  }
};

module.exports = { uploadEntities, getSwipesByEntityId, getUserById, getCCTVCapturesByEntityId, getBookingsByEntityId };