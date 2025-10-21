// index.js
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const uploadRoutes = require('./routes/uploadRoutes');
// const searchRoutes = require('./routes/searchRoutes');
// const userRoutes = require('./routes/userRoutes');
// const loginRoutes = require('./routes/loginRoutes');

// require("dotenv").config(); // optional, for environment variables


// const app = express();
// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mydb";

// // Middleware
// app.use(express.json());
// app.use(cors());

// // Basic route
// app.get("/", (req, res) => {
//   res.send("Hello, Express + MongoDB!");
// });

// // Connect to MongoDB
// mongoose.connect(MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => {
//   console.log("Connected to MongoDB");
//   // Start server only after DB connection
//   app.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
//   });
// })
// .catch((err) => {
//   console.error("MongoDB connection error:", err);
// });

// // Use user routes
// app.use('/api/users', userRoutes);
// app.use('/api/uploads', uploadRoutes);
// app.use('/api/search', searchRoutes);
// app.use('/api/sec', loginRoutes);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const { Server } = require("socket.io");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const uploadRoutes = require('./routes/uploadRoutes');
const searchRoutes = require('./routes/searchRoutes');
const userRoutes = require('./routes/userRoutes');
const loginRoutes = require('./routes/loginRoutes');

require("dotenv").config();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mydb";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Hello, Express + MongoDB + Socket.IO!");
});

app.use('/api/users', userRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sec', loginRoutes);

io.on('connection', (socket) => {
    console.log('A user connected with socket id:', socket.id);

    socket.on('summarize_stream', async (data) => {
        const { formattedData, userName } = data;

        const systemPrompt = `You are a behavioral analyst for a university. Your task is to create a detailed narrative of a user's predicted daily schedule based on probabilistic data. Leave a line gap bewtween each paragraph, the output should not be one block of text, but split into 3 paragraphs

The output should be structured into three distinct paragraphs, one for each period of the day:
1.  **Morning (roughly 12 AM to 7 AM):** Describe their likely morning routine, including potential breakfast spots, early classes, or study sessions.
2.  **Daytime (roughly 8 AM to 3 PM):** Detail their activities during the main part of the day. This could involve lunch, lectures, lab work, or time spent in common areas like the library or gym.
3.  **Evening (roughly 4 PM to 12 AM):** Describe their potential evening activities, such as dinner, late study sessions, social gatherings, or returning to their hostel.`
    const userQuery = `Summarize the following predicted schedule for user, it should be short in length and in 3 paragraphs. Leave 2 lines gap between each paragraph to enhance readability${userName}: ${formattedData}`
        
        try {
            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.5-pro",
                systemInstruction: systemPrompt,
            });
            const result = await model.generateContentStream(userQuery);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    socket.emit('summary_chunk', { text: chunkText });
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        } catch (error) {
            console.error("Error during Gemini stream:", error);
            socket.emit('stream_error', { error: 'Failed to generate summary. Check backend console for details.' });
        } finally {
            socket.emit('stream_end');
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log("Connected to MongoDB");
    httpServer.listen(PORT, () => {
        console.log(`Server with WebSocket support running at http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error("MongoDB connection error:", err);
});


