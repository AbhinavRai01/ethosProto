import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import EntityLastSeen from '../models/entityLastSeen.js';
import EtlState from '../models/etlStateModel.js';
import Entity from '../models/entityModel.js';
import Alert from '../models/alert.js';
import CampusCardSwipe from '../models/campusCardSwipes.js';
import CctvFrame from '../models/CctvFrams.js';
import LabBooking from '../models/labBookings.js';
import LibraryCheckout from '../models/libraryCheckout.js';
import WifiLog from '../models/wifiLogs.js';

configDotenv();

// --- Configuration ---
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:20000/swipe-db";
const CHECK_INTERVAL_MS = 1000 * 60 * 15; // Run every 15 minutes
const ALERT_THRESHOLD_HOURS = 12;
const HIGH_PRIORITY_THRESHOLD_HOURS = 24;
const ETL_STATE_ID = 'alert-service-last-run';

let lastProcessedTimestamp = new Date(0);

/**
 * Loads all ID mappings from the Entity collection into memory.
 */
const loadIdMappings = async () => {
  console.log('Loading ID mappings from Entity collection...');
  const mappings = await Entity.find({
    $or: [
      { card_id: { $ne: null } },
      { face_id: { $ne: null } },
      { device_hash: { $ne: null } }
    ]
  }).lean();
  
  const idMaps = {
    cardIdToEntityMap: new Map(),
    faceIdToEntityMap: new Map(),
    deviceHashToEntityMap: new Map()
  };

  for (const entity of mappings) {
    if (entity.card_id) idMaps.cardIdToEntityMap.set(entity.card_id, entity.entity_id);
    if (entity.face_id) idMaps.faceIdToEntityMap.set(entity.face_id, entity.entity_id);
    if (entity.device_hash) idMaps.deviceHashToEntityMap.set(entity.device_hash, entity.entity_id);
  }
  console.log(`Loaded mappings for ${mappings.length} entities.`);
  return idMaps;
};

/**
 * EXTRACT: Fetches all new raw logs from the database.
 */
const extractNewEvents = async (startTime, endTime) => {
  const findQuery = { timestamp: { $gt: startTime, $lte: endTime } };
  const bookingFindQuery = { start_time: { $gt: startTime, $lte: endTime } };

  const [swipes, frames, bookings, checkouts, wifi] = await Promise.all([
    CampusCardSwipe.find(findQuery).lean(),
    CctvFrame.find(findQuery).lean(),
    LabBooking.find(bookingFindQuery).lean(),
    LibraryCheckout.find(findQuery).lean(),
    WifiLog.find(findQuery).lean()
  ]);

  return { swipes, frames, bookings, checkouts, wifi };
};

/**
 * TRANSFORM: Normalizes all raw logs into a standard format and finds the single
 * latest event for each entity.
 */
const transformEvents = (rawLogs, idMaps) => {
  const { swipes, frames, bookings, checkouts, wifi } = rawLogs;
  const { cardIdToEntityMap, faceIdToEntityMap, deviceHashToEntityMap } = idMaps;

  const allSeenEvents = [
    ...swipes.map(log => ({ entityId: cardIdToEntityMap.get(log.card_id), timestamp: new Date(log.timestamp), location: log.location_id, source: 'card-swipes' })),
    ...frames.map(log => ({ entityId: faceIdToEntityMap.get(log.face_id), timestamp: new Date(log.timestamp), location: log.location_id, source: 'cctv-frames' })),
    ...bookings.map(log => ({ entityId: log.entity_id, timestamp: new Date(log.start_time), location: log.room_id, source: 'lab-bookings' })),
    ...checkouts.map(log => ({ entityId: log.entity_id, timestamp: new Date(log.timestamp), location: 'Library', source: 'library-checkouts' })),
    ...wifi.map(log => ({ entityId: deviceHashToEntityMap.get(log.device_hash), timestamp: new Date(log.timestamp), location: log.ap_id, source: 'wifi-logs' })),
  ];

  const validEvents = allSeenEvents.filter(e => e.entityId);
  const latestEventsMap = new Map();
  
  for (const event of validEvents) {
    const existing = latestEventsMap.get(event.entityId);
    if (!existing || event.timestamp > existing.timestamp) {
      latestEventsMap.set(event.entityId, event);
    }
  }
  
  return latestEventsMap;
};

/**
 * LOAD: Takes the latest events and upserts them into the EntityLastSeen collection.
 */
const loadLastSeenEvents = async (latestEventsMap) => {
  if (latestEventsMap.size === 0) {
    console.log("No new entity events to process.");
    return;
  }

  const bulkOps = [];
  for (const [entityId, event] of latestEventsMap.entries()) {
    bulkOps.push({
      updateOne: {
        filter: { _id: entityId, last_seen_timestamp: { $lt: event.timestamp } },
        update: { $set: { _id: entityId, last_seen_timestamp: event.timestamp, last_seen_location: event.location, last_seen_source: event.source }},
        upsert: true
      }
    });
  }
  
  const result = await EntityLastSeen.bulkWrite(bulkOps);
  console.log(`ETL Load complete: ${result.nUpserted} new entities, ${result.nModified} updated.`);
};

/**
 * ALERT: Finds missing entities and updates the Alerts collection.
 */
