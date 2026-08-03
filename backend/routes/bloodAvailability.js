// backend/routes/bloodAvailability.js
import express from "express";
import Blood from "../models/bloodModel.js";
import Facility from "../models/facilityModel.js";
import Redis from "ioredis";

// ✅ Initialize Redis client with graceful fallback
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
let redisAvailable = true;

redis.on("error", (err) => {
  if (redisAvailable) {
    console.warn("️ Redis connection lost, falling back to direct DB queries:", err.message);
    redisAvailable = false;
  }
});

redis.on("connect", () => {
  if (!redisAvailable) {
    console.log("✅ Redis reconnected, caching restored");
    redisAvailable = true;
  }
});

const router = express.Router();

router.get("/availability", async (req, res) => {
  try {
    const { bloodType, city } = req.query;

    // ✅ Validate required params
    if (!bloodType) {
      return res.status(400).json({
        success: false,
        message: "bloodType query parameter is required"
      });
    }

    // ✅ STEP 1: Check cache before hitting database
    let cached = null;
    if (redisAvailable) {
      try {
        const cacheKey = `blood_avail:${bloodType}:${city || "all"}`;
        cached = await redis.get(cacheKey);
      } catch (cacheErr) {
        console.warn("Redis read failed for this request:", cacheErr.message);
        redisAvailable = false;
      }
    }

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // ✅ Build match conditions
    const matchConditions = {
      bloodGroup: bloodType,
      quantity: { $gt: 0 },
      expiryDate: { $gt: new Date() },
      hospital: { $exists: true }
    };

    if (city) {
      const facilityIds = await Facility.find({
        "address.city": new RegExp(city, "i")
      }).select("_id");

      if (facilityIds.length === 0) {
        // No facilities in this city → return empty result (and cache it briefly)
        const emptyResponse = { success: true, count: 0, data: [] };
        if (redisAvailable) {
          try {
            await redis.setex(`blood_avail:${bloodType}:${city}`, 30, JSON.stringify(emptyResponse));
          } catch {}
        }
        return res.json(emptyResponse);
      }

      matchConditions.hospital = { $in: facilityIds.map(f => f._id) };
    }

    // ✅ Aggregate & anonymize
    const availability = await Blood.aggregate([
      { $match: matchConditions },
      { $lookup: {
          from: "facilities",
          localField: "hospital",
          foreignField: "_id",
          as: "facility"
      }},
      { $unwind: "$facility" },
      { $group: {
          _id: "$hospital",
          facilityName: { $first: "$facility.name" },
          address: { $first: "$facility.address" },
          phone: { $first: "$facility.phone" },
          totalUnits: { $sum: "$quantity" },
          nearestExpiry: { $min: "$expiryDate" }
      }},
      { $project: {
          _id: 0,
          facilityName: 1,
          address: { street: 1, city: 1, state: 1 },
          phone: 1,
          totalUnits: 1,
          nearestExpiry: 1,
          status: {
            $cond: [
              { $gte: ["$totalUnits", 10] }, "Well-Stocked",
              { $gte: ["$totalUnits", 3] }, "Available",
              "Limited"
            ]
          }
      }},
      { $sort: { nearestExpiry: 1 } }
    ]);

    const responseData = { success: true, count: availability.length, data: availability };

    // ✅ STEP 2: Store in cache after successful DB query
    if (redisAvailable) {
      try {
        const cacheKey = `blood_avail:${bloodType}:${city || "all"}`;
        // Cache for 60s normally, 30s if no results found
        const ttl = availability.length > 0 ? 60 : 30;
        await redis.setex(cacheKey, ttl, JSON.stringify(responseData));
      } catch (cacheErr) {
        console.warn("Redis write failed:", cacheErr.message);
        redisAvailable = false;
      }
    }

    res.json(responseData);
  } catch (err) {
    console.error("Availability search error:", err);
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

export default router;