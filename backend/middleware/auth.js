import jwt from "jsonwebtoken";
import User from "../models/UserModel.js"; // Ensure this path matches your actual User model

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("⚠️ FATAL: JWT_SECRET is not defined in environment variables!");
}

/**
 * @desc Authenticate user via JWT token
 * @access Public (Middleware)
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

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch user and exclude password
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User associated with this token no longer exists."
      });
    }

    // Attach user to request object for downstream controllers/middleware
    req.user = user;
    next();
    
  } catch (error) {
    // Log the specific error for debugging (e.g., TokenExpiredError, JsonWebTokenError)
    console.error("🚨 Authentication Middleware Error:", error.name, error.message);
    
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
 * @access Private (Middleware)
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