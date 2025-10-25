import EntityLastSeen from '../models/entityLastSeen.js';
import Location from '../models/location.js';
import EntityRisk from '../models/alert models/entityRisk.js';

// --- Configuration ---
// These seem unused in the provided code block, but kept for potential future use
// const RISK_MULTIPLIER = 1.05;
// const DEFAULT_ENTITY_RISK = 10;
// const DEFAULT_LOCATION_RISK = 0;

// --- In-memory caches ---
// Using the structure provided in the user's code block
const riskMaps = {
  entity: new Map(),
  location: new Map(),
};

/**
 * Loads all risk_score fields from the DB into memory.
 * Run this when your AlertService starts.
 */
export const loadRiskMaps = async () => {
  console.log('Loading risk maps...');
  try {
    // --- Load Entity Risk Scores ---
    const entityRisks = await EntityRisk.find({}).lean(); // <-- Fetch from EntityRisk
    riskMaps.entity = new Map(); // Clear previous map
    for (const riskDoc of entityRisks) {
      riskMaps.entity.set(riskDoc._id, riskDoc.risk_score); // _id is entity_id
    }
    console.log(`Loaded risk scores for ${riskMaps.entity.size} entities.`);

    // --- Load Location Risk Scores ---
    const locations = await Location.find({}).lean();
    riskMaps.location = new Map(); // Clear previous map
    for (const loc of locations) {
      riskMaps.location.set(loc.location_name.toUpperCase(), loc.risk_score);
    }
    console.log(`Loaded risk scores for ${riskMaps.location.size} locations.`);

  } catch (error) {
    console.error("Failed to load risk maps:", error);
    // Depending on requirements, you might want to exit or use default scores
    // Resetting maps in case of partial load failure
    riskMaps.entity = new Map();
    riskMaps.location = new Map();
  }
};

/**
 * Calculates a dynamic risk score based on the hour of the day.
 * High risk = 12 AM - 6 AM
 * Medium risk = 8 PM - 12 AM
 */
const getTimeRisk = (timestamp) => {
  const hour = new Date(timestamp).getHours();
  if (hour >= 0 && hour < 6) {
    return { score: 75, reason: `Late night (${hour}:00)` }; // 12 AM - 6 AM
  }
  if (hour >= 20) {
    return { score: 40, reason: `Evening (${hour}:00)` }; // 8 PM - 12 AM
  }
  return { score: 0, reason: `Daytime (${hour}:00)` };
};

/**
 * Calculates a dynamic risk score for unseen time.
 */
const getUnseenTimeRisk = (hours) => {
  if (hours > 48) return { score: 200, reason: `Unseen > 48h` };
  if (hours > 24) return { score: 100, reason: `Unseen > 24h` };
  if (hours > 12) return { score: 50, reason: `Unseen > 12h` };
  return { score: 0, reason: `Unseen < 12h` };
};

/**
 * Calculates a dynamic risk score for overcrowding.
 */
const getOvercrowdRisk = (population, capacity) => {
  const ratio = population / (capacity || 2000); // Use 2000 as default capacity
  if (ratio > 1.5) return { score: 150, reason: `Overcapacity (${Math.round(ratio*100)}%)`};
  if (ratio > 1.2) return { score: 75, reason: `Overcapacity (${Math.round(ratio*100)}%)`};
  if (ratio > 1.0) return { score: 25, reason: `Overcapacity (${Math.round(ratio*100)}%)`};
  return { score: 0, reason: `Capacity OK` };
};

/**
 * Public function to get a score for any alert.
 */
export const calculateScore = (alertType, context) => {
  let totalScore = 0;
  const reasons = [];

  // 1. Get Entity Risk
  if (context.entity_id) {
    // Get risk score from the in-memory map
    const entityRisk = riskMaps.entity.get(context.entity_id) || 0;
    if (entityRisk > 0) {
      totalScore += entityRisk;
      reasons.push(`Entity Risk (${entityRisk.toFixed(2)}pts)`); // Use toFixed for consistency
    }
  }

  // 2. Get Location Risk
  if (context.location_id) {
    const locationRisk = riskMaps.location.get(context.location_id.toUpperCase()) || 0;
    if (locationRisk > 0) {
      totalScore += locationRisk;
      reasons.push(`Location Risk (${locationRisk.toFixed(2)}pts)`); // Use toFixed for consistency
    }
  }

  // 3. Get Dynamic/Time Risk
  switch (alertType) {
    case 'MISSING_ENTITY': {
      const { score, reason } = getUnseenTimeRisk(context.time_since_last_seen_hours);
      totalScore += score;
      reasons.push(reason);
      break;
    }
    case 'VIOLATION': {
      // Add base violation score
      totalScore += 25; // Base score for any violation
      reasons.push('Violation(25pts)');
      // Add time-based risk
      const { score, reason } = getTimeRisk(context.timestamp);
      totalScore += score;
      reasons.push(reason);
      break;
    }
    case 'OVERCROWDING': {
      const { score, reason } = getOvercrowdRisk(context.current_population, context.capacity);
      totalScore += score;
      reasons.push(reason);
      break;
    }
    default:
      reasons.push('Unknown alert type');
  }

  return { total_score: totalScore, reason: reasons.join(', ') };
};

/**
 * Translates a final score into a priority and recommendation.
 * This is where you can store your "score thresholds".
 */
export const rankScore = (score) => {
  if (score >= 200) {
    return {
      priority: 'high', // Changed from medium to align with Alert model enum 'high'
      recommendation: 'Immediate dispatch of security personnel required.',
    };
  }
  if (score >= 100) { // Changed threshold for medium->high
    return {
      priority: 'high', // Changed from low to align with Alert model enum 'high'
      recommendation: 'Notify on-duty staff and review CCTV footage.',
    };
  }
  // All scores below 100 are now 'normal'
  return {
    priority: 'normal', // Changed from low to align with Alert model enum 'normal'
    recommendation: 'Log for review. No immediate action required.',
  };
};

