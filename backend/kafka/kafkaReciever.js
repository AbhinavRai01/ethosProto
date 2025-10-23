import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import kafka from './kafka.js';

// Import all models
import CampusCardSwipe from '../models/campusCardSwipes.js';
import CctvFrame from '../models/CctvFrams.js';
import FreeTextNote from '../models/freeTextNotes.js';
import LabBooking from '../models/labBookings.js';
import LibraryCheckout from '../models/libraryCheckout.js';
import WifiLog from '../models/wifiLogs.js';

// Load .env variables
configDotenv();

// MongoDB Configuration
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/swipe-db";

// Kafka Configuration
const TOPICS = [
  "card-swipes",
  "cctv-frames",
  "free-text-notes",
  "lab-bookings",
  "library-checkouts",
  "wifi-logs"
];
const CONSUMER_GROUP_ID = "mongo-all-data-writer-group";

// 1. Initialize Kafka Consumer and a Producer for the Dead-Letter Queue (DLQ)
const consumer = kafka.consumer({ groupId: CONSUMER_GROUP_ID });
const dlqProducer = kafka.producer();

const runWorker = async () => {
  try {
    // 3. Connect to MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB via Mongoose');

    // 4. Connect to Kafka Consumer
    await consumer.connect();
    console.log("Consumer connected");
    // Subscribe without `fromBeginning: true` to avoid re-reading old messages
    await consumer.subscribe({ topics: TOPICS });
    console.log(`Subscribed to all topics: ${TOPICS.join(', ')}`);

    // 5. Connect DLQ Producer
    await dlqProducer.connect();
    console.log("DLQ Producer connected (for handling errors)");

    // 6. Run the consumer
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const messageValueString = message.value.toString();
        let data;

        try {
          data = JSON.parse(messageValueString);

          // 7. Route data to the correct Mongoose model based on topic
          switch (topic) {
            case "card-swipes":
              await new CampusCardSwipe(data).save();
              console.log(`SUCCESS: Saved card swipe: ${data.card_id}`);
              break;
            
            case "cctv-frames":
              await new CctvFrame(data).save();
              console.log(`SUCCESS: Saved cctv frame at: ${data.location_id}`);
              break;

            case "free-text-notes":
              await new FreeTextNote(data).save();
              console.log(`SUCCESS: Saved note for entity: ${data.entity_id}`);
              break;

            case "lab-bookings":
              await new LabBooking(data).save();
              console.log(`SUCCESS: Saved booking for room: ${data.room_id}`);
              break;

            case "library-checkouts":
              await new LibraryCheckout(data).save();
              console.log(`SUCCESS: Saved checkout for book: ${data.book_id}`);
              break;

            case "wifi-logs":
              await new WifiLog(data).save();
              console.log(`SUCCESS: Saved wifi log for device: ${data.device_hash}`);
              break;

            default:
              console.warn(`No handler for topic: ${topic}`);
          }

        } catch (err) {
          // --- ERROR HANDLING ---
          console.error(`FAILURE: Error processing topic ${topic}:`, err.message);
          console.error("Failed message data:", messageValueString);

          // Send the failed message to a Dead-Letter Queue (DLQ) topic
          try {
            const dlqTopic = `${topic}-dlq`;
            await dlqProducer.send({
              topic: dlqTopic,
              messages: [
                {
                  key: message.key,
                  value: message.value,
                  headers: {
                    'x-original-topic': topic,
                    'x-error-message': err.message,
                    'x-error-stack': err.stack || 'N/A',
                  }
                }
              ]
            });
            console.log(`Sent failed message to DLQ topic: ${dlqTopic}`);
          } catch (dlqError) {
            console.error(`CRITICAL: Failed to send message to DLQ:`, dlqError);
          }
        }
      },
    });

  } catch (error) {
    console.error("Critical error in worker:", error);
    process.exit(1);
  }
};

// Run the worker
runWorker();

// Handle graceful shutdown
const errorTypes = ['unhandledRejection', 'uncaughtException'];
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

errorTypes.forEach(type => {
  process.on(type, async e => {
    try {
      console.log(`process.on ${type}`);
      console.error(e);
      await consumer.disconnect();
      await dlqProducer.disconnect();
      await mongoose.connection.close();
      process.exit(0);
    } catch (_) {
      process.exit(1);
    }
  });
});

signalTraps.forEach(type => {
  process.once(type, async () => {
    try {
      console.log(`Signal ${type} received. Shutting down...`);
      await consumer.disconnect();
      await dlqProducer.disconnect();
      await mongoose.connection.close();
      console.log("Shutdown complete.");
    } finally {
      process.kill(process.pid, type);
    }
  });
});

