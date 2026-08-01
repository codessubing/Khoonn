import express from "express";
import BloodCamp from "../models/bloodCampModel.js"; // ✅ Fixed: Use the correct model
import { protect, authorize } from "../middlewares/authMiddleware.js"; // ✅ Fixed: Use unified middleware

const router = express.Router();

/**
 * @swagger
 * /api/camps:
 *   get:
 *     summary: Get all upcoming blood camps (Public/Donor view)
 *     tags: [Camps]
 *     responses:
 *       200:
 *         description: List of upcoming camps
 */
// Public route: No 'protect' needed so donors can see it without logging in
router.get("/", async (req, res) => {
  try {
    const camps = await BloodCamp.find({ status: "Upcoming" }) // ✅ Fixed: Capitalized "Upcoming" to match schema enum
      .populate("hospital", "name address.city address.state phone") // ✅ Fixed: Populate correct facility fields
      .sort({ date: 1 });

    res.json({ success: true, camps });
  } catch (error) {
    console.error("Get camps error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching camps" });
  }
});

/**
 * @swagger
 * /api/camps/my-camps:
 *   get:
 *     summary: Get hospital's own camps
 *     tags: [Camps]
 *     security:
 *       - bearerAuth: []
 */
// Protected route: Only hospitals/admins can see their own camps
router.get("/my-camps", protect, authorize("hospital", "admin"), async (req, res) => {
  try {
    const camps = await BloodCamp.find({ hospital: req.user._id }).sort({ date: -1 });
    res.json({ success: true, camps });
  } catch (error) {
    console.error("Get hospital camps error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching hospital camps" });
  }
});

export default router;