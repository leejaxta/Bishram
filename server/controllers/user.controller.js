const User = require("../models/user.model");
const Room = require("../models/room.model.js");
const Payment = require("../models/payment.model");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const getUsers = async (req, res) => {
  const { email, password } = req.query;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        name: user.name,
        number: user.number,
      },
      process.env.JWT_SECRET, // Your JWT secret key from the .env file
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Return user details and token
    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        number: user.number,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const createUser = async (req, res) => {
  try {
    console.log("ougyo");
    const { email, password, name, number, address } = req.body;
    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name,
      email,
      number,
      address,
      password: hashedPassword,
    }); // Changed variable name from User to newUser

    // Generate a JWT token
    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        name: newUser.name,
        number: newUser.number,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      message: "User created successfully!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        number: newUser.number,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.log(error);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, number, address, password } = req.body;

    // Find the user first
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (number) updateData.number = number;
    if (address) updateData.address = address;

    // Only hash password if it's being updated
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    ).select("-password"); // Exclude password from the result

    // Check if any token-relevant fields were changed
    const shouldRegenerateToken =
      (name && name !== user.name) ||
      (email && email !== user.email) ||
      (number && number !== user.number);

    // Generate new token only if name, email, or number changed
    let token;
    if (shouldRegenerateToken) {
      token = jwt.sign(
        {
          id: updatedUser._id,
          email: updatedUser.email,
          isAdmin: updatedUser.isAdmin,
          name: updatedUser.name,
          number: updatedUser.number,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
    }

    const response = {
      message: "User updated successfully",
      user: updatedUser,
    };

    if (token) {
      response.token = token;
    }

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error(error);
  }
};

const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // 1. Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Both current and new password are required",
      });
    }

    // 2. Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // 4. Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // 5. Return success
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Password change error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const bookingHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const bookings = await Payment.find({ user: id });
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No booking history found",
      });
    }

    const roomIds = [
      ...new Set(bookings.map((booking) => booking.room.toString())),
    ];
    const rooms = await Room.find({ _id: { $in: roomIds } });
    const roomMap = rooms.reduce((map, room) => {
      map[room._id.toString()] = room;
      return map;
    }, {});

    // Timezone-aware status calculation
    const getBookingStatus = (checkIn, checkOut) => {
      // Get current date in local time
      const today = new Date();
      const todayLocal = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      // Convert booking dates to local dates
      const checkInDate = new Date(checkIn);
      const checkInLocal = new Date(
        checkInDate.getFullYear(),
        checkInDate.getMonth(),
        checkInDate.getDate()
      );

      const checkOutDate = new Date(checkOut);
      const checkOutLocal = new Date(
        checkOutDate.getFullYear(),
        checkOutDate.getMonth(),
        checkOutDate.getDate()
      );

      if (todayLocal > checkOutLocal) return "completed";
      if (todayLocal >= checkInLocal) return "ongoing";
      return "upcoming";
    };

    const transformedBookings = bookings.map((booking) => {
      const room = roomMap[booking.room.toString()];

      return {
        id: booking._id,
        name: room?.name || "Unknown Room",
        myImg: room?.myImg?.[0] ? [room.myImg[0]] : [],
        price: room?.price || 0,
        adults: booking.adults,
        children: booking.children,
        status: getBookingStatus(booking.checkIn, booking.checkOut),
        checkIn: formatDateLocal(booking.checkIn), // Use helper function
        checkOut: formatDateLocal(booking.checkOut),
        paymentMethod: booking.paymentMethod,
        transactionId: booking.transactionId,
        hasReviewed: booking.hasReviewed || false,
      };
    });

    res.status(200).json({
      success: true,
      bookings: transformedBookings,
    });
  } catch (error) {
    console.error("Booking history error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addReview = async (req, res) => {
  try {
    const { bookingId, name, rating, comment } = req.body;

    // Find the booking by ID
    const booking = await Payment.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    console.log(booking.room);
    const id = booking.room.toString();
    // Find the room by ID
    console.log(bookingId, name, rating, comment, id);
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Create new review
    const newReview = { name, rating, comment };
    room.reviews.push(newReview); // Add review to the array
    await room.save(); // Save the room with the new review

    const updatedBooking = await Payment.findByIdAndUpdate(
      bookingId,
      { hasReviewed: true },
      { new: true }
    );
    console.log(updatedBooking.hasReviewed);

    res.status(201).json({ message: "Review added successfully", room });
  } catch (error) {
    res.status(500).json({ message: "Error adding review", error });
  }
};

// Helper function to format dates in local time
function formatDateLocal(date) {
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  changePassword,
  bookingHistory,
  addReview,
};
