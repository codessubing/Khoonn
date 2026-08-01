import express from "express";
import { 
  getDonorProfile, 
  updateDonorProfile, 
  getDonorCamps, 
  getDonorHistory, 
  getDonorStats 
} from "../controllers/donorController.js";

// ✅ RECOMMENDED: Use unified middleware for consistency across the app
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware combo: Ensure user is logged in AND is specifically a "donor"
const protectDonorOnly = [protect, authorize("donor")];

/**
 * @swagger
 * /api/donor/profile:
 *   get:
 *     summary: Get authenticated donor's profile
 *     tags: [Donor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Donor profile retrieved successfully
 */
router.get("/profile", protectDonorOnly, getDonorProfile);

/**
 * @swagger
 * /api/donor/profile:
 *   put:
 *     summary: Update authenticated donor's profile
 *     tags: [Donor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               weight:
 *                 type: number
 */
router.put("/profile", protectDonorOnly, updateDonorProfile);

/**
 * @swagger
 * /api/donor/camps:
 *   get:
 *     summary: Get upcoming blood camps (can be public or protected)
 *     tags: [Donor]
 *     security:
 *       - bearerAuth: []
 */
router.get("/camps", protectDonorOnly, getDonorCamps);

/**
 * @swagger
 * /api/donor/history:
 *   get:
 *     summary: Get paginated donation history for the donor
 *     tags: [Donor]
 *     security:
 *       - bearerAuth: []
 */
router.get("/history", protectDonorOnly, getDonorHistory);

/**
 * @swagger
 * /api/donor/stats:
 *   get:
 *     summary: Get donor dashboard statistics (total donations, eligibility)
 *     tags: [Donor]
 *     security:
 *       - bearerAuth: []
 */
router.get("/stats", protectDonorOnly, getDonorStats);

export default router;