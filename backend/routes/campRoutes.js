// backend/routes/campRoutes.js
import express from "express";
import mongoose from "mongoose";
import QRCode from "qrcode";
import BloodCamp from "../models/bloodCampModel.js";
import Donor from "../models/donorModel.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";
// ✅ NEW: Import eligibility validator service
import { validateDonorEligibility } from "../services/eligibilityValidator.js";
// ✅ NEW: Import donation recording service
import { recordDonation } from "../services/donationRecorder.js";
// ✅ NEW: Import camp report service
import { generateCampReportData } from '../services/campReportService.js';

// ✅ Socket.IO instance injected by server.js
let io;
export function setSocketIO(socketInstance) {
  io = socketInstance;
}

const router = express.Router();

/**
 * @swagger
 * /api/camps:
 *   get:
 *     summary: Get all upcoming blood camps (Public/Donor view)
 *     tags: [Camps]
 *     responses:
 *       200:
 *         description: List of upcoming camps
 */
router.get("/", async (req, res) => {
  try {
    const camps = await BloodCamp.find({ status: "Upcoming" })
      .populate("hospital", "name address.city address.state phone")
      .sort({ date: 1 });

    res.json({ success: true, camps });
  } catch (error) {
    console.error("Get camps error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching camps" });
  }
});

/**
 * @swagger
 * /api/camps/my-camps:
 *   get:
 *     summary: Get hospital's own camps
 *     tags: [Camps]
 *     security:
 *       - bearerAuth: []
 */
router.get("/my-camps", protect, authorize("hospital", "admin"), async (req, res) => {
  try {
    const camps = await BloodCamp.find({ hospital: req.user._id }).sort({ date: -1 });
    res.json({ success: true, camps });
  } catch (error) {
    console.error("Get hospital camps error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching hospital camps" });
  }
});

// ✅ NEW: Get single camp details by ID (Required for Registration Page)
router.get("/:campId", async (req, res) => {
  try {
    const { campId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(campId)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid camp ID format: ${campId}. Expected 24-character hex string.` 
      });
    }

    const camp = await BloodCamp.findById(campId)
      .populate("hospital", "name address.city address.state phone");

    if (!camp) {
      return res.status(404).json({ 
        success: false, 
        message: `Camp with ID ${campId} not found in database.` 
      });
    }

    // Return in format expected by frontend (res.data.camps || res.data.data)
    res.json({ success: true, data: camp, camps: camp });
  } catch (error) {
    console.error("Get camp error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching camp" });
  }
});

// ✅ Register donor for a specific camp
router.post("/:campId/register", protect, authorize("donor"), async (req, res) => {
  try {
    const { campId } = req.params;
    const donorId = req.user._id;

    // Enhanced validation with better error messages
    if (!mongoose.Types.ObjectId.isValid(campId)) {
      // Check if the ID might be truncated (23 chars instead of 24)
      if (campId.length === 23) {
        // Try to find if there's a similar ID in the database
        const possibleMatches = await BloodCamp.find({
          _id: { $regex: new RegExp(`^${campId}`, 'i') }
        });
        
        if (possibleMatches.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Camp ID appears to be truncated. Did you mean: ${possibleMatches[0]._id}?`,
            suggestedId: possibleMatches[0]._id.toString()
          });
        }
      }
      
      return res.status(400).json({ 
        success: false, 
        message: `Invalid camp ID format: ${campId}. Expected 24-character hex string. Length: ${campId.length}` 
      });
    }

    // 1. Validate donor eligibility
    const donor = await Donor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: "Donor not found" });
    }

    if (!donor.isEligible) {
      const daysSinceLast = Math.floor(
        (Date.now() - new Date(donor.lastDonationDate)) / (1000 * 60 * 60 * 24)
      );
      return res.status(400).json({
        success: false,
        message: `Not eligible yet. Last donation was ${daysSinceLast} days ago. Minimum gap is 90 days.`
      });
    }

    // 2. Validate camp capacity & existence
    const camp = await BloodCamp.findById(campId);
    if (!camp) {
      return res.status(404).json({ success: false, message: `Camp with ID ${campId} not found` });
    }

    if (camp.actualDonors >= camp.expectedDonors) {
      return res.status(400).json({
        success: false,
        message: "Camp is at full capacity. Please join the waitlist or find another camp."
      });
    }

    // 3. Prevent duplicate registration
    const alreadyRegistered = camp.registeredDonors.some(
      (reg) => reg.donor.toString() === donorId.toString()
    );
    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this camp."
      });
    }

    // 4. Generate unique QR token
    const registrationToken = `${campId}_${donorId}_${Date.now()}`;
    const qrCodeDataUrl = await QRCode.toDataURL(registrationToken);

    // 5. Save registration to camp document
    camp.registeredDonors.push({
      donor: donorId,
      registeredAt: new Date(),
      qrToken: registrationToken,
      checkedIn: false
    });

    await camp.save();

    res.json({
      success: true,
      message: "Successfully registered!",
      data: {
        campName: camp.title,
        campDate: camp.date,
        venue: camp.location.venue,
        qrCode: qrCodeDataUrl,
        registrationToken
      }
    });

  } catch (err) {
    console.error("Camp registration error:", err);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
});

