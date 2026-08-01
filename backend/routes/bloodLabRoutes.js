import express from "express";
import {
  createBloodCamp,
  deleteBloodCamp,
  getBloodLabCamps,
  getBloodLabDashboard,
  getBloodLabHistory,
  updateBloodCamp,
  updateCampStatus,
  addBloodStock,
  removeBloodStock,
  getBloodStock,
  updateBloodRequestStatus,
  getLabBloodRequests,
  getAllLabs,
} from "../controllers/bloodLabController.js";

// ✅ RECOMMENDED: Use unified protect + authorize for stricter security
import { protect, authorize } from "../middlewares/authMiddleware.js";

import { 
  getRecentDonations, 
  markDonation, 
  searchDonor 
} from "../controllers/donorController.js";

const router = express.Router();

// Middleware combo: Ensure user is logged in AND is specifically a "blood-lab"
const protectLab = [protect, authorize("blood-lab")];

/* ==============================================================
   DASHBOARD & HISTORY
   ============================================================== */

/**
 * @swagger
 * /api/blood-lab/dashboard:
 *   get:
 *     summary: Get blood lab dashboard statistics
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.get("/dashboard", protectLab, getBloodLabDashboard);

/**
 * @swagger
 * /api/blood-lab/history:
 *   get:
 *     summary: Get blood lab activity history
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.get("/history", protectLab, getBloodLabHistory);

/* ==============================================================
   BLOOD CAMP MANAGEMENT
   ============================================================== */

/**
 * @swagger
 * /api/blood-lab/camps:
 *   post:
 *     summary: Create a new blood camp
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.post("/camps", protectLab, createBloodCamp);

/**
 * @swagger
 * /api/blood-lab/camps:
 *   get:
 *     summary: Get all blood camps for this lab
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.get("/camps", protectLab, getBloodLabCamps);

/**
 * @swagger
 * /api/blood-lab/camps/{id}:
 *   put:
 *     summary: Update a blood camp
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put("/camps/:id", protectLab, updateBloodCamp);

/**
 * @swagger
 * /api/blood-lab/camps/{id}/status:
 *   patch:
 *     summary: Update blood camp status
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch("/camps/:id/status", protectLab, updateCampStatus);

/**
 * @swagger
 * /api/blood-lab/camps/{id}:
 *   delete:
 *     summary: Delete a blood camp
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete("/camps/:id", protectLab, deleteBloodCamp);

/* ==============================================================
   BLOOD STOCK MANAGEMENT
   ============================================================== */

/**
 * @swagger
 * /api/blood-lab/blood/add:
 *   post:
 *     summary: Add blood units to lab stock
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.post("/blood/add", protectLab, addBloodStock);

/**
 * @swagger
 * /api/blood-lab/blood/remove:
 *   post:
 *     summary: Remove blood units from lab stock
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.post("/blood/remove", protectLab, removeBloodStock);

/**
 * @swagger
 * /api/blood-lab/blood/stock:
 *   get:
 *     summary: Get current blood stock for this lab
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.get("/blood/stock", protectLab, getBloodStock);

/* ==============================================================
   BLOOD REQUEST MANAGEMENT
   ============================================================== */

/**
 * @swagger
 * /api/blood-lab/blood/requests:
 *   get:
 *     summary: Get all blood requests for this lab
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.get("/blood/requests", protectLab, getLabBloodRequests);

/**
 * @swagger
 * /api/blood-lab/blood/requests/{id}:
 *   put:
 *     summary: Accept or reject a blood request
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put("/blood/requests/:id", protectLab, updateBloodRequestStatus);

/* ==============================================================
   DONOR DIRECTORY & ACTIONS
   ============================================================== */

/**
 * @swagger
 * /api/blood-lab/labs:
 *   get:
 *     summary: Get all approved blood labs (Accessible by hospitals)
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
// Note: This specific route might need authorize("hospital", "blood-lab") if hospitals call it
router.get("/labs", protect, authorize("hospital", "blood-lab"), getAllLabs);

/**
 * @swagger
 * /api/blood-lab/donors/search:
 *   get:
 *     summary: Search donors by name, email, phone, or city
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.get("/donors/search", protectLab, searchDonor);

/**
 * @swagger
 * /api/blood-lab/donors/donate/{id}:
 *   post:
 *     summary: Mark a donor's donation as completed
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post("/donors/donate/:id", protectLab, markDonation);

/**
 * @swagger
 * /api/blood-lab/donations/recent:
 *   get:
 *     summary: Get recent donations at this lab
 *     tags: [Blood Lab]
 *     security:
 *       - bearerAuth: []
 */
router.get("/donations/recent", protectLab, getRecentDonations);

export default router;