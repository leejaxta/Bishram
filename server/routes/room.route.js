const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");

// Multer configuration
const storage = multer.memoryStorage(); // Store in memory for Cloudinary upload
const upload = multer({ storage });

const {
  getRooms,
  createRoom,
  deleteRoom,
  getRoomById,
  // addReview,
  addBookedDates,
  updateRoom,
} = require("../controllers/room.controller.js");

console.log("hello");
router.get("/", getRooms);
// router.get("/:id", getProduct);

router.post(
  "/",
  upload.array("myImg", 3),
  authMiddleware,
  adminMiddleware,
  createRoom
);

router.put(
  "/:id",
  upload.array("myImg", 3),
  authMiddleware,
  adminMiddleware,
  updateRoom
);

router.delete("/:id", authMiddleware, adminMiddleware, deleteRoom);

router.get("/:id", getRoomById);

// router.post("/:id/review", addReview);

router.post("/:id/bookings", addBookedDates);

// router.post("/upload", upload.single("myImg"), uploadImage);

// update a product
// router.put("/:id", updateProduct);

// delete a product
// router.delete("/:id", deleteProduct);

module.exports = router;
