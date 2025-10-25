const BASE_URL = 'http://localhost:5000/api/alerts';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Fetches a paginated list of 'active' missing person alerts.
 */
export const fetchActiveAlerts = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/missing/active/${page}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching active missing alerts:", error);
    throw error;
  }
};

/**
 * Fetches a paginated list of ALL 'active' high-priority alerts (combined).
 */
export const fetchHighPriorityAlerts = async (page = 1) => {
  try {
    // Note: The controller now handles combining all types for high priority
    const response = await fetch(`${BASE_URL}/missing/high/${page}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching high priority alerts:", error);
    throw error;
  }
};

/**
 * Fetches a paginated list of 'dismissed' missing person alerts.
 */
export const fetchDismissedAlerts = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/missing/dismissed/${page}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching dismissed alerts:", error);
    throw error;
  }
};

/**
 * Dismisses a specific missing person alert by its ID (entity_id).
 */
export const dismissAlert = async (alertId) => {
  try {
    const response = await fetch(`${BASE_URL}/missing/${alertId}/dismiss`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error dismissing alert:", error);
    throw error;
  }
};

/**
 * Fetches a paginated list of 'active' overcrowding alerts.
 */
export const fetchActiveOvercrowdAlerts = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/overcrowd/active/${page}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching active overcrowd alerts:", error);
    throw error;
  }
};

/**
 * Fetches a paginated list of 'active' violation alerts.
 */
export const fetchActiveViolationAlerts = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/violation/active/${page}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching active violation alerts:", error);
    throw error;
  }
};

/**
 * NEW: Fetches a paginated list of ALL active alerts, sorted by risk score.
 */
export const fetchAllAlertsSortedByScore = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/all/sorted-by-score/${page}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching all alerts sorted by score:", error);
    throw error;
  }
};

export const fetchAlertScoreExtremes = async () => {
    try {
        const response = await fetch(`${BASE_URL}/extremes`); // Calls GET /api/alerts/extremes
        return await handleResponse(response);
    } catch (error) {
        console.error("Error fetching alert score extremes:", error);
        throw error; // Re-throw for component-level handling
    }
};

