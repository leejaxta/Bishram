// routes/attractions.js
const express = require("express");
const router = express.Router();
// const attractionController = require("../controllers/attraction.controller");
const {
  getAllAttractions,
  getAttraction,
  createAttraction,
  updateAttraction,
  deleteAttraction,
  getHomestayLocation,
  updateHomestayLocation,
} = require("../controllers/attraction.controller.js");

// Attraction routes
router.get("/", getAllAttractions);
router.get("/:id", getAttraction);
router.post("/", createAttraction);
router.put("/:id", updateAttraction);
router.delete("/:id", deleteAttraction);

// Homestay location routes
router.get("/homestay/location", getHomestayLocation);
router.put("/homestay/location", updateHomestayLocation);

module.exports = router;
