import express from "express";
import Donor from "../models/donorModel.js";
import { authenticate } from "../middleware/auth.js"; 
import { calculateHaversine } from "../utils/haversine.js"; 

const router = express.Router();

/**
 * POST /api/emergency/find-donors
 */
router.post("/find-donors", authenticate, async (req, res) => {
  try {
    const { bloodType, hospitalLat, hospitalLng, radiusKm = 5 } = req.body;

    if (!bloodType || hospitalLat === undefined || hospitalLng === undefined) {
      return res.status(400).json({ 
        success: false,
        message: "Missing required fields: bloodType, hospitalLat, hospitalLng" 
      });
    }

    const validBloodTypes = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];
    if (!validBloodTypes.includes(bloodType)) {
      return res.status(400).json({ success: false, message: "Invalid blood type" });
    }

    // ✅ Safely parse coordinates to numbers
    const lat = parseFloat(hospitalLat);
    const lng = parseFloat(hospitalLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, message: "Invalid coordinates provided" });
    }

    const radiusInRadians = parseFloat(radiusKm) / 6371;
    const minEligibleDate = new Date();
    minEligibleDate.setDate(minEligibleDate.getDate() - 56);

    const donors = await Donor.find({
      bloodGroup: bloodType,
      isActive: true,
      eligibleToDonate: true,
      "location.type": "Point", // ✅ Better filter than checking for null coordinates
      
      $or: [
        { lastDonationDate: { $lte: minEligibleDate } },
        { lastDonationDate: null },
      ],
      
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], radiusInRadians], // ✅ [longitude, latitude]
        },
      },
    })
      .select("fullName phone bloodGroup location lastDonationDate address.city")
      .limit(50);

    const donorsWithDistance = donors.map((donor) => ({
      _id: donor._id,
      fullName: donor.fullName,
      phone: donor.phone,
      bloodGroup: donor.bloodGroup,
      city: donor.address?.city || "Unknown",
      lastDonationDate: donor.lastDonationDate,
      distanceKm: calculateHaversine(
        lat, lng,
        donor.location?.coordinates?.[1], // ✅ Added optional chaining for safety
        donor.location?.coordinates?.[0]  
      ).toFixed(1),
    }));

    donorsWithDistance.sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));

    res.json({
      success: true,
      totalFound: donorsWithDistance.length,
      searchRadiusKm: radiusKm,
      bloodType,
      donors: donorsWithDistance,
      suggestion: donorsWithDistance.length === 0 ? "Try increasing search radius to 10km or 25km" : null
    });

  } catch (err) {
    console.error("🚨 Emergency donor search error:", err.message);
    // ✅ Return the ACTUAL error message so frontend doesn't show [undefined]
    res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to find donors. Ensure 2dsphere index exists." 
    });
  }
});

export default router;