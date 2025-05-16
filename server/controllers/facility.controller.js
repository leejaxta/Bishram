const Facility = require("../models/facility.model");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: "dvpndkzbb", // Replace with your Cloud Name
  api_key: process.env.CLOUDINARY_API_KEY, // Replace with your API Key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Replace with your API Secret
});

const getFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({});
    res.status(200).json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// const createFacility = async (req, res) => {
//   try {
//     const facility = await Facility.create(req.body);
//     res.status(200).json(facility);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const deleteFacility = async (req, res) => {
  try {
    const { facilityId } = req.params;

    // Validate if facilityId is provided
    if (!facilityId) {
      return res.status(400).json({ message: "Facility ID is required" });
    }

    // Find the facility by ID
    const facility = await Facility.findById(facilityId);

    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    const publicId = facility.public_id;

    // Delete the facility document
    await Facility.findByIdAndDelete(facilityId);

    // Delete the image from Cloudinary if public_id exists
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({
      message: "Facility deleted successfully",
      deletedFacility: {
        id: facility._id,
        name: facility.name,
      },
    });
  } catch (error) {
    console.error("Error deleting facility:", error);
    res.status(500).json({
      message: error.message || "Failed to delete facility",
    });
  }
};
const createFacility = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { name } = req.body;

    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "facilities", quality: "auto" }, // Set quality to auto
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(buffer); // Send the buffer to Cloudinary
      });
    };

    const result = await streamUpload(req.file.buffer);

    const facility = await Facility.create({
      name: name.toLowerCase(),
      myImg: result.secure_url,
      public_id: result.public_id,
    });

    res.status(201).json({
      message: "Facility uploaded successfully",
      facility: facility,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateFacility = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Find the facility to update
    const facility = await Facility.findById(id);
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    let updateData = {
      name: name ? name.toLowerCase() : facility.name,
    };

    // If there's a new image uploaded
    if (req.file) {
      // First delete the old image from Cloudinary if it exists
      if (facility.public_id) {
        await cloudinary.uploader.destroy(facility.public_id);
      }

      // Upload the new image
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "facilities", quality: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(buffer);
        });
      };

      const result = await streamUpload(req.file.buffer);

      // Add the new image data to the update
      updateData.myImg = result.secure_url;
      updateData.public_id = result.public_id;
    }

    // Update the facility in the database
    const updatedFacility = await Facility.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    res.status(200).json({
      message: "Facility updated successfully",
      facility: updatedFacility,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

module.exports = {
  getFacilities,
  deleteFacility,
  createFacility,
  updateFacility,
};
