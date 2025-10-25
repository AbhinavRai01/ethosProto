/**
 * Generates a recommended action based on the alert data.
 * @param {object} alert - The alert object from the API, including alertType and normalizedScore.
 * @returns {string} - The recommended action text.
 */
export const getRecommendation = (alert) => {
  const normalizedScore = alert.normalizedScore; // Use the normalized score (25-100)
  const alertType = alert.alertType;

  // --- Missing Person Rules ---
  if (alertType === 'missing') {
    if (normalizedScore >= 80) {
      return 'Dispatch security personnel.';
    } else if (normalizedScore >= 40) {
      return 'Make a phone call to the entity.';
    } else {
      return 'Send automated email notification.';
    }
  }

  // --- Overcrowding Rules ---
  if (alertType === 'overcrowd') {
    // Always recommend sending security for overcrowding alerts
    return 'Dispatch security personnel to manage crowd.';
  }

  // --- Violation Rules ---
  if (alertType === 'violation') {
    // UPDATED: Recommend both actions regardless of score
    return 'Make a phone call or investigate further; Grant access / Log violation.';
  }

  // Default fallback if type is unknown or score is missing
  return 'Review alert details and determine action.';
};

