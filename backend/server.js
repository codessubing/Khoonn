// ✅ 1. Load dotenv FIRST (before any other imports)
import dotenv from "dotenv";
dotenv.config();

// ✅ 2. Now import everything else
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

//  Swagger
import { swaggerUi, swaggerDocs } from "./openapi/index.js";

import emergencyRoutes from "./routes/emergency.js";

// 🧩 Routes
import authRoutes from "./routes/authRoutes.js";
import donorRoutes from "./routes/donorRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import facilityRoutes from "./routes/facilityRoutes.js";
import bloodLabRoutes from "./routes/bloodLabRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

import bloodAvailabilityRoutes from "./routes/bloodAvailability.js";

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

// 🗄️ DB Connection (WITH IPv4 FIX)
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    family: 4 // 👈 FORCES IPv4
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));