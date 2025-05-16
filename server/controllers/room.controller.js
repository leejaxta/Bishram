const Room = require("../models/room.model");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Use environment variables
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getDatesInRange = (checkIn, checkOut) => {
  let dateArray = [];
  let currentDate = new Date(checkIn);

  while (currentDate <= new Date(checkOut)) {
    dateArray.push(new Date(currentDate)); // Store each date
    currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
  }

  return dateArray;
};

const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({});
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    // Validate if roomId is provided
    if (!id) {
      return res.status(400).json({ message: "Room ID is required" });
    }

    // Find the room by ID
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const publicId = room.public_id;

    // Delete the room document
    await Room.findByIdAndDelete(id);

    // Delete the image from Cloudinary if public_id exists
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    res.status(200).json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Error deleting room:", error);
    res.status(500).json({
      message: error.message || "Failed to delete room",
    });
  }
};

const createRoom = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const {
      name,
      basic_amenities,
      room_specific_amenities,
      accommodation,
      price,
    } = req.body;
    const uploadedImages = [];
    const publicIds = [];

    // Function to upload a file to Cloudinary from buffer
    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "rooms", quality: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(fileBuffer);
      });
    };

    // Upload multiple images
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.buffer);
      uploadedImages.push(result.secure_url);
      publicIds.push(result.public_id);
    }

    const room = await Room.create({
      name: name.toLowerCase(),
      myImg: uploadedImages,
      price: price,
      public_id: publicIds.join(","),
      basic_amenities: basic_amenities ? JSON.parse(basic_amenities) : [],
      room_specific_amenities: room_specific_amenities
        ? JSON.parse(room_specific_amenities)
        : [],
      accommodation: accommodation ? JSON.parse(accommodation) : {},
    });

    res.status(201).json({
      message: "Room uploaded successfully",
      room: room,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      basic_amenities,
      room_specific_amenities,
      accommodation,
      price,
    } = req.body;

    // Find the existing room
    const existingRoom = await Room.findById(id);
    if (!existingRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Prepare update data
    const updateData = {
      name: name ? name.toLowerCase() : existingRoom.name,
      price: price || existingRoom.price,
      basic_amenities: basic_amenities
        ? JSON.parse(basic_amenities)
        : existingRoom.basic_amenities,
      room_specific_amenities: room_specific_amenities
        ? JSON.parse(room_specific_amenities)
        : existingRoom.room_specific_amenities,
      accommodation: accommodation
        ? JSON.parse(accommodation)
        : existingRoom.accommodation,
    };

    // Handle image updates if new files are provided
    if (req.files && req.files.length > 0) {
      const uploadToCloudinary = (fileBuffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "rooms", quality: "auto" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          stream.end(fileBuffer);
        });
      };

      // First delete old images from Cloudinary
      if (existingRoom.public_id) {
        const publicIds = existingRoom.public_id.split(",");
        for (const publicId of publicIds) {
          await cloudinary.uploader.destroy(publicId);
        }
      }

      // Upload new images
      const uploadedImages = [];
      const newPublicIds = [];

      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        uploadedImages.push(result.secure_url);
        newPublicIds.push(result.public_id);
      }

      updateData.myImg = uploadedImages;
      updateData.public_id = newPublicIds.join(",");
    }

    // Update the room in the database
    const updatedRoom = await Room.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    res.status(200).json({
      message: "Room updated successfully",
      room: updatedRoom,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const getRoomById = async (req, res) => {
  try {
    const { id } = req.params; // Get the ID from the URL parameter

    // Find the room by its ID
    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.status(200).json({
      message: "Room fetched successfully",
      room,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

// Add booking dates (check-in to check-out) to a room
const addBookedDates = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut } = req.body; // Expecting check-in and check-out dates

    // Validate input dates
    if (!checkIn || !checkOut) {
      return res
        .status(400)
        .json({ message: "Check-in and check-out dates are required." });
    }

    // Convert checkIn and checkOut to Date objects
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Check if check-out is after check-in
    if (checkOutDate <= checkInDate) {
      return res
        .status(400)
        .json({ message: "Check-out date must be after check-in date." });
    }

    // Find the room by ID
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Get all dates between check-in and check-out (inclusive)
    const bookedDates = getDatesInRange(checkInDate, checkOutDate);

    // Convert room booked dates to ISO string format for comparison
    const existingDates = room.booked_date.map(
      (date) => new Date(date).toISOString().split("T")[0] // Convert to YYYY-MM-DD format
    );

    // Check if any of the selected dates are already booked (check-in, check-out, or any in between)
    const overlappingDates = bookedDates.filter((date) =>
      existingDates.includes(date.toISOString().split("T")[0])
    );

    if (overlappingDates.length > 0) {
      return res.status(400).json({
        message: `Selected dates are already booked: ${overlappingDates
          .map((date) => date.toISOString().split("T")[0])
          .join(", ")}`,
      });
    }

    // Add new booked dates to the room
    room.booked_date.push(...bookedDates);

    // Save the updated room data
    await room.save();

    res.status(201).json({
      message: "Booking added successfully",
      bookedDates,
      room,
    });
  } catch (error) {
    res.status(500).json({ message: "Error adding booking dates", error });
  }
};

module.exports = {
  getRooms,
  deleteRoom,
  createRoom,
  getRoomById,
  addBookedDates,
  updateRoom,
};
