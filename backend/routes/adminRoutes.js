import express from "express";
// ✅ Import both protect and authorize for maximum security
import { protect, authorize } from "../middlewares/authMiddleware.js";
import {
  getAllFacilities,
  approveFacility,
  rejectFacility,
  getDashboardStats,
  getAllDonors,
} from "../controllers/adminController.js";

const router = express.Router();

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 */
router.get("/dashboard", protect, authorize("admin"), getDashboardStats);

/**
 * @swagger
 * /api/admin/facilities:
 *   get:
 *     summary: Get all facilities (for admin review)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get("/facilities", protect, authorize("admin"), getAllFacilities);

/**
 * @swagger
 * /api/admin/facility/approve/{id}:
 *   put:
 *     summary: Approve a pending facility
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put("/facility/approve/:id", protect, authorize("admin"), approveFacility);

/**
 * @swagger
 * /api/admin/facility/reject/{id}:
 *   put:
 *     summary: Reject a pending facility
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put("/facility/reject/:id", protect, authorize("admin"), rejectFacility);

/**
 * @swagger
 * /api/admin/donors:
 *   get:
 *     summary: Get all donors (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
// ✅ FIXED: Added protect and authorize("admin") to prevent unauthorized access
router.get("/donors", protect, authorize("admin"), getAllDonors);

export default router;