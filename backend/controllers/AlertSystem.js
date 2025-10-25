import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import EntityLastSeen from '../models/entityLastSeen.js';
import EtlState from '../models/etlStateModel.js';
import Entity from '../models/entityModel.js';
import Alert from '../models/alert models/alert.js';
import OvercrowdAlert from '../models/alert models/overcrowdAlert.js';
import ViolationAlert from '../models/alert models/violationAlert.js';
import CampusCardSwipe from '../models/campusCardSwipes.js';
import CctvFrame from '../models/CctvFrams.js';
import LabBooking from '../models/labBookings.js';
import LibraryCheckout from '../models/libraryCheckout.js';
import WifiLog from '../models/wifiLogs.js';
import Location from '../models/location.js';

import { loadRiskMaps, calculateScore, rankScore } from './prioritizationService.js';


configDotenv();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:20000/swipe-db";
const CHECK_INTERVAL_MS = 1000 * 60 * 5; // 15 minutes
const ALERT_THRESHOLD_HOURS = 12;
const OVERCROWD_THRESHOLD = 2000;
const ETL_STATE_ID = 'alert-service-last-run';

const RESTRICTED_TIMES = {
  'LAB_305': { start: 22, end: 6 }, // 10 PM - 6 AM
  'ADMIN_LOBBY': { start: 10, end: 14 }, // 8 PM - 7 AM
  'AUDITORIUM': { start: 11, end: 13 }  
};

let lastProcessedTimestamp = new Date(0);
let idMaps = {};

// --- Helper Functions ---

const loadIdMappings = async () => {
  console.log('Loading ID mappings from Entity collection...');
  const mappings = await Entity.find({}).lean();
  const cardIdToEntityMap = new Map();
  const faceIdToEntityMap = new Map();
  const deviceHashToEntityMap = new Map();
  const entityIdToEntity = new Map();

  for (const entity of mappings) {
    const entityId = entity.entity_id;
    entityIdToEntity.set(entityId, entity);
    if (entity.card_id) cardIdToEntityMap.set(entity.card_id, entityId);
    if (entity.face_id) faceIdToEntityMap.set(entity.face_id, entityId);
    if (entity.device_hash) deviceHashToEntityMap.set(entity.device_hash, entityId);
  }
  idMaps = { cardIdToEntityMap, faceIdToEntityMap, deviceHashToEntityMap, entityIdToEntity };
  console.log(`Loaded mappings for ${mappings.length} entities.`);
};

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

const transformEvents = (rawLogs) => {
  const { swipes, frames, bookings, checkouts, wifi } = rawLogs;
  const { cardIdToEntityMap, faceIdToEntityMap, deviceHashToEntityMap } = idMaps;
  const allSeenEvents = [
    ...swipes.map(log => ({ entityId: cardIdToEntityMap.get(log.card_id), timestamp: new Date(log.timestamp), location: log.location_id, source: 'card-swipes' })),
    ...frames.map(log => ({ entityId: faceIdToEntityMap.get(log.face_id), timestamp: new Date(log.timestamp), location: log.location_id, source: 'cctv-frames' })),
    ...bookings.map(log => ({ entityId: log.entity_id, timestamp: new Date(log.start_time), location: log.room_id, source: 'lab-bookings' })),
    ...checkouts.map(log => ({ entityId: log.entity_id, timestamp: new Date(log.timestamp), location: 'Library', source: 'library-checkouts' })),
    ...wifi.map(log => ({ entityId: deviceHashToEntityMap.get(log.device_hash), timestamp: new Date(log.timestamp), location: log.ap_id, source: 'wifi-logs' })),
  ];
  const validEvents = allSeenEvents.filter(e => e.entityId && e.location);
  const latestEventsMap = new Map();
  for (const event of validEvents) {
    const existing = latestEventsMap.get(event.entityId);
    if (!existing || event.timestamp > existing.timestamp) {
      latestEventsMap.set(event.entityId, event);
    }
  }
  return { latestEventsMap, allValidEvents: validEvents };
};

const processViolationAlerts = async (allValidEvents) => {
  const violationOps = [];
  for (const event of allValidEvents) {
    const locationKey = event.location.toUpperCase();
    const rules = RESTRICTED_TIMES[locationKey];
    if (rules) {
      const eventHour = event.timestamp.getHours();
      if (eventHour >= rules.start || eventHour < rules.end) {
        const context = {
          entity_id: event.entityId, location_id: locationKey, timestamp: event.timestamp
        };
        const { total_score, reason } = calculateScore('VIOLATION', context);
        violationOps.push({
          insertOne: {
            document: {
              entity_id: event.entityId,
              entity_name: idMaps.entityIdToEntity.get(event.entityId)?.name || 'Unknown',
              location_id: locationKey,
              timestamp: event.timestamp, status: 'active', violation_type: 'WRONG_TIME',
              risk_score: total_score,
            }
          }
        });
      }
    }
  }
  if (violationOps.length > 0) {
    const result = await ViolationAlert.bulkWrite(violationOps);
    console.log(`Violation Alerts created: ${result.insertedCount}`);
  }
};

