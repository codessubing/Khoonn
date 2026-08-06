// backend/routes/transitRoutes.js
import express from "express";
import mongoose from "mongoose";
import TransitTracking from "../models/transitTrackingModel.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
// ✅ ADDED: Import the ETA calculation service
import { getArrivalWave, calculateETA } from "../services/etaCalculator.js";

let io;
export function setSocketIO(socketInstance) {
  io = socketInstance;
}

const router = express.Router();

// POST /api/transit/start - Donor begins sharing location
router.post("/start", protect, authorize("donor"), async (req, res) => {
  try {
    const { campId, coordinates, batteryLevel } = req.body;
    
    if (!campId || !coordinates || coordinates.length !== 2) {
      return res.status(400).json({ 
        success: false, 
        message: "campId and valid [lng, lat] coordinates are required" 
      });
    }

    // Deactivate any existing tracking for this donor
    await TransitTracking.updateMany(
      { donor: req.user._id, isActive: true },
      { $set: { isActive: false } }
    );

    const tracking = await TransitTracking.create({
      donor: req.user._id,
      camp: campId,
      location: { type: "Point", coordinates },
      batteryLevel: batteryLevel ?? null,
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
    });

    // Broadcast to camp room
    if (io) {
      io.to(`camp-${campId}`).emit("donor-transit-update", {
        donorId: req.user._id,
        coordinates,
        batteryLevel
        // ✅ REMOVED: eta calculation here requires camp location which isn't available in this scope
        // The frontend or predictions endpoint handles ETA calculation instead
      });
    }

    res.json({ success: true, data: tracking });
  } catch (err) {
    console.error("Start transit error:", err);
    res.status(500).json({ success: false, message: "Failed to start transit tracking" });
  }
});

// PATCH /api/transit/update - Update current position
router.patch("/update", protect, authorize("donor"), async (req, res) => {
  try {
    const { coordinates, batteryLevel } = req.body;
    
    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid [lng, lat] coordinates are required" 
      });
    }

    const tracking = await TransitTracking.findOneAndUpdate(
      { donor: req.user._id, isActive: true },
      { 
        $set: { 
          "location.coordinates": coordinates,
          batteryLevel: batteryLevel ?? undefined,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
        } 
      },
      { new: true }
    );

    if (!tracking) {
      return res.status(404).json({ 
        success: false, 
        message: "No active tracking session found. Call /start first." 
      });
    }

    // Broadcast update
    if (io) {
      io.to(`camp-${tracking.camp}`).emit("donor-transit-update", {
        donorId: req.user._id,
        coordinates,
        batteryLevel
      });
    }

    res.json({ success: true, data: tracking });
  } catch (err) {
    console.error("Update transit error:", err);
    res.status(500).json({ success: false, message: "Failed to update location" });
  }
});

// DELETE /api/transit/stop - Donor stops sharing
router.delete("/stop", protect, authorize("donor"), async (req, res) => {
  try {
    const result = await TransitTracking.updateMany(
      { donor: req.user._id, isActive: true },
      { $set: { isActive: false } }
    );

    res.json({ 
      success: true, 
      message: "Transit tracking stopped",
      deactivated: result.modifiedCount 
    });
  } catch (err) {
    console.error("Stop transit error:", err);
    res.status(500).json({ success: false, message: "Failed to stop tracking" });
  }
});

// GET /api/transit/camp/:campId/active - Staff view of approaching donors
router.get("/camp/:campId/active", protect, authorize("hospital", "admin", "blood-lab"), async (req, res) => {
  try {
    const { campId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(campId)) {
      return res.status(400).json({ success: false, message: "Invalid camp ID" });
    }

    const activeDonors = await TransitTracking.find({
      camp: campId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
    .populate("donor", "fullName phone bloodGroup")
    .sort({ updatedAt: -1 })
    .limit(50);

    res.json({ 
      success: true, 
      count: activeDonors.length,
      data: activeDonors 
    });
  } catch (err) {
    console.error("Get active transit error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch active donors" });
  }
});

// GET /api/transit/camp/:campId/predictions - Staff view of arrival forecasts
router.get("/camp/:campId/predictions", protect, authorize("hospital", "admin", "blood-lab"), async (req, res) => {
  try {
    const { campId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(campId)) {
      return res.status(400).json({ success: false, message: "Invalid camp ID" });
    }

    const wave = await getArrivalWave(campId);
    
    // Aggregate summary for quick scanning
    const summary = {
      totalApproaching: wave.length,
      arrivingIn15Min: wave.filter(d => d.isImminent).length,
      avgDistanceKm: wave.reduce((sum, d) => sum + (d.distanceKm || 0), 0) / (wave.length || 1),
      lowBatteryCount: wave.filter(d => d.batteryLevel !== null && d.batteryLevel < 20).length
    };

    res.json({ success: true, summary, predictions: wave });
  } catch (err) {
    console.error("Prediction error:", err);
    res.status(500).json({ success: false, message: "Failed to generate predictions" });
  }
});

export default router;