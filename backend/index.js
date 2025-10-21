// index.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import {router as uploadRoutes} from './routes/uploadRoutes.js';
import {router as searchRoutes} from './routes/searchRoutes.js';
import {router as loginRoutes} from './routes/loginRoutes.js';
import {router as dialogflowRoutes} from './routes/dialogflowRoutes.js';
import {router as userRoutes} from './routes/userRoutes.js';

import dotenv from 'dotenv';
dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mydb";

// Middleware
app.use(express.json());
app.use(cors());

// Basic route
app.get("/", (req, res) => {
  res.send("Hello, Express + MongoDB!");
});

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("Connected to MongoDB");
  // Start server only after DB connection
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
})
.catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Use user routes
app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sec', loginRoutes);
app.use('/api/dialogflow', dialogflowRoutes);