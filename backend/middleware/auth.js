// ✅ 1. Load dotenv FIRST to fix ESM hoisting issue
import dotenv from "dotenv";
dotenv.config();

// ✅ 2. All other imports (ensure no duplicates exist in this file)
import jwt from "jsonwebtoken";
import Donor from "../models/donorModel.js";
import Facility from "../models/facilityModel.js";
import Admin from "../models/adminModel.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("️ FATAL: JWT_SECRET is not defined in environment variables!");
}

/**
 * @desc Authenticate user via JWT token and attach correct model instance to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Extract token from "Bearer <token>" format
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided."
      });
    }

    // Verify token signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // ✅ DEBUG LOG: See exactly what role is in the token
    console.log("🔍 DECODED TOKEN ROLE:", decoded.role); 
    
    // ✅ DYNAMIC MODEL SELECTION based on stored role
    let User;
    switch (decoded.role) {
      case "donor":
        User = Donor;
        break;
      case "hospital":
      case "blood-lab":
      case "facility": // ✅ ADDED: Support legacy/alternate role name
        User = Facility;
        break;
      case "admin":
        User = Admin;
        break;
      default:
        console.log("❌ UNKNOWN ROLE IN TOKEN:", decoded.role);
        return res.status(401).json({
          success: false,
          message: `Invalid user role in token: ${decoded.role}`
        });
    }

    // Fetch user from the correct collection and exclude password
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("❌ USER NOT FOUND FOR ID:", decoded.id, "IN COLLECTION:", User.modelName);
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists."
      });
    }

    // Attach user to request object for downstream controllers/middleware
    req.user = user;
    next();
    
  } catch (error) {
    // Log the specific error for debugging
    console.error("🚨 Authentication Middleware Error:", error.name, "-", error.message);
    
    res.status(401).json({
      success: false,
      message: error.name === "TokenExpiredError" 
        ? "Token has expired. Please log in again." 
        : "Invalid or malformed authentication token."
    });
  }
};

/**
 * @desc Authorize user based on role(s)
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'hospital', 'donor')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Safeguard: Ensure authenticate middleware ran successfully
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before authorization."
      });
    }

    // Check if the user's role is included in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(", ")}. Your role: ${req.user.role}`
      });
    }
    
    next();
  };
};