const processAlerts = async (twelveHoursAgo, highPriorityTime) => {
  const alertOps = [];

  // 1. Find entities that are missing
  const missingEntities = await EntityLastSeen.aggregate([
    { $match: { last_seen_timestamp: { $lt: twelveHoursAgo } } },
    { $lookup: { from: 'entities', localField: '_id', foreignField: 'entity_id', as: 'entityInfo' }},
    { $unwind: { path: '$entityInfo', preserveNullAndEmptyArrays: true } }
  ]);

  if (missingEntities.length > 0) {
    console.warn(`--- ALERT: ${missingEntities.length} ENTITIES NOT SEEN IN ${ALERT_THRESHOLD_HOURS} HOURS ---`);
    
    for (const entity of missingEntities) {
      const entityName = entity.entityInfo ? entity.entityInfo.name : 'Unknown';
      const priority = entity.last_seen_timestamp < highPriorityTime ? 'high' : 'normal';

     // console.warn(`  - Entity ID: ${entity._id} (Name: ${entityName}), Priority: ${priority}`);
      
      // Add operation to create/update the alert
      alertOps.push({
        updateOne: {
          filter: { 
            _id: entity._id,
            $or: [
              { status: { $ne: 'dismissed' } },
              { dismissed_until: { $lt: new Date() } }
            ]
          },
          update: {
            $set: {
              _id: entity._id,
              entity_name: entityName,
              status: 'active',
              priority: priority,
              last_seen_timestamp: entity.last_seen_timestamp,
              last_seen_location: entity.last_seen_location,
              last_seen_source: entity.last_seen_source
            },
            $unset: { dismissed_until: "" },
            $setOnInsert: { alert_generated_at: new Date() }
          },
          upsert: true
        }
      });
    }
  } else {
    console.log(`[${new Date().toISOString()}] All entities seen within the last ${ALERT_THRESHOLD_HOURS} hours.`);
  }

  // 2. Find entities that were missing but are now found
  const recentlyFoundEntities = await EntityLastSeen.find({
    last_seen_timestamp: { $gte: twelveHoursAgo }
  }).select('_id').lean();
  
  const recentlyFoundIds = recentlyFoundEntities.map(e => e._id);

  if (recentlyFoundIds.length > 0) {
    alertOps.push({
      updateMany: {
        filter: { _id: { $in: recentlyFoundIds }, status: 'active' },
        update: { 
          $set: { status: 'resolved' },
          $unset: { dismissed_until: "" }
        }
      }
    });
  }
  
  // 3. Execute all alert operations (create, update, resolve)
  if (alertOps.length > 0) {
    await Alert.bulkWrite(alertOps);
    console.log("Alerts collection has been updated.");
  }
};

/**
 * Saves the timestamp of this run to the database to prevent reprocessing.
 */
const saveEtlState = async (newTimestamp) => {
  await EtlState.updateOne(
    { _id: ETL_STATE_ID },
    { $set: { lastProcessedTimestamp: newTimestamp } },
    { upsert: true }
  );
  lastProcessedTimestamp = newTimestamp;
  console.log(`Successfully saved ETL state. Next run will start from ${lastProcessedTimestamp.toISOString()}`);
};

/**
 * The main coordinator function that runs on a timer.
 */
const runEtlAndAlerts = async () => {
  const etlStartTime = new Date();
  console.log(`[${etlStartTime.toISOString()}] Running ETL & Alert Check...`);
  console.log(`Processing data since ${lastProcessedTimestamp.toISOString()}`);

  try {
    // A buffer to ensure we don't process data that is *just* being written
    const newTimestamp = new Date(Date.now() - 1000 * 30); 
    const twelveHoursAgo = new Date(Date.now() - ALERT_THRESHOLD_HOURS * 60 * 60 * 1000);
    const highPriorityTime = new Date(Date.now() - HIGH_PRIORITY_THRESHOLD_HOURS * 60 * 60 * 1000);

    // 1. Load Mappings
    const idMaps = await loadIdMappings();
    
    // 2. EXTRACT
    const rawLogs = await extractNewEvents(lastProcessedTimestamp, newTimestamp);
    
    // 3. TRANSFORM
    const latestEventsMap = transformEvents(rawLogs, idMaps);
    
    // 4. LOAD
    await loadLastSeenEvents(latestEventsMap);
    
    // 5. ALERT
    await processAlerts(twelveHoursAgo, highPriorityTime);

    // 6. SAVE STATE
    await saveEtlState(newTimestamp);

  } catch (err) {
    console.error("Error during ETL & Alert run:", err.message);
  }
};

/**
 * Main function to connect to DB, load state, and start the timer.
 */
const startAlertService = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Alert Service connected to MongoDB.');

    // Load the last processed state from the database
    const lastState = await EtlState.findById(ETL_STATE_ID);
    if (lastState) {
      lastProcessedTimestamp = new Date(lastState.lastProcessedTimestamp);
      console.log(`Successfully loaded ETL state. Resuming from ${lastProcessedTimestamp.toISOString()}`);
    } else {
      console.log('No previous ETL state found. Starting from the beginning.');
    }

    // Run once on startup, then start the interval
    await runEtlAndAlerts();
    setInterval(runEtlAndAlerts, CHECK_INTERVAL_MS);

  } catch (err) {
    console.error("Failed to connect to MongoDB. Alert service not started.", err);
    process.exit(1);
  }
};

startAlertService();