// ✅ NEW: Check-in donor via QR token scan WITH REAL-TIME SYNC & ELIGIBILITY PRE-CHECK
router.post("/:campId/checkin", protect, authorize("hospital", "admin"), async (req, res) => {
  try {
    const { campId } = req.params;
    const { qrToken } = req.body;

    if (!mongoose.Types.ObjectId.isValid(campId)) {
      return res.status(400).json({ success: false, message: "Invalid camp ID" });
    }

    if (!qrToken) {
      return res.status(400).json({ success: false, message: "QR token is required" });
    }

    // 1. Find the camp
    const camp = await BloodCamp.findById(campId);
    if (!camp) {
      return res.status(404).json({ success: false, message: "Camp not found" });
    }

    // 2. Find the registration entry matching the token
    const registrationIndex = camp.registeredDonors.findIndex(
      (reg) => reg.qrToken === qrToken
    );

    if (registrationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired QR code. Please verify the donor registered for this specific camp."
      });
    }

    const registration = camp.registeredDonors[registrationIndex];

    // 3. Prevent double check-in
    if (registration.checkedIn) {
      return res.status(400).json({
        success: false,
        message: "Donor has already been checked in.",
        data: {
          donorName: registration.donor?.fullName || "Unknown",
          checkInTime: registration.checkInTime
        }
      });
    }

    // ✅ 4. NEW: Real-time eligibility pre-check BEFORE any database writes
    const eligibility = await validateDonorEligibility(registration.donor.toString());

    if (!eligibility.isEligible) {
      return res.status(400).json({
        success: false,
        message: `Donor ineligible: ${eligibility.reason}`,
        data: {
          donorName: registration.donor?.fullName || "Unknown",
          daysUntilEligible: eligibility.daysUntilEligible || null
        }
      });
    }

    // 5. Mark as checked in & increment actual donors (only if eligible)
    camp.registeredDonors[registrationIndex].checkedIn = true;
    camp.registeredDonors[registrationIndex].checkInTime = new Date();
    camp.actualDonors += 1;

    await camp.save();

    // 6. Populate donor details for response
    const populatedCamp = await BloodCamp.findById(campId)
      .populate(`registeredDonors.${registrationIndex}.donor`, "fullName phone bloodGroup");

    // ✅ 7. BROADCAST REAL-TIME UPDATE TO ALL CONNECTED STAFF DEVICES
    if (io) {
      io.to(`camp-${campId}`).emit("check-in-update", {
        totalCheckedIn: camp.actualDonors,
        expectedDonors: camp.expectedDonors,
        donor: populatedCamp.registeredDonors[registrationIndex].donor,
        checkInTime: new Date()
      });
      console.log(`📡 Broadcasted check-in update for camp ${campId}`);
    }

    res.json({
      success: true,
      message: "Check-in successful!",
      data: {
        donor: populatedCamp.registeredDonors[registrationIndex].donor,
        checkInTime: new Date(),
        totalCheckedIn: camp.actualDonors,
        expectedDonors: camp.expectedDonors
      }
    });

  } catch (err) {
    console.error("Check-in error:", err);
    res.status(500).json({ success: false, message: "Check-in failed" });
  }
});

// POST /api/camps/:campId/donate - Record completed donation after check-in
router.post("/:campId/donate", protect, authorize("hospital", "admin"), async (req, res) => {
  try {
    const { campId } = req.params;
    const { donorId, units = 1, bloodType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(campId)) {
      return res.status(400).json({ success: false, message: "Invalid camp ID" });
    }

    if (!donorId || !bloodType) {
      return res.status(400).json({ 
        success: false, 
        message: "Donor ID and blood type are required" 
      });
    }

    // Validate units
    if (units <= 0 || units > 2) {
      return res.status(400).json({
        success: false,
        message: 'Units must be between 1 and 2'
      });
    }

    // Verify donor was actually checked in for this camp
    const camp = await BloodCamp.findById(campId);
    if (!camp) {
      return res.status(404).json({ success: false, message: "Camp not found" });
    }

    const registration = camp.registeredDonors.find(
      r => r.donor.toString() === donorId && r.checkedIn === true
    );

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: "Donor has not been checked in for this camp. Check in first."
      });
    }

    // Prevent duplicate donation recording
    if (registration.donationRecorded) {
      return res.status(400).json({
        success: false,
        message: "Donation already recorded for this donor at this camp."
      });
    }

    // Use the service function for transaction-safe donation recording
    const result = await recordDonation({ 
      campId, 
      donorId, 
      units, 
      bloodType 
    });

    // The service handles all database updates in a transaction
    // Update the camp record to reflect donation was recorded
    const regIndex = camp.registeredDonors.findIndex(
      r => r.donor.toString() === donorId
    );
    camp.registeredDonors[regIndex].donationRecorded = true;
    camp.registeredDonors[regIndex].donationRecordedAt = new Date();
    camp.registeredDonors[regIndex].unitsDonated = units;
    await camp.save();

    // Broadcast to staff devices
    if (io) {
      io.to(`camp_${campId}`).emit("donation_recorded", {
        campId,
        donorId,
        donorName: result.donor.fullName || "Unknown",
        bloodType,
        units,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        donor: result.donor,
        unitsDonated: result.unitsDonated
      }
    });

  } catch (err) {
    console.error("Donate endpoint error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Failed to record donation: " + err.message 
    });
  }
});

// GET /api/camps/:campId/report - Generate camp report data for PDF
router.get('/:campId/report', protect, authorize('hospital', 'admin'), async (req, res) => {
  try {
    const { campId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(campId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid camp ID' 
      });
    }

    const reportData = await generateCampReportData(campId);
    
    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error generating camp report:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate camp report: ' + error.message 
    });
  }
});

export default router;