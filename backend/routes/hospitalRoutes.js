import express from "express";
import {
  hospitalRequestBlood,
  getHospitalRequests,
  getHospitalDashboard,
  getHospitalStock,
  getHospitalHistory,
  getAllDonors,
  logContactAttempt
} from "../controllers/hospitalController.js";

// ✅ RECOMMENDED: Use unified middleware for strict role-based access control
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware combo: Ensure user is logged in AND is specifically a "hospital"
const protectHospitalOnly = [protect, authorize("hospital")];

/* ==============================================================
   DASHBOARD & INVENTORY
   ============================================================== */

/**
 * @swagger
 * /api/hospital/dashboard:
 *   get:
 *     summary: Get hospital dashboard statistics and recent requests
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.get("/dashboard", protectHospitalOnly, getHospitalDashboard);

/**
 * @swagger
 * /api/hospital/blood/stock:
 *   get:
 *     summary: Get current blood inventory for this hospital
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.get("/blood/stock", protectHospitalOnly, getHospitalStock);

/**
 * @swagger
 * /api/hospital/history:
 *   get:
 *     summary: Get hospital activity and stock update history
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.get("/history", protectHospitalOnly, getHospitalHistory);

/* ==============================================================
   BLOOD REQUEST MANAGEMENT
   ============================================================== */

/**
 * @swagger
 * /api/hospital/blood/request:
 *   post:
 *     summary: Request blood units from an approved blood lab
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [labId, bloodType, units]
 *             properties:
 *               labId:
 *                 type: string
 *               bloodType:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, O+, O-, AB+, AB-]
 *               units:
 *                 type: number
 */
router.post("/blood/request", protectHospitalOnly, hospitalRequestBlood);

/**
 * @swagger
 * /api/hospital/blood/requests:
 *   get:
 *     summary: Get all blood requests made by this hospital
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.get("/blood/requests", protectHospitalOnly, getHospitalRequests);

/* ==============================================================
   DONOR DIRECTORY & OUTREACH
   ============================================================== */

/**
 * @swagger
 * /api/hospital/donors:
 *   get:
 *     summary: Search and view available donors (with pagination/filters)
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 */
router.get("/donors", protectHospitalOnly, getAllDonors);

/**
 * @swagger
 * /api/hospital/donors/{id}/contact:
 *   post:
 *     summary: Log a contact attempt with a specific donor
 *     tags: [Hospital]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post("/donors/:id/contact", protectHospitalOnly, logContactAttempt);

export default router;