const express = require("express");
const router = express.Router();
const multer = require("multer");
const { authMiddleware } = require("../middleware/authMiddleware");
const { adminMiddleware } = require("../middleware/adminMiddleware");
const {
  getHomepage,
  updateHomepage,
  uploadHeroImage,
  uploadSectionImage,
  uploadHomestayLogo,
} = require("../controllers/homepage.contoller.js");

const storage = multer.memoryStorage(); // Store in memory for Cloudinary upload
const upload = multer({ storage });

router.get("/", getHomepage);
router.put("/", authMiddleware, adminMiddleware, updateHomepage);
router.post(
  "/upload/hero",
  upload.single("file"),
  authMiddleware,
  adminMiddleware,
  uploadHeroImage
);
router.post(
  "/upload/section/:index",
  upload.single("file"),
  authMiddleware,
  adminMiddleware,
  uploadSectionImage
);
router.post(
  "/upload/homestay-logo",
  upload.single("file"),
  authMiddleware,
  adminMiddleware,
  uploadHomestayLogo
);

module.exports = router;
