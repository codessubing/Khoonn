// backend/server.js

// ✅ 1. Load dotenv FIRST (before any other imports)
import dotenv from "dotenv";
dotenv.config();

// ✅ 2. Now import everything else
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

// Swagger
import { swaggerUi, swaggerDocs } from "./openapi/index.js";

import emergencyRoutes from "./routes/emergency.js";

//  Routes
import authRoutes from "./routes/authRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import bloodLabRoutes from "./routes/bloodLabRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import bloodAvailabilityRoutes from "./routes/bloodAvailability.js";
import campRoutes, { setSocketIO as setCampSocketIO } from "./routes/campRoutes.js"; 
import transitRoutes, { setSocketIO as setTransitSocketIO } from "./routes/transitRoutes.js"; 
import liveTrackingRoutes from './routes/liveTrackingRoutes.js';

const app = express();

app.use(express.json());

// ✅ UPDATED CORS CONFIGURATION - Allow Vercel frontend + local development
app.use(cors({
  origin: [
    "http://localhost:5173", 
    "http://localhost:5174",
    "https://khoonn-sigma.vercel.app" 
  ],
  credentials: true,
}));

app.use('/api/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// 🗺️ Route Definitions
app.use("/api/auth", authRoutes);
app.use("/api/donor", donorRoutes);
app.use("/api/facility", facilityRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blood-lab", bloodLabRoutes);
app.use("/api/hospital", hospitalRoutes);
app.use("/api/contact", contactRoutes); 
app.use("/api/emergency", emergencyRoutes);
app.use("/api/blood", bloodAvailabilityRoutes);
app.use("/api/camps", campRoutes);
app.use("/api/transit", transitRoutes); 
app.use('/api/live', liveTrackingRoutes); 

// ✅ HEALTH CHECK ENDPOINT - For debugging
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Khoonn Blood Bank API is running!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development',
    routes: {
      auth: '/api/auth/login, /api/auth/register, /api/auth/profile',
      camps: '/api/camps',
      donors: '/api/donors',
      live: '/api/live',
      transit: '/api/transit'
    }
  });
});

// 🗄️ DB Connection (WITH IPv4 FIX)
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    family: 4
  })
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => {
    console.error("MongoDB Error ❌", err.message);
  });

// ✅ Startup validation to catch missing secrets immediately
if (!process.env.JWT_SECRET) {
  console.error(" FATAL: JWT_SECRET is missing from .env file!");
  process.exit(1);
}

// ✅ SOCKET.IO SETUP FOR REAL-TIME UPDATES
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "http://localhost:5174",
      "https://khoonn-sigma.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  // ✅ PRODUCTION FIX: Allow polling fallback and increase timeouts for Render cold starts
  transports: ["websocket", "polling"], 
  pingTimeout: 60000,   
  pingInterval: 25000   
});

// Make io accessible to routes via app.locals AND direct injection
app.locals.io = io;
setCampSocketIO(io);      
setTransitSocketIO(io);   

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on("join-camp", (campId) => {
    socket.join(`camp-${campId}`);
    console.log(`📡 Socket ${socket.id} joined room: camp-${campId}`);
  });
  
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ✅ DEBUG: Log all incoming requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ✅ FINAL 404 HANDLER
// ❌ REMOVED the '*' to fix the path-to-regexp error
app.use((req, res) => {
  console.log(`404 - Unhandled route: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    available_routes: [
      '/health',
      '/api/auth/login',
      '/api/auth/register', 
      '/api/camps',
      '/api/donors',
      '/api/live',
      '/api/transit'
    ]
  });
});

const PORT = process.env.PORT || 5000;
// ✅ Use httpServer instead of app.listen
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT} | Socket.IO ready`));
