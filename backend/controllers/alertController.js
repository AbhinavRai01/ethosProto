import Alert from '../models/alert.js';

/**
 * Fetches all alerts that are currently 'active' with pagination.
 * Sorts them by high priority first, then by the newest.
 */
export const getActiveAlerts = async (req, res) => {
  try {
    // Get page and limit from route params, with defaults
    const page = parseInt(req.params.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const query = { status: 'active' };

    // Run queries in parallel to get both the count and the paginated results
    const [alerts, totalAlerts] = await Promise.all([
      Alert.find(query)
        .sort({ priority: -1, alert_generated_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Alert.countDocuments(query)
    ]);
      
    res.status(200).json({
      alerts,
      totalAlerts,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
    });
  } catch (error) {
    console.error("Error fetching active alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * NEW: Fetches only 'active' alerts marked as 'high' priority.
 * Includes pagination.
 */
export const getHighPriorityAlerts = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const query = { status: 'active', priority: 'high' };

    const [alerts, totalAlerts] = await Promise.all([
      Alert.find(query)
        .sort({ alert_generated_at: -1 }) // Sort by newest
        .skip(skip)
        .limit(limit)
        .lean(),
      Alert.countDocuments(query)
    ]);
      
    res.status(200).json({
      alerts,
      totalAlerts,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
    });
  } catch (error) {
    console.error("Error fetching high priority alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * NEW: Fetches all 'dismissed' alerts.
 * Includes pagination.
 */
export const getDismissedAlerts = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = 15;
    const skip = (page - 1) * limit;

    const query = { status: 'dismissed' };

    const [alerts, totalAlerts] = await Promise.all([
      Alert.find(query)
        .sort({ dismissed_until: 1 }) // Show alerts that will re-activate soonest
        .skip(skip)
        .limit(limit)
        .lean(),
      Alert.countDocuments(query)
    ]);
      
    res.status(200).json({
      alerts,
      totalAlerts,
      currentPage: page,
      totalPages: Math.ceil(totalAlerts / limit),
    });
  } catch (error) {
    console.error("Error fetching dismissed alerts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


/**
 * Dismisses an active alert for 12 hours.
 * It finds an alert by its _id (which is the entity_id) and
 * updates its status to 'dismissed'.
 */
export const dismissAlert = async (req, res) => {
  try {
    const { id } = req.params; // The _id of the alert (entity_id)
    
    // Set the dismissal "cooldown" time for 12 hours from now
    const dismissUntilTime = new Date(Date.now() + 12 * 60 * 60 * 1000); 

    const alert = await Alert.findOneAndUpdate(
      { _id: id, status: 'active' }, // Only find active alerts
      { 
        $set: { 
          status: 'dismissed',
          dismissed_until: dismissUntilTime 
        } 
      },
      { new: true } // Return the updated document
    );

    if (!alert) {
      return res.status(404).json({ message: "Alert not found or is not active." });
    }

    res.status(200).json(alert);
  } catch (error) {
    console.error("Error dismissing alert:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

