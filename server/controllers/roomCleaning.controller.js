const RoomCleaning = require("../models/roomCleaning.model");
const Payment = require("../models/payment.model"); // Adjust based on your actual model name

// Request room cleaning
const requestCleaning = async (req, res) => {
  try {
    const { paymentId, scheduledDate, timeSlot, specialRequests } = req.body;
    const userId = req.user.id; // Assuming you have user in request from auth middleware

    // Validate payment exists and belongs to user
    const payment = await Payment.findOne({ _id: paymentId, user: userId });
    if (!payment) {
      return res
        .status(404)
        .json({ message: "Payment record not found or unauthorized" });
    }

    // Validate selected date is within stay period
    const selectedDate = new Date(scheduledDate);
    const checkIn = new Date(payment.checkIn);
    const checkOut = new Date(payment.checkOut);

    if (selectedDate < checkIn || selectedDate > checkOut) {
      return res.status(400).json({
        message: "Cleaning date must be within your stay period",
      });
    }

    // Create cleaning request
    const roomCleaning = new RoomCleaning({
      payment: paymentId,
      room: payment.room,
      user: userId,
      scheduledDate,
      timeSlot,
      specialRequests: specialRequests || "",
      status: "requested",
    });

    await roomCleaning.save();

    res.status(201).json({
      success: true,
      message: "Room cleaning requested successfully",
      data: roomCleaning,
    });
  } catch (error) {
    console.error("Error requesting room cleaning:", error);
    res.status(500).json({
      message: "Failed to request room cleaning",
      error: error.message,
    });
  }
};

// Get user's cleaning requests
const getUserCleaningRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const cleaningRequests = await RoomCleaning.find({ user: userId })
      .populate("payment", "transactionId checkIn checkOut")
      .populate("room", "name roomNumber")
      .sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      count: cleaningRequests.length,
      data: cleaningRequests,
    });
  } catch (error) {
    console.error("Error fetching cleaning requests:", error);
    res.status(500).json({
      message: "Failed to fetch cleaning requests",
      error: error.message,
    });
  }
};

// Get cleaning requests for a specific payment
const getPaymentCleaningRequests = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    const cleaningRequests = await RoomCleaning.find({
      payment: paymentId,
      user: userId,
    }).sort({ scheduledDate: 1 });

    res.status(200).json({
      success: true,
      count: cleaningRequests.length,
      data: cleaningRequests,
    });
  } catch (error) {
    console.error("Error fetching payment cleaning requests:", error);
    res.status(500).json({
      message: "Failed to fetch cleaning requests",
      error: error.message,
    });
  }
};

// Cancel cleaning request
const cancelCleaningRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const cleaningRequest = await RoomCleaning.findOne({
      _id: requestId,
      user: userId,
    });

    if (!cleaningRequest) {
      return res
        .status(404)
        .json({ message: "Cleaning request not found or unauthorized" });
    }

    // Only allow cancellation if it's still in requested status
    if (cleaningRequest.status !== "requested") {
      return res.status(400).json({
        message: "Cannot cancel confirmed or completed cleaning requests",
      });
    }

    cleaningRequest.status = "cancelled";
    await cleaningRequest.save();

    res.status(200).json({
      success: true,
      message: "Cleaning request cancelled successfully",
      data: cleaningRequest,
    });
  } catch (error) {
    console.error("Error cancelling cleaning request:", error);
    res.status(500).json({
      message: "Failed to cancel cleaning request",
      error: error.message,
    });
  }
};

// For admin: Get all cleaning requests
const getAllCleaningRequests = async (req, res) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Allow filtering by status
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const cleaningRequests = await RoomCleaning.find(filter)
      .populate("payment", "transactionId checkIn checkOut")
      .populate("room", "name roomNumber")
      .populate("user", "name email")
      .sort({ scheduledDate: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await RoomCleaning.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: cleaningRequests.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
      data: cleaningRequests,
    });
  } catch (error) {
    console.error("Error fetching all cleaning requests:", error);
    res.status(500).json({
      message: "Failed to fetch cleaning requests",
      error: error.message,
    });
  }
};

// For admin: Update cleaning request status
const updateCleaningStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, staffAssigned } = req.body;

    const cleaningRequest = await RoomCleaning.findById(requestId);

    if (!cleaningRequest) {
      return res.status(404).json({ message: "Cleaning request not found" });
    }

    // Update status
    cleaningRequest.status = status;

    // If status is completed, set completedAt
    if (status === "completed") {
      cleaningRequest.completedAt = new Date();
    }

    // If staff is assigned
    if (staffAssigned) {
      cleaningRequest.staffAssigned = staffAssigned;
    }

    await cleaningRequest.save();

    res.status(200).json({
      success: true,
      message: "Cleaning request updated successfully",
      data: cleaningRequest,
    });
  } catch (error) {
    console.error("Error updating cleaning request:", error);
    res.status(500).json({
      message: "Failed to update cleaning request",
      error: error.message,
    });
  }
};
module.exports = {
  requestCleaning,
  getUserCleaningRequests,
  getPaymentCleaningRequests,
  cancelCleaningRequest,
  getAllCleaningRequests,
  updateCleaningStatus,
};