const loadLastSeenEvents = async (latestEventsMap) => {
  if (latestEventsMap.size === 0) return;
  const entityIds = [...latestEventsMap.keys()];
  const allCurrentDocs = await EntityLastSeen.find({ _id: { $in: entityIds } }).lean();
  const currentDocsMap = new Map(allCurrentDocs.map(doc => [doc._id, doc]));
  const locationPopulationOps = [];
  const entityLastSeenOps = [];

  for (const [entityId, newEvent] of latestEventsMap.entries()) {
    const currentDoc = currentDocsMap.get(entityId);
    const isNewer = !currentDoc || newEvent.timestamp > currentDoc.last_seen_timestamp;
    if (isNewer) {
      const entityInfo = idMaps.entityIdToEntity.get(entityId);
      const baseRiskScore = entityInfo?.risk_score || 0;
      entityLastSeenOps.push({
        updateOne: {
          filter: { _id: entityId },
          update: {
            $set: {
              _id: entityId, entity_name: entityInfo?.name || 'Unknown',
              last_seen_timestamp: newEvent.timestamp, last_seen_location: newEvent.location,
              last_seen_source: newEvent.source, risk_score: baseRiskScore
            }
          },
          upsert: true
        }
      });
      const previousLocation = currentDoc?.last_seen_location;
      const newLocation = newEvent.location;
      if (newLocation && newLocation.toUpperCase() !== previousLocation?.toUpperCase()) {
        locationPopulationOps.push({
          updateOne: {
            filter: { location_name: newLocation.toUpperCase() },
            update: { $inc: { current_population: 1 } },
            upsert: true
          }
        });
        if (previousLocation) {
          locationPopulationOps.push({
            updateOne: {
              filter: { location_name: previousLocation.toUpperCase(), current_population: { $gt: 0 } }, // Ensure population doesn't go below 0
              update: { $inc: { current_population: -1 } }
            }
          });
        }
      }
    }
  }
  if (locationPopulationOps.length > 0) await Location.bulkWrite(locationPopulationOps);
  if (entityLastSeenOps.length > 0) await EntityLastSeen.bulkWrite(entityLastSeenOps);
};

// --- UPDATED Overcrowding Logic ---
const processOvercrowdAlerts = async () => {
  const ops = [];
  const now = new Date();

  // Find locations where population exceeds capacity
  // Uses MongoDB's $expr to compare two fields in the same document
  const overcrowdedLocations = await Location.find({
     $expr: { $gt: [ "$current_population", "$capacity" ] }
  }).lean();

  if (overcrowdedLocations.length > 0) {
      console.warn(`--- ALERT: ${overcrowdedLocations.length} LOCATIONS OVER CAPACITY ---`);
  }

  for (const loc of overcrowdedLocations) {
    const context = {
      location_id: loc.location_name,
      current_population: loc.current_population,
      capacity: loc.capacity // Use the location's specific capacity
    };
    const { total_score, reason } = calculateScore('OVERCROWDING', context);
    const { priority, recommendation } = rankScore(total_score);

    ops.push({
      updateOne: {
        filter: { location_name: loc.location_name, status: 'active' }, // Find existing active alert
        update: {
          $set: {
            population: loc.current_population, // Update population
            status: 'active',
            risk_score: total_score,
            priority: priority,
            recommendation: recommendation,
            reason: reason,
            timestamp: now // Update timestamp
          }
        },
        upsert: true // Create if no active alert exists
      }
    });
  }

  // Find locations that are NO LONGER overcrowded
  const safeLocations = await Location.find({
      $expr: { $lte: [ "$current_population", "$capacity" ] }
  }).select('location_name').lean(); // Only need the names

  const safeLocationNames = safeLocations.map(l => l.location_name);

  // Resolve active alerts for locations that are now safe
  if (safeLocationNames.length > 0) {
    ops.push({
      updateMany: {
        filter: { location_name: { $in: safeLocationNames }, status: 'active' },
        update: { $set: { status: 'resolved' } }
      }
    });
  }

  if (ops.length > 0) {
    await OvercrowdAlert.bulkWrite(ops);
    console.log("Overcrowding Alerts collection updated.");
  }
};
// --- END UPDATED Overcrowding Logic ---


