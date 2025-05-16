const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");

const {
  requestCleaning,
  getUserCleaningRequests,
  getPaymentCleaningRequests,
  cancelCleaningRequest,
  getAllCleaningRequests,
  updateCleaningStatus,
} = require("../controllers/roomCleaning.controller");

// User routes
router.post("/request", authMiddleware, requestCleaning);
router.get("/user", adminMiddleware, getUserCleaningRequests);
router.get("/payment/:paymentId", authMiddleware, getPaymentCleaningRequests);
router.put("/cancel/:requestId", authMiddleware, cancelCleaningRequest);

// Admin routes
router.get("/admin", authMiddleware, adminMiddleware, getAllCleaningRequests);
router.put(
  "/admin/:requestId",
  authMiddleware,
  adminMiddleware,
  updateCleaningStatus
);

module.exports = router;
