import jwt from "jsonwebtoken";
import Facility from "../models/facilityModel.js";

/**
 * @desc Protect facility-specific routes (Hospitals & Blood Labs)
 * @access Private (Facility Only)
 */
export const protectFacility = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Check if token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ 
        success: false, 
        message: "Access denied. No authentication token provided." 
      });
    }

    const token = authHeader.split(" ")[1].trim(); // .trim() prevents whitespace errors

    if (!process.env.JWT_SECRET) {
      console.error("⚠️ FATAL: JWT_SECRET is not defined in environment variables");
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error" 
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Security Check: Ensure the token actually belongs to a facility (hospital or blood-lab)
    if (decoded.role !== "hospital" && decoded.role !== "blood-lab") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Facility role (hospital or blood-lab) required." 
      });
    }

    // 4. Find facility in database
    const facility = await Facility.findById(decoded.id).select("-password");

    if (!facility) {
      return res.status(401).json({ 
        success: false, 
        message: "Facility associated with this token no longer exists." 
      });
    }

    // 5. Attach to request object
    req.user = facility;
    
    // Optional: Also attach to req.facility for explicit clarity in controllers
    req.facility = facility;

    next();
    
  } catch (error) {
    console.error("🚨 Facility Auth Error:", error.name, error.message);
    
    // Provide specific, user-friendly error messages
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