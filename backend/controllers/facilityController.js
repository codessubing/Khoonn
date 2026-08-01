import Facility from "../models/facilityModel.js";
import bcrypt from "bcryptjs";

/**
 * @desc Get facility profile
 * @route GET /api/facility/profile
 */
export const getProfile = async (req, res) => {
  try {
    const facility = await Facility.findById(req.user.id)
      .select("-password -__v")
      .lean();

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found"
      });
    }

    res.status(200).json({
      success: true,
      facility
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching profile"
    });
  }
};

/**
 * @desc Update facility profile
 * @route PUT /api/facility/profile
 */
export const updateProfile = async (req, res) => {
  const session = await Facility.startSession();
  session.startTransaction();

  try {
    const facilityId = req.user.id; // Standardized to req.user.id from JWT payload

    // Validate facility exists
    const existingFacility = await Facility.findById(facilityId).session(session);
    if (!existingFacility) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Facility not found"
      });
    }

    const updates = { ...req.body };

    // Define allowed fields for update by the facility user
    const allowedFields = [
      "name", "phone", "emergencyContact", "operatingHours",
      "services", "description", "website", "contactPerson", "password"
    ];

    // Filter updates to only include allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key) && key !== "password") {
        filteredUpdates[key] = updates[key];
      }
    });

    // Handle address updates separately to merge with existing data safely
    if (updates.address && typeof updates.address === 'object') {
      filteredUpdates.address = {
        ...existingFacility.address.toObject(), 
        ...updates.address
      };
    }

    // Handle password update (if provided)
    if (updates.password) {
      if (updates.password.length < 6) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters long"
        });
      }
      const salt = await bcrypt.genSalt(12);
      filteredUpdates.password = await bcrypt.hash(updates.password, salt);
    }

    // ✅ OPTIMIZATION: Use $push with $each and $slice to keep history at max 50 items atomically
    const updatePayload = {
      ...filteredUpdates,
      $push: {
        history: {
          $each: [{
            eventType: "Profile Update",
            description: "Facility profile updated by user",
            date: new Date(),
          }],
          $slice: -50 // Keeps only the last 50 history entries
        }
      }
    };

    // Update facility in MongoDB
    const updatedFacility = await Facility.findByIdAndUpdate(
      facilityId,
      updatePayload,
      {
        new: true,
        runValidators: true,
        session,
        select: "-password -__v"
      }
    );

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      facility: updatedFacility
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("🚨 Update Facility Profile Error:", error);

    let errorMessage = "Failed to update profile";
    let validationErrors = {};

    if (error.name === 'ValidationError') {
      for (let field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      errorMessage = "Validation failed: Please check your input.";
    }

    res.status(400).json({
      success: false,
      message: errorMessage,
      errors: validationErrors,
      detail: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};

/**
 * @desc Facility dashboard overview
 * @route GET /api/facility/dashboard
 */
export const getFacilityDashboard = async (req, res) => {
  try {
    const facility = await Facility.findById(req.user.id)
      .select("name history facilityType")
      .lean();

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: "Facility not found"
      });
    }

    // ✅ SAFETY: Fallback to empty array in case history is undefined
    const history = facility.history || [];

    const totalCamps = history.filter(h => h.eventType === "Blood Camp").length;
    
    const recentHistory = history
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const dashboardData = {
      totalCamps,
      upcomingCamps: 2, // TODO: Replace with actual Camp model query
      bloodSlots: 10,   // TODO: Replace with actual Slot model query
      activeRequests: 4,// TODO: Replace with actual Request model query
      totalHistory: history.length,
      recentHistory,
    };

    res.status(200).json({
      success: true,
      facility: facility.name,
      facilityType: facility.facilityType,
      stats: dashboardData,
    });
  } catch (error) {
    console.error("Facility Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data"
    });
  }
};

/**
 * @desc Get all approved blood labs for hospitals to request from
 * @route GET /api/facility/labs
 */
export const getAllLabs = async (req, res) => {
  try {
    const labs = await Facility.find({ 
      facilityType: "blood-lab", 
      status: "approved" 
    }).select("name email phone address operatingHours").lean();

    res.status(200).json({ 
      success: true, 
      labs 
    });
  } catch (error) {
    console.error("Get Labs Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching blood labs" 
    });
  }
};