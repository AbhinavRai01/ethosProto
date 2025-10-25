import Alert from '../models/alert models/alert.js';
import ViolationAlert from '../models/alert models/violationAlert.js';
import OvercrowdAlert from '../models/alert models/overcrowdAlert.js';

// --- Configuration ---
const DEFAULT_PAGE_LIMIT = 15;

// --- Helper Functions ---

/**
 * Executes pagination queries for a given model and query.
 */
const paginateQuery = async (model, query, page, limit, sort) => {
  const skip = (page - 1) * limit;
  const [alerts, totalAlerts] = await Promise.all([
    model.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    model.countDocuments(query)
  ]);
  return { alerts, totalAlerts };
};

// --- Controller Functions ---

/**
 * Fetches active missing person alerts with pagination.
 */
export const getActiveAlerts = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = DEFAULT_PAGE_LIMIT;
    const query = { status: 'active' };
    const sort = { priority: -1, alert_generated_at: -1 }; // High priority first

    const { alerts, totalAlerts } = await paginateQuery(Alert, query, page, limit, sort);

    // Set cache headers to prevent 304 responses if needed
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });


    res.status(200).json({
      alerts,
      totalAlerts,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
      alertType: 'missing' // Add type for frontend rendering
    });
  } catch (error) {
    console.error("Error fetching active missing alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Fetches high priority alerts from ALL types (missing, overcrowd, violation).
 * Merges, sorts by time, and paginates the results.
 */
export const getHighPriorityAlerts = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = DEFAULT_PAGE_LIMIT;
    const skip = (page - 1) * limit;
    const query = { status: 'active', priority: 'high' };
    // Sort by when the alert was created/updated, most recent first
    const sort = { updatedAt: -1 };

    // Fetch high priority alerts from all collections in parallel
    const [missing, overcrowd, violation] = await Promise.all([
      Alert.find(query).lean(),
      OvercrowdAlert.find(query).lean(),
      ViolationAlert.find(query).lean() // Assuming ViolationAlert has priority
    ]);

    // Add type information and merge
    const allHighPriority = [
      ...missing.map(a => ({ ...a, alertType: 'missing' })),
      ...overcrowd.map(a => ({ ...a, alertType: 'overcrowd' })),
      ...violation.map(a => ({ ...a, alertType: 'violation' }))
    ];

    // Sort the combined results by timestamp (most recent first)
    // Use updatedAt for Mongoose docs, fallback to timestamp if present
    allHighPriority.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.timestamp || 0);
        const dateB = new Date(b.updatedAt || b.timestamp || 0);
        return dateB - dateA; // Descending order
    });


    // Manually paginate the merged & sorted array
    const paginatedAlerts = allHighPriority.slice(skip, skip + limit);
    const totalAlerts = allHighPriority.length;

    // Set cache headers to prevent 304 responses
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });

    res.status(200).json({
      alerts: paginatedAlerts,
      totalAlerts,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
      alertType: 'highPriorityCombined' // Indicate this is a combined view
    });
  } catch (error) {
    console.error("Error fetching all high priority alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/**
 * Fetches dismissed missing person alerts with pagination.
 */
export const getDismissedAlerts = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = DEFAULT_PAGE_LIMIT;
    const query = { status: 'dismissed' };
    const sort = { dismissed_until: 1 };

    const { alerts, totalAlerts } = await paginateQuery(Alert, query, page, limit, sort);

    // Set cache headers to prevent 304 responses if needed
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });


    res.status(200).json({
      alerts,
      totalAlerts,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
      alertType: 'missing'
    });
  } catch (error) {
    console.error("Error fetching dismissed missing alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Dismisses an active missing person alert for 12 hours.
 */
export const dismissAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const dismissUntilTime = new Date(Date.now() + 12 * 60 * 60 * 1000);

    const alert = await Alert.findOneAndUpdate(
      { _id: id, status: 'active' },
      { $set: { status: 'dismissed', dismissed_until: dismissUntilTime } },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ message: "Missing Person alert not found or is not active." });
    }

    res.status(200).json(alert);
  } catch (error) {
    console.error("Error dismissing alert:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Fetches active overcrowding alerts with pagination.
 */
export const getActiveOvercrowdAlerts = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = DEFAULT_PAGE_LIMIT;
    const query = { status: 'active' };
    const sort = { priority: -1, timestamp: -1 };

    const { alerts, totalAlerts } = await paginateQuery(OvercrowdAlert, query, page, limit, sort);

    // Set cache headers to prevent 304 responses if needed
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });


    res.status(200).json({
      alerts,
      totalAlerts,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
      alertType: 'overcrowd'
    });
  } catch (error) {
    console.error("Error fetching active overcrowd alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Fetches active violation alerts with pagination.
 */
export const getActiveViolationAlerts = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = DEFAULT_PAGE_LIMIT;
    const query = { status: 'active' };
    const sort = { risk_score: -1, timestamp: -1 }; // Sort by score, then time

    const { alerts, totalAlerts } = await paginateQuery(ViolationAlert, query, page, limit, sort);

     // Set cache headers to prevent 304 responses if needed
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });


    res.status(200).json({
      alerts,
      totalAlerts,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
      alertType: 'violation'
    });
  } catch (error) {
    console.error("Error fetching active violation alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Fetches ALL active alerts sorted by risk_score.
 */
export const getAllAlertsSortedByScore = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = DEFAULT_PAGE_LIMIT;
    const skip = (page - 1) * limit;
    const query = { status: 'active' };

    const [missing, overcrowd, violation] = await Promise.all([
      Alert.find(query).lean(),
      OvercrowdAlert.find(query).lean(),
      ViolationAlert.find(query).lean()
    ]);

    const allActive = [
      ...missing.map(a => ({ ...a, alertType: 'missing' })),
      ...overcrowd.map(a => ({ ...a, alertType: 'overcrowd' })),
      ...violation.map(a => ({ ...a, alertType: 'violation' }))
    ];

    allActive.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));

    const paginatedAlerts = allActive.slice(skip, skip + limit);
    const totalAlerts = allActive.length;

     // Set cache headers to prevent 304 responses if needed
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });


    res.status(200).json({
      alerts: paginatedAlerts,
      totalAlerts,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
      alertType: 'allActiveSorted'
    });
  } catch (error) {
    console.error("Error fetching all active alerts sorted by score:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Fetches the highest and lowest risk scores for each active alert type.
 */
export const getAlertScoreExtremes = async (req, res) => {
  try {
    const query = { status: 'active' };
    const sortHighest = { risk_score: -1 };
    const sortLowest = { risk_score: 1 };

    const [
      highestMissing, lowestMissing,
      highestOvercrowd, lowestOvercrowd,
      highestViolation, lowestViolation
    ] = await Promise.all([
      Alert.findOne(query).sort(sortHighest).select('risk_score').lean(),
      Alert.findOne(query).sort(sortLowest).select('risk_score').lean(),
      OvercrowdAlert.findOne(query).sort(sortHighest).select('risk_score').lean(),
      OvercrowdAlert.findOne(query).sort(sortLowest).select('risk_score').lean(),
      ViolationAlert.findOne(query).sort(sortHighest).select('risk_score').lean(),
      ViolationAlert.findOne(query).sort(sortLowest).select('risk_score').lean(),
    ]);

     // Set cache headers to prevent 304 responses if needed
    res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
    });


    res.status(200).json({
      missing: { highest: highestMissing, lowest: lowestMissing },
      overcrowd: { highest: highestOvercrowd, lowest: lowestOvercrowd },
      violation: { highest: highestViolation, lowest: lowestViolation },
    });
  } catch (error) {
    console.error("Error fetching alert score extremes:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

