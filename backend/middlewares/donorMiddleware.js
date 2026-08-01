import jwt from "jsonwebtoken";
import Donor from "../models/donorModel.js";

/**
 * @desc Protect donor-specific routes
 * @access Private (Donor Only)
 */
export const protectDonor = async (req, res, next) => {
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

    // 3. Security Check: Ensure the token actually belongs to a donor
    if (decoded.role !== "donor") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Donor role required." 
      });
    }

    // 4. Find donor in database
    const donor = await Donor.findById(decoded.id).select("-password");

    if (!donor) {
      return res.status(401).json({ 
        success: false, 
        message: "Donor associated with this token no longer exists." 
      });
    }

    // 5. Attach to request object
    req.donor = donor;
    
    // Optional: Also attach to req.user for consistency with other middlewares
    req.user = donor; 

    next();
    
  } catch (error) {
    console.error("🚨 Donor Auth Error:", error.name, error.message);
    
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