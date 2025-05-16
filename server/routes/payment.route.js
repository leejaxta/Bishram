const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");

const {
  verifyPayment,
  bookingcount,
  getCurrentStays,
  generateInvoice,
  getPayments,
} = require("../controllers/payment.controller.js");

router.post("/verify", authMiddleware, verifyPayment);

router.get("/currentstays", authMiddleware, adminMiddleware, getCurrentStays);

router.get("/bookingcount", authMiddleware, adminMiddleware, bookingcount);
router.get("/invoice/:transactionId", generateInvoice);

router.get("/", getPayments);

module.exports = router;