const processMissingPersonAlerts = async (twelveHoursAgo) => {
  const alertOps = [];
  const now = new Date();
  const missingEntities = await EntityLastSeen.find({ last_seen_timestamp: { $lt: twelveHoursAgo } }).lean();

  if (missingEntities.length > 0) {
    console.warn(`--- ALERT: ${missingEntities.length} ENTITIES NOT SEEN IN ${ALERT_THRESHOLD_HOURS} HOURS ---`);
    const missingEntityIds = missingEntities.map(e => e._id);
    const existingAlerts = await Alert.find({ _id: { $in: missingEntityIds } }).lean();
    const existingAlertsMap = new Map(existingAlerts.map(alert => [alert._id, alert]));

    for (const entity of missingEntities) {
      const existingAlert = existingAlertsMap.get(entity._id);
      if (existingAlert?.status === 'dismissed' && existingAlert.dismissed_until > now) continue;
      const diffMs = now.getTime() - entity.last_seen_timestamp.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const context = {
        entity_id: entity._id, location_id: entity.last_seen_location, time_since_last_seen_hours: diffHours,
      };
      const { total_score, reason } = calculateScore('MISSING_ENTITY', context);
      const { priority, recommendation } = rankScore(total_score);

      if (existingAlert?.risk_score !== total_score || existingAlert?.status !== 'active') {
        alertOps.push({
          updateOne: {
            filter: { _id: entity._id },
            update: {
              $set: {
                _id: entity._id, entity_name: entity.entity_name, status: 'active',
                risk_score: total_score, priority: priority, recommendation: recommendation, reason: reason,
                time_since_last_seen: `${diffHours} hours`, last_seen_timestamp: entity.last_seen_timestamp,
                last_seen_location: entity.last_seen_location, last_seen_source: entity.last_seen_source
              },
              $unset: { dismissed_until: "" }, $setOnInsert: { alert_generated_at: now }
            },
            upsert: true
          }
        });
      }
    }
  }
  const recentlyFoundEntities = await EntityLastSeen.find({ last_seen_timestamp: { $gte: twelveHoursAgo } }).select('_id').lean();
  const recentlyFoundIds = recentlyFoundEntities.map(e => e._id);
  if (recentlyFoundIds.length > 0) {
    alertOps.push({
      updateMany: {
        filter: { _id: { $in: recentlyFoundIds }, status: 'active' },
        update: { $set: { status: 'resolved' }, $unset: { dismissed_until: "" } }
      }
    });
  }
  if (alertOps.length > 0) await Alert.bulkWrite(alertOps);
};

const saveEtlState = async (newTimestamp) => {
  await EtlState.updateOne(
    { _id: ETL_STATE_ID },
    { $set: { lastProcessedTimestamp: newTimestamp } },
    { upsert: true }
  );
  lastProcessedTimestamp = newTimestamp;
};

const runEtlAndAlerts = async () => {
  const etlStartTime = new Date();
  console.log(`[${etlStartTime.toISOString()}] Running ETL & Alert Check...`);
  try {
    const newTimestamp = new Date(Date.now() - 1000 * 30);
    const twelveHoursAgo = new Date(Date.now() - ALERT_THRESHOLD_HOURS * 60 * 60 * 1000);
    const rawLogs = await extractNewEvents(lastProcessedTimestamp, newTimestamp);
    const { latestEventsMap, allValidEvents } = transformEvents(rawLogs);
    await processViolationAlerts(allValidEvents);
    await loadLastSeenEvents(latestEventsMap);
    await processOvercrowdAlerts(); // Now uses specific capacities
    await processMissingPersonAlerts(twelveHoursAgo);
    await saveEtlState(newTimestamp);
  } catch (err) { console.error("Error during ETL & Alert run:", err.message); }
};

const startAlertService = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Alert Service connected to MongoDB.');
    await loadIdMappings();
    await loadRiskMaps();
    const lastState = await EtlState.findById(ETL_STATE_ID);
    if (lastState) {
      lastProcessedTimestamp = new Date(lastState.lastProcessedTimestamp);
      console.log(`Successfully loaded ETL state. Resuming from ${lastProcessedTimestamp.toISOString()}`);
    } else {
      console.log('No previous ETL state found. Starting from the beginning.');
    }
    await runEtlAndAlerts();
    setInterval(runEtlAndAlerts, CHECK_INTERVAL_MS);
  } catch (err) {
    console.error("Failed to start Alert Service.", err);
    process.exit(1);
  }
};

startAlertService();
