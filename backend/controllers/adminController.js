import Donor from "../models/donorModel.js";
import Facility from "../models/facilityModel.js";
// import Camp from "../models/campModel.js"; // Uncomment when you create the Camp model

// 🧩 Get Dashboard Overview Stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalDonors = await Donor.countDocuments();
    const totalFacilities = await Facility.countDocuments();
    const pendingFacilities = await Facility.countDocuments({ status: "pending" });
    const approvedFacilities = await Facility.countDocuments({ status: "approved" });

    // Count total donations across all donors
    const donors = await Donor.find({}, "donationHistory");
    const totalDonations = donors.reduce(
      (sum, donor) => sum + (donor.donationHistory?.length || 0),
      0
    );

    // Note: Ensure your Donor model uses 'eligibleToDonate' or 'isEligible' consistently
    const activeDonors = await Donor.countDocuments({ eligibleToDonate: true });

    // TODO: Replace placeholder with actual camp count when Camp model is ready
    // const upcomingCamps = await Camp.countDocuments({ status: "Upcoming" });
    const upcomingCamps = 0; 

    res.status(200).json({
      success: true,
      totalDonors,
      totalFacilities,
      approvedFacilities,
      pendingFacilities,
      totalDonations,
      activeDonors,
      upcomingCamps,
    });
  } catch (err) {
    console.error("Admin Stats Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

// 🧍 Get All Donors (With Pagination)
export const getAllDonors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const donors = await Donor.find()
      .select("-password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Newest first

    const total = await Donor.countDocuments();

    res.status(200).json({
      success: true,
      donors,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalDonors: total,
      },
    });
  } catch (err) {
    console.error("Get Donors Error:", err);
    res.status(500).json({ success: false, message: "Error fetching donors" });
  }
};

// 🏥 Get All Facilities (With Pagination & Optional Status Filter)
export const getAllFacilities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Allow frontend to filter by status (e.g., ?status=pending)
    const filter = req.query.status ? { status: req.query.status } : {};

    const facilities = await Facility.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Facility.countDocuments(filter);

    res.status(200).json({
      success: true,
      facilities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalFacilities: total,
      },
    });
  } catch (err) {
    console.error("Get Facilities Error:", err);
    res.status(500).json({ success: false, message: "Error fetching facilities" });
  }
};

// ✅ Approve a Facility
export const approveFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: "Facility not found" });

    facility.status = "approved";
    await facility.save();

    res.status(200).json({ success: true, message: "Facility approved successfully", facility });
  } catch (err) {
    console.error("Facility Approval Error:", err);
    res.status(500).json({ success: false, message: "Error approving facility" });
  }
};

// ❌ Reject / Update Facility Status to Rejected
export const rejectFacility = async (req, res) => {
  try {
    const facility = await Facility.findById(req.params.id);
    if (!facility) return res.status(404).json({ success: false, message: "Facility not found" });

    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required." });
    }

    facility.status = "rejected";
    facility.rejectionReason = rejectionReason;
    await facility.save();

    res.status(200).json({ success: true, message: "Facility rejected successfully", facility });
  } catch (err) {
    console.error("Facility Rejection Error:", err);
    res.status(500).json({ success: false, message: "Error rejecting facility" });
  }
};