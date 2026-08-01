import express from "express";
import {
  getAllLabs,
  getFacilityDashboard,
  getProfile,
  updateProfile,
} from "../controllers/facilityController.js";

// ✅ RECOMMENDED: Use unified middleware for centralized security
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware combo: Ensure user is logged in AND is a hospital or blood-lab
const protectFacilityOnly = [protect, authorize("hospital", "blood-lab")];

/**
 * @swagger
 * /api/facility/dashboard:
 *   get:
 *     summary: Get facility dashboard statistics
 *     tags: [Facility]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 */
router.get("/dashboard", protectFacilityOnly, getFacilityDashboard);

/**
 * @swagger
 * /api/facility/profile:
 *   get:
 *     summary: Get authenticated facility's profile details
 *     tags: [Facility]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Facility profile retrieved successfully
 */
router.get("/profile", protectFacilityOnly, getProfile);

/**
 * @swagger
 * /api/facility/profile:
 *   put:
 *     summary: Update facility profile (name, phone, address, password, etc.)
 *     tags: [Facility]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               password:
 *                 type: string
 */
router.put("/profile", protectFacilityOnly, updateProfile);

/**
 * @swagger
 * /api/facility/labs:
 *   get:
 *     summary: Get all approved blood labs (Used by hospitals to request blood)
 *     tags: [Facility]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of approved blood labs
 */
// Note: If only hospitals should see this, change authorize to authorize("hospital")
router.get("/labs", protect, authorize("hospital", "blood-lab"), getAllLabs);

export default router;