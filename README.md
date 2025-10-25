# 🎓 Ethos: Campus Entity Resolution & Security Monitoring System

> A comprehensive full-stack application for unifying, analyzing, and predicting campus activity.

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.0+-61dafb.svg)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-000000.svg)](https://flask.palletsprojects.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-47A248.svg)](https://www.mongodb.com/)

</div>

---

## 📖 Overview

**Ethos** is part of the **Saptang Labs Product Development Challenge** — a sophisticated MERN & Python-based system designed to solve the problem of siloed data on modern campuses. 

By ingesting disconnected data from various sources (card swipes, Wi-Fi logs, CCTV, lab bookings), Ethos fuses them into **unified entity profiles**, providing a powerful security dashboard for:
- 📊 Real-time user timeline visualization
- 🔮 Predictive activity forecasting with explainable AI
- 🗺️ Campus-wide activity hotspot analysis

---

## ✨ Core Features

### 🔗 1. Unified Entity Profile & Timeline

Resolves and links multiple identifiers (`card_id`, `face_id`, `device_hash`) to a single, unique `entity_id`. The dashboard presents a complete, chronological timeline of all events for any user across all datasets.

### 📤 2. Multi-Source Data Upload

Administrator-facing **Upload Center** for seamless data ingestion:

- **Excel/CSV Support**: For log-based data (swipes, bookings, Wi-Fi, etc.)
- **ZIP File Handling**: For bulk image uploads (profile photos)
- **Automated Data Cleaning**: De-duplicates and sanitizes records upon upload

### 🤖 3. Predictive Daily Timeline (ML-Powered Forecasting)
Generate 24-hour predicted timelines for any entity on any given day with hour-by-hour location forecasts.
XGBoost Sequential Model:

Multi-Feature Learning: Combines temporal patterns (hour, day of week), location history (last 3 locations), and user context (department)
Sequential Prediction: Uses previous predictions to inform next hour's forecast, creating realistic daily trajectories
Confidence Scoring: Each prediction includes probability-based confidence metrics
Feature Engineering:

Temporal: Hour of day, day of week
Spatial: Last 3 visited locations (sequential memory)
Contextual: User department for peer behavior patterns


Production-Ready: Pre-trained model with pickled assets for instant predictions

### 💬 4. AI-Powered Summarization (Real-time Streaming)

Transform predicted timelines into concise, natural-language summaries:

- **Gemini API Integration**: Leverages Google's Gemini for intelligent text generation
- **WebSocket Streaming**: Real-time "typewriter" effect via `flask-socketio` and `socket.io-client`

### 🔥 5. Campus Activity Hotspot Analysis

✅ Visual Hour Comparison section that highlights campus activity flow changes:

Side-by-side mini heatmaps with independent, real-time sliders for hour selection.

A detailed comparison table showing numerical data and percentage differences.

User-friendly color-coded indicators for quick insights:

🟢 Green for user count increases.

🔴 Red for user count decreases.

Instant visual feedback to help administrators understand how activity shifts across campus


### 🔍 6. "Search by Face" Identification

Advanced security feature for person identification from images:

**Computer Vision Pipeline:**
1. **Face Detection**: MTCNN for face extraction
2. **Embedding Generation**: FaceNet (Inception ResnetV1) creates 128-dimension vectors
3. **High-Speed Matching**: Cosine similarity search across 7,000+ enrolled user embeddings

### 7. Real Time Kafka Pipeline

A robust, event-driven architecture for real-time data ingestion.

**Kafka Data Pipeline:**

Decoupled Ingestion: API endpoints act as Kafka Producers, pushing high-volume data streams (swipes, logs) to dedicated topics. This ensures data is never lost, even if downstream services are busy or temporarily offline.

Scalable Consumers: A dedicated consumer service subscribes to Kafka topics, processes the raw event data, and stores it efficiently in MongoDB for analysis.

### 🚨 8. Automated Alerting System

**Periodic ETL:** A background service runs every 5 minutes to extract, transform, and load fresh data, creating an up-to-date snapshot of campus activity.

**Condition Detection:** Automatically flags critical events based on predefined rules, such as:

**👤 Missing Persons:** Identifies entities not seen within a configurable time threshold.

**Overcrowding:** Monitors location populations against their defined capacity.

🚫 **Violations:** Detects unauthorized access based on time-of-day or location-specific rules.

**Dynamic Risk Scoring:** Intelligently prioritizes alerts by combining static risk factors (base risk of an entity or location) with dynamic ones (time of day, severity). The system learns by slightly increasing the base risk score of an entity each time an alert is triggered, making repeat issues more prominent.

### 💬 9. NLU-Powered Chat Assistant

An intuitive conversational interface allowing operators to query the system's vast database using simple, natural language.

**Google Dialogflow Integration:** The chat assistant is powered by Google's state-of-the-art Natural Language Understanding (NLU) engine. This allows the system to understand user intent and extract key information from sentences.

**Seamless Workflow:**

An operator types a question like, "Show me Debarghya Das's activity on October 24th" into the chat window.

The query is sent to Dialogflow, which identifies the intent (get_user_timeline) and extracts entities ( name: "Debarghya Das", date: "October 24th").

Dialogflow sends this structured data to a secure backend webhook.

The backend controller queries the MongoDB database for the relevant records.

A clear, human-readable summary is generated and sent back to the user through the chat interface.

**Powerful & Flexible Queries:** Operators can ask a wide range of questions without needing to know complex database queries, such as:

"Who is face ID F100001?"

"List all active overcrowding alerts."

"What was the last known location of entity E101234?"

### 📌 10. Pinned Entities & Homepage Watchlist

Allows operators to "mark" or "pin" specific entity profiles directly from their profile page. These marked profiles are then displayed in a dedicated "Watchlist" module on the main homepage, providing one-click access to their live timelines. This is ideal for actively monitoring persons of interest, VIPs, or ongoing investigations without needing to search for them each session.

## 🛠️ Technical Stack

<table>
<tr>
<td width="50%">

### 🎨 Frontend
- **Framework**: React.js 18+
- **Routing**: react-router-dom
- **Styling**: Tailwind CSS
- **Visualizations**: heatmap.js, chart.js
- **Real-time**: socket.io-client

</td>
<td width="50%">

### ⚙️ Backend
- **Framework**: Flask 2.3+
- **WebSockets**: flask-socketio
- **AI**: google-generativeai (Gemini)
- **Data**: pandas, numpy

</td>
</tr>
<tr>
<td width="50%">

### 🧠 Machine Learning
- **Face Detection**: MTCNN
- **Face Embedding**: keras-facenet
- **Similarity**: scipy (Cosine)

</td>
<td width="50%">

### 💾 Database
- **Primary**: MongoDB
- **Storage**: Firebase Storage

</td>
</tr>
</table>

---

## 🚀 Setup and Installation

### Prerequisites

- Python 3.9+
- Node.js 16+
- MongoDB instance
- Firebase project
- Google Gemini API key
- Kafka Binary server

### 📦 Backend Setup (Flask & Python)

```bash
# 1. Clone the repository
git clone https://your-repo-url.git
cd flask_backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# Create .env file with:
GOOGLE_API_KEY="your_gemini_api_key_here"
MONGO_URI="your_mongodb_connection_string"

# 5. (Optional) Run data cleaning scripts
python PythonScripts/profilesClean.py

# 6. Start the server
python index.py
```

**Server runs on:** `http://localhost:5000`

---

### 🎨 Frontend Setup (React)

```bash
# 1. Navigate to frontend directory
cd ../frontend

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Create .env file with:
REACT_APP_FIREBASE_API_KEY="your_firebase_api_key"
REACT_APP_FIREBASE_AUTH_DOMAIN="your_firebase_auth_domain"
REACT_APP_FIREBASE_PROJECT_ID="your_firebase_project_id"
REACT_APP_FIREBASE_STORAGE_BUCKET="your_firebase_storage_bucket"
REACT_APP_FIREBASE_MESSAGING_SENDER_ID="your_firebase_sender_id"
REACT_APP_FIREBASE_APP_ID="your_firebase_app_id"

# 4. Start development server
npm start
```

**App opens on:** `http://localhost:3000`

---

## 📸 Screenshots

<table>
  <tr>
    <td><img src="https://i.postimg.cc/7hySHzRv/Screenshot-2025-10-25-221910.png" alt="Screenshot 1" width="300"></td>
    <td><img src="https://i.postimg.cc/6qLnyQkS/Screenshot-2025-10-25-221932.png" alt="Screenshot 2" width="300"></td>
    <td><img src="https://i.postimg.cc/brHksv74/Screenshot-2025-10-25-222016.png" alt="Screenshot 3" width="300"></td>
  </tr>
  <tr>
    <td><img src="https://i.postimg.cc/tCJFX9SC/Screenshot-2025-10-25-221840.png" alt="Screenshot 4" width="300"></td>
    <td><img src="https://i.postimg.cc/GtJGHpWZ/Screenshot-2025-10-25-222258.png" alt="Screenshot 5" width="300"></td>
    <td><img src="https://i.postimg.cc/5yqL60cM/Screenshot-2025-10-25-222428.png" alt="Screenshot 6" width="300"></td>
  </tr>
  <tr>
    <td><img src="https://i.postimg.cc/4N4js2hw/Screenshot-2025-10-25-222728.png" alt="Screenshot 7" width="300"></td>
    <td><img src="https://i.postimg.cc/mkNCtDxF/Screenshot-2025-10-25-222624.png" alt="Screenshot 8" width="300"></td>
    <td><img src="https://i.postimg.cc/gcvvMMwk/Screenshot-2025-10-25-222658.png" alt="Screenshot 9" width="300"></td>
  </tr>
  <tr>
    <td><img src="https://i.postimg.cc/jqzz88WS/Screenshot-2025-10-25-222728.png" alt="Screenshot 10" width="300"></td>
    <td><img src="https://i.postimg.cc/dtwGg8dv/Screenshot-2025-10-25-222810.png" alt="Screenshot 11" width="300"></td>
    <td><img src="https://i.postimg.cc/tCpF8hP9/Screenshot-2025-10-25-222839.png" alt="Screenshot 12" width="300"></td>
  </tr>
  <tr>
    <td><img src="https://i.postimg.cc/yYs02F9Y/Screenshot-2025-10-25-222902.png" alt="Screenshot 13" width="300"></td>
    <td><img src="https://i.postimg.cc/bYZ2WpmH/Screenshot-2025-10-25-231244.png" alt="Screenshot 13" width="300"></td>
    <td><img src="https://i.postimg.cc/h4N7q6Yr/Screenshot-2025-10-25-231308.png" alt="Screenshot 13" width="300"></td>
    <td></td>
  </tr>
</table>
---

<div align="center">

**[⬆ back to top](#-ethos-campus-entity-resolution--security-monitoring-system)**

</div>
