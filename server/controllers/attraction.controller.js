// controllers/attractionController.js
const Attraction = require("../models/attraction.model");
const Settings = require("../models/setting.model");
// Get all attractions
const getAllAttractions = async (req, res) => {
  try {
    const attractions = await Attraction.find();
    res.json(attractions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single attraction
const getAttraction = async (req, res) => {
  try {
    const attraction = await Attraction.findById(req.params.id);
    if (!attraction) {
      return res.status(404).json({ message: "Attraction not found" });
    }
    res.json(attraction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create attraction
const createAttraction = async (req, res) => {
  const attraction = new Attraction({
    name: req.body.name,
    description: req.body.description,
    distance: req.body.distance,
    travelTime: req.body.travelTime,
    coords: req.body.coords,
  });

  try {
    const newAttraction = await attraction.save();
    res.status(201).json(newAttraction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update attraction
const updateAttraction = async (req, res) => {
  try {
    const attraction = await Attraction.findById(req.params.id);
    if (!attraction) {
      return res.status(404).json({ message: "Attraction not found" });
    }

    attraction.name = req.body.name || attraction.name;
    attraction.description = req.body.description || attraction.description;
    attraction.distance = req.body.distance || attraction.distance;
    attraction.travelTime = req.body.travelTime || attraction.travelTime;
    attraction.coords = req.body.coords || attraction.coords;

    const updatedAttraction = await attraction.save();
    res.json(updatedAttraction);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete attraction
const deleteAttraction = async (req, res) => {
  try {
    const attraction = await Attraction.findById(req.params.id);
    if (!attraction) {
      return res.status(404).json({ message: "Attraction not found" });
    }

    // Use deleteOne() or findByIdAndDelete() instead
    await Attraction.deleteOne({ _id: req.params.id });
    // Alternatively: await Attraction.findByIdAndDelete(req.params.id);

    res.json({ message: "Attraction deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Get homestay location
const getHomestayLocation = async (req, res) => {
  try {
    const settings = await Settings.getSingleton();
    res.json({ coords: settings.homestayCoords });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update homestay location
const updateHomestayLocation = async (req, res) => {
  try {
    // Validate coordinates
    if (!Array.isArray(req.body.coords) || req.body.coords.length !== 2) {
      return res.status(400).json({ message: "Invalid coordinates format" });
    }

    const [lat, lng] = req.body.coords;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Invalid coordinates values" });
    }

    const settings = await Settings.getSingleton();
    settings.homestayCoords = req.body.coords;
    await settings.save();

    res.json({
      message: "Homestay location updated",
      coords: settings.homestayCoords,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getAllAttractions,
  getAttraction,
  createAttraction,
  updateAttraction,
  deleteAttraction,
  getHomestayLocation,
  updateHomestayLocation,
};
