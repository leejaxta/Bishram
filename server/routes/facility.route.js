const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");

// Multer configuration
const storage = multer.memoryStorage(); // Store in memory for Cloudinary upload
const upload = multer({ storage });

const {
  getFacilities,
  createFacility,
  deleteFacility,
  updateFacility,
} = require("../controllers/facility.controller.js");

console.log("hello");
router.get("/", getFacilities);
// router.get("/:id", getProduct);

router.post(
  "/",
  upload.single("myImg"),
  authMiddleware,
  adminMiddleware,
  createFacility
);

router.put(
  "/:id",
  upload.single("myImg"),
  authMiddleware,
  adminMiddleware,
  updateFacility
);

router.delete("/:facilityId", authMiddleware, adminMiddleware, deleteFacility);
// router.post("/upload", upload.single("myImg"), uploadImage);

// update a product
// router.put("/:id", updateProduct);

// delete a product
// router.delete("/:id", deleteProduct);

module.exports = router;
