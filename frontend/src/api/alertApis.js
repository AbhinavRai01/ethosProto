
const BASE_URL = 'http://localhost:5000/api/alerts'; 

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

/**
 * Fetches a paginated list of all 'active' alerts.
 * @param {number} [page=1] - The page number to fetch.
 */
export const fetchActiveAlerts = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/active/${page}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching active alerts:", error);
    throw error; // Re-throw to let the calling component handle it
  }
};

/**
 * Fetches a paginated list of 'active' high-priority alerts.
 * @param {number} [page=1] - The page number to fetch.
 */
export const fetchHighPriorityAlerts = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/high/${page}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching high priority alerts:", error);
    throw error;
  }
};

/**
 * Fetches a paginated list of 'dismissed' alerts.
 * @param {number} [page=1] - The page number to fetch.
 */
export const fetchDismissedAlerts = async (page = 1) => {
  try {
    const response = await fetch(`${BASE_URL}/dismissed/${page}`);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error fetching dismissed alerts:", error);
    throw error;
  }
};

/**
 * Dismisses a specific alert by its ID (entity_id).
 * @param {string} alertId - The _id of the alert to dismiss.
 */
export const dismissAlert = async (alertId) => {
  try {
    const response = await fetch(`${BASE_URL}/${alertId}/dismiss`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return await handleResponse(response);
  } catch (error) {
    console.error("Error dismissing alert:", error);
    throw error;
  }
};


