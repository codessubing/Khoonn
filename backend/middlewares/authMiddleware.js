import jwt from "jsonwebtoken";
import Donor from "../models/donorModel.js";
import Admin from "../models/adminModel.js";
import Facility from "../models/facilityModel.js";

/**
 * @desc Protect routes (Unified Authentication Middleware)
 * @access Private
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check if token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. No authentication token provided." 
      });
    }

    const token = authHeader.split(" ")[1].trim();

    if (!process.env.JWT_SECRET) {
      console.error("⚠️ FATAL: JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error" 
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user in the respective collection
    let user = null;
    if (decoded.role === "donor") {
      user = await Donor.findById(decoded.id).select("-password");
    } else if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id).select("-password");
    } else if (decoded.role === "hospital" || decoded.role === "blood-lab") {
      user = await Facility.findById(decoded.id).select("-password");
    } else {
      // Fallback for legacy tokens or edge cases
      user = 
        (await Donor.findById(decoded.id).select("-password")) ||
        (await Admin.findById(decoded.id).select("-password")) ||
        (await Facility.findById(decoded.id).select("-password"));
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: "User associated with this token no longer exists or is unauthorized." 
      });
    }

    // 4. ✅ CRITICAL FIX: Attach the FULL user object and explicitly map _id to id
    req.user = {
      ...user.toObject(), 
      id: user._id, // <-- This guarantees req.user.id exists for all controllers
      role: decoded.role 
    };

    next();
    
  } catch (error) {
    console.error("🚨 Auth Middleware Error:", error.name, error.message);
    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ 
        success: false, 
        message: "Token has expired. Please log in again." 
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: "Invalid or malformed authentication token." 
    });
  }
};

/**
 * @desc Authorize user based on role(s)
 * @access Private (Middleware)
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before authorization."
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`
      });
    }
    
    next();
  };
};