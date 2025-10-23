import kafka from './kafka.js';

// 1. Initialize the producer
const producer = kafka.producer();
let producerConnected = false;

const connectProducer = async () => {
  await producer.connect();
  producerConnected = true;
  console.log("Producer connected");
};

// Connect producer on startup
connectProducer().catch(err => {
  console.error("Failed to connect producer", err);
  process.exit(1);
});

/**
 * A generic handler to send data to a Kafka topic.
 * @param {string} topic - The Kafka topic to send to.
 * @param {object} data - The data payload from req.body.
 * @param {string} keyField - The field in `data` to use as the Kafka message key.
 * @param {object} res - The Express response object.
 */
const genericKafkaHandler = async (topic, data, keyField, res) => {
  try {
    if (!producerConnected) {
      return res.status(503).json({ message: "Service unavailable. Producer is not connected." });
    }

    const key = data[keyField];
    if (!key) {
      return res.status(400).json({ message: `Missing required key field: ${keyField}` });
    }

    await producer.send({
      topic: topic,
      messages: [
        {
          key: key.toString(),
          value: JSON.stringify(data),
        },
      ],
    });

    return res.status(202).json({
      message: "Data accepted and queued for processing.",
      topic: topic,
      data: data,
    });

  } catch (error) {
    console.error(`Error handling ${topic}:`, error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// --- Define Handlers for each Endpoint ---

// Handler for Card Swipes
export const handleCardSwipe = (req, res) => {
  // Validation
  if (!req.body.card_id || !req.body.timestamp || !req.body.location_id) {
    return res.status(400).json({ message: "Missing required fields: card_id, timestamp, location_id" });
  }
  genericKafkaHandler("card-swipes", req.body, "location_id", res);
};

// Handler for CCTV Frames
export const handleCctvFrame = (req, res) => {
  if (!req.body.location_id || !req.body.timestamp) {
    return res.status(400).json({ message: "Missing required fields: location_id, timestamp" });
  }
  genericKafkaHandler("cctv-frames", req.body, "location_id", res);
};

// Handler for Free Text Notes
export const handleFreeTextNote = (req, res) => {
  if (!req.body.entity_id || !req.body.category || !req.body.text) {
    return res.status(400).json({ message: "Missing required fields: entity_id, category, text" });
  }
  genericKafkaHandler("free-text-notes", req.body, "entity_id", res);
};

// Handler for Lab Bookings
export const handleLabBooking = (req, res) => {
  if (!req.body.entity_id || !req.body.room_id || !req.body.start_time || !req.body.end_time) {
    return res.status(400).json({ message: "Missing fields: entity_id, room_id, start_time, end_time" });
  }
  genericKafkaHandler("lab-bookings", req.body, "room_id", res);
};

// Handler for Library Checkouts
export const handleLibraryCheckout = (req, res) => {
  if (!req.body.entity_id || !req.body.book_id) {
    return res.status(400).json({ message: "Missing required fields: entity_id, book_id" });
  }
  genericKafkaHandler("library-checkouts", req.body, "entity_id", res);
};

// Handler for WiFi Logs
export const handleWifiLog = (req, res) => {
  if (!req.body.device_hash || !req.body.ap_id || !req.body.timestamp) {
    return res.status(400).json({ message: "Missing required fields: device_hash, ap_id, timestamp" });
  }
  genericKafkaHandler("wifi-logs", req.body, "ap_id", res);
};

