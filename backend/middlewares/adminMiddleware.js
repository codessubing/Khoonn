import jwt from "jsonwebtoken";
import Admin from "../models/adminModel.js";

/**
 * @desc Protect admin routes (Authenticate + Authorize Admin)
 * @route Middleware
 * @access Private (Admin Only)
 */
export const protectAdmin = async (req, res, next) => {
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

    // 3. Verify admin still exists in database (Security best practice)
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: "Admin user associated with this token no longer exists." 
      });
    }

    // 4. Verify role (Double-check both payload and DB for maximum security)
    if (decoded.role !== "admin" || admin.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Insufficient permissions. Admin role required." 
      });
    }

    // 5. Attach full admin object to request (better than just the decoded payload)
    req.user = admin;
    next();
    
  } catch (error) {
    console.error("🚨 Admin Auth Error:", error.name, error.message);
    
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