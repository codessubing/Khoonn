import bcrypt from "bcryptjs";
import Donor from "../models/donorModel.js";
import Facility from "../models/facilityModel.js";
import Admin from "../models/adminModel.js";
import jwt from "jsonwebtoken";

/**
 * REGISTER (Unified)
 */
export const register = async (req, res) => {
  try {
    const { role } = req.body; 

    if (!role) {
      return res.status(400).json({ success: false, message: "Role is required" });
    }

    // 🧹 SAFETY FILTER: Prevent frontend from saving incomplete GeoJSON objects
    if (req.body.location) {
      const loc = req.body.location;
      if (loc.type === "Point" && (!loc.coordinates || loc.coordinates.length !== 2)) {
        delete req.body.location;
        delete req.body.lastLocationUpdate;
      }
    }

    let user;

    if (role === "donor") {
      user = await Donor.create(req.body);
    } else if (role === "hospital" || role === "blood-lab") {
      user = await Facility.create(req.body);
    } else {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    const redirect = role === "donor" ? "/donor" : "/";

    res.status(201).json({
      success: true,
      message:
        role === "donor"
          ? "Donor registered successfully! Redirecting to login..."
          : "Facility registered successfully! Please wait for admin approval.",
      user: { id: user._id, email: user.email, role: user.role },
      redirect,
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false,
        message: "Validation failed", 
        errors: errorMessages 
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    res.status(500).json({ success: false, message: "Registration failed", error: error.message });
  }
};

/**
 * LOGIN (Unified)
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    let user =
      (await Donor.findOne({ email }).select("+password")) ||
      (await Admin.findOne({ email }).select("+password")) ||
      (await Facility.findOne({ email }).select("+password"));

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user instanceof Facility) {
      if (user.status === "pending") {
        return res.status(403).json({
          success: false,
          message: "Your account is awaiting admin approval. Please wait before logging in.",
        });
      }
      if (user.status === "rejected") {
        return res.status(403).json({
          success: false,
          message: "Your registration has been rejected by admin. Contact support for details.",
        });
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.lastLogin = new Date();
    if (user instanceof Facility) {
      user.history.push({
        eventType: "Login",
        description: "Facility logged in successfully",
        date: new Date(),
      });
      if (user.history.length > 50) user.history = user.history.slice(-50);
    }
    
    // 💡 Note: Under the hood, Mongoose uses 'updateOne' here to save changes to the DB
    await user.save();

    let redirect = "/";
    if (user.role === "donor") redirect = "/donor";
    else if (user.role === "hospital") redirect = "/hospital";
    else if (user.role === "blood-lab") redirect = "/lab";
    else if (user.role === "admin") redirect = "/admin";

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, email: user.email, role: user.role, status: user.status },
      redirect,
    });
  } catch (error) {
    console.error("🚨 Login Error:", error);
    res.status(500).json({ success: false, message: "Login failed", error: error.message });
  }
};

/**
 * PROFILE FETCH
 */
export const getProfile = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userRole = req.user.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Invalid user data in request" });
    }

    let user;
    if (userRole === "donor") {
      user = await Donor.findById(userId).select("-password");
    } else if (userRole === "admin") {
      user = await Admin.findById(userId).select("-password");
    } else {
      user = await Facility.findById(userId).select("-password");
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ success: false, message: "Error fetching profile", error: error.message });
  }
};