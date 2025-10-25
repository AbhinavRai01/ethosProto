import EntityLastSeen from '../models/entityLastSeen.js';
import Location from '../models/location.js';
import EntityRisk from '../models/alert models/entityRisk.js';

// --- Configuration ---
const riskMaps = {
  entity: new Map(),
  location: new Map(),
};

export const loadRiskMaps = async () => {
  console.log('Loading risk maps...');
  try {
    // --- Load Entity Risk Scores ---
    const entityRisks = await EntityRisk.find({}).lean(); 
    riskMaps.entity = new Map(); 
    for (const riskDoc of entityRisks) {
      riskMaps.entity.set(riskDoc._id, riskDoc.risk_score); 
    }
    console.log(`Loaded risk scores for ${riskMaps.entity.size} entities.`);

    // --- Load Location Risk Scores ---
    const locations = await Location.find({}).lean();
    riskMaps.location = new Map(); 
    for (const loc of locations) {
      riskMaps.location.set(loc.location_name.toUpperCase(), loc.risk_score);
    }
    console.log(`Loaded risk scores for ${riskMaps.location.size} locations.`);

  } catch (error) {
    console.error("Failed to load risk maps:", error);
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

  if (context.entity_id) {
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
      totalScore += 25; 
      reasons.push('Violation(25pts)');
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
      priority: 'high', 
      recommendation: 'Immediate dispatch of security personnel required.',
    };
  }
  if (score >= 100) { 
    return {
      priority: 'high',
      recommendation: 'Notify on-duty staff and review CCTV footage.',
    };
  }
  // All scores below 100 are now 'normal'
  return {
    priority: 'normal', 
    recommendation: 'Log for review. No immediate action required.',
  };
};

