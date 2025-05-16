const Payment = require("../models/payment.model");
const Room = require("../models/room.model");
const User = require("../models/user.model");
const { getDatesBetween } = require("../utils/dateUtils.js");
// Backend route (Node.js example using pdfkit)
const PDFDocument = require("pdfkit");
// import fs from "fs";

const verifyPayment = async (req, res) => {
  try {
    // 1. Get authenticated user from middleware
    const userId = req.user.id;

    // 2. Validate required fields
    const {
      transactionId,
      transaction_uuid,
      roomId,
      checkIn,
      checkOut,
      adults,
      children,
      totalAmount,
      eSewaData,
    } = req.body;

    if (!transactionId || !roomId || !checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (transactionId, roomId, checkIn, checkOut)",
      });
    }

    // 3. Check for duplicate payment first
    const existingPayment = await Payment.findOne({ transactionId });
    if (existingPayment) {
      return res.status(200).json({
        success: true,
        payment: existingPayment,
        message: "Payment was already processed",
        isDuplicate: true,
      });
    }

    // 4. Verify room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    // 5. Check date availability (simplified comparison)
    const bookedDates = getDatesBetween(new Date(checkIn), new Date(checkOut));

    // Convert all dates to comparable format (YYYY-MM-DD)
    const existingDates = room.booked_date.map(
      (date) => new Date(date).toISOString().split("T")[0]
    );

    console.log(bookedDates);

    const conflictingDates = bookedDates.filter((bookedDate) => {
      const bookedDateStr = new Date(bookedDate).toISOString();
      return existingDates.includes(bookedDateStr);
    });

    if (conflictingDates.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Room not available for selected dates",
        conflictingDates,
      });
    }

    // 6. Create payment record
    const payment = await Payment.create({
      transactionId,
      transaction_uuid,
      room: roomId,
      user: userId,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      adults: parseInt(adults),
      children: parseInt(children),
      totalAmount: parseFloat(totalAmount),
      status: "completed",
      paymentMethod: "esewa",
      eSewaData,
    });

    // 7. Update room availability
    room.booked_date.push(...bookedDates);
    await room.save();

    // 8. Send response
    res.status(201).json({
      success: true,
      payment: {
        _id: payment._id,
        transactionId: payment.transactionId,
        room: payment.room,
        checkIn: payment.checkIn,
        checkOut: payment.checkOut,
        totalAmount: payment.totalAmount,
        status: payment.status,
      },
      room: {
        _id: room._id,
        name: room.name,
      },
      isDuplicate: false,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    if (error.code === 11000) {
      const existingPayment = await Payment.findOne({
        transactionId: error.keyValue.transactionId,
      });
      return res.status(200).json({
        success: true,
        payment: existingPayment,
        message: "Payment was already processed",
        isDuplicate: true,
      });
    }

    res.status(500).json({
      success: false,
      message: "Payment processing failed",
      error: error.message,
    });
  }
};

const bookingcount = async (req, res) => {
  try {
    // Calculate date range (last 7 days including today)
    const endDate = new Date(); // Today
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // 6 days before today

    // Query documents within the date range and format the response
    const bookings = await Payment.find({
      status: "completed",
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .select("createdAt -_id") // Only include createdAt field, exclude _id
      .lean() // Convert to plain JavaScript objects
      .then((docs) =>
        docs.map((doc) => ({
          created_at: doc.createdAt.toISOString(), // Format as ISO string with created_at field
        }))
      );

    res.status(200).json({ demoBookings: bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCurrentStays = async (req, res) => {
  try {
    const now = new Date();

    // Get your timezone offset in milliseconds (negative if you're ahead of UTC)
    const timezoneOffset = now.getTimezoneOffset() * 60 * 1000;

    const today = new Date(now.setHours(0, 0, 0, 0) - timezoneOffset);

    // End of local day in UTC
    const endOfToday = new Date(now.setHours(23, 59, 59, 999) - timezoneOffset);

    // 1. Find payments where:
    //    - checkIn is today OR
    //    - today is between checkIn (inclusive) and checkOut (exclusive)
    //    - Include 'completed' status if needed
    const payments = await Payment.aggregate([
      {
        $match: {
          $or: [
            {
              checkIn: {
                $gte: today,
                $lte: endOfToday,
              },
            },
            {
              $and: [
                { checkIn: { $lte: today } },
                { checkOut: { $gt: today } },
              ],
            },
          ],
          status: { $in: ["confirmed", "ongoing", "completed"] }, // Added 'completed'
        },
      },
      {
        $lookup: {
          from: "rooms", // Verify this matches your actual collection name
          localField: "room",
          foreignField: "_id",
          as: "roomDetails",
        },
      },
      { $unwind: "$roomDetails" },
      {
        $lookup: {
          from: "users", // Verify this matches your actual collection name
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          _id: 0,
          checkIn: 1,
          checkOut: 1,
          room: {
            myImg: "$roomDetails.myImg",
            name: "$roomDetails.name",
          },
          user: {
            name: "$userDetails.name",
            email: "$userDetails.email",
            address: "$userDetails.address",
            number: "$userDetails.number",
          },
        },
      },
    ]);

    res.status(200).json(payments);
  } catch (error) {
    console.error("Error fetching current stays:", error);
    res.status(500).json({ error: "Failed to fetch current stays" });
  }
};

const generateInvoice = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      transactionId: req.params.transactionId,
    });
    if (!payment) return res.status(404).send("Invoice not found");

    const user = await User.findById(payment.user);
    if (!user) return res.status(404).send("User not found");

    // Calculate stay duration in days
    const checkIn = new Date(payment.checkIn);
    const checkOut = new Date(payment.checkOut);
    const stayDuration = Math.ceil(
      (checkOut - checkIn) / (1000 * 60 * 60 * 24)
    );

    // Calculate cost per night (assuming totalAmount includes all charges)
    const costPerNight = payment.totalAmount / stayDuration;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${payment.transactionId}.pdf`
    );

    doc.pipe(res);

    // --- HEADER SECTION ---
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("BISHRAM STAY", { align: "left" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("Jhatapole, Lalitpur", { align: "left" });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("info@bishramstay.com | +977-01-1234567", { align: "left" });

    // --- HORIZONTAL LAYOUT SECTION ---
    doc.moveDown(2);

    // Define column positions
    const leftCol = 50;
    const middleCol = 250;
    const rightCol = 400;
    const currentY = doc.y;

    // --- BILLED TO (Left Column) ---
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("BILLED TO:", leftCol, currentY);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(user.name, leftCol, currentY + 20)
      .text(user.email, leftCol, currentY + 35)
      .text(user.address || "", leftCol, currentY + 50)
      .text(user.number || "", leftCol, currentY + 65);

    // --- HOMESTAY INFO (Middle Column) ---
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("BOOKING DETAILS:", middleCol, currentY);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Check-in: ${checkIn.toLocaleDateString()}`,
        middleCol,
        currentY + 20
      )
      .text(
        `Check-out: ${checkOut.toLocaleDateString()}`,
        middleCol,
        currentY + 35
      )
      .text(
        `Guests: ${payment.adults} adult${payment.adults > 1 ? "s" : ""}, ${
          payment.children
        } child${payment.children !== 1 ? "ren" : ""}`,
        middleCol,
        currentY + 50
      );

    // --- INVOICE DETAILS (Right Column) ---
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("INVOICE", rightCol, currentY, { align: "right" });
    doc.fontSize(10).font("Helvetica");
    doc.text(
      `Invoice #: INV-${payment.transactionId}`,
      rightCol,
      currentY + 20,
      { align: "right" }
    );
    doc.text(
      `Transaction ID: ${payment.transactionId}`,
      rightCol,
      currentY + 35,
      { align: "right" }
    );
    doc.text(`Date: ${currentDate}`, rightCol, currentY + 50, {
      align: "right",
    });
    doc.text(`Status: ${payment.status || "PAID"}`, rightCol, currentY + 65, {
      align: "right",
    });

    // Set new Y position after the horizontal section
    doc.y = currentY + 85;

    // --- PAYMENT DETAILS ---
    doc.fontSize(10).font("Helvetica-Bold").text("PAYMENT METHOD:");
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(payment.paymentMethod.toUpperCase());

    // --- TABLE HEADER ---
    doc.moveDown(2);

    // Draw table headers
    const tableTop = doc.y;
    const tableLeft = 50;
    const colWidths = [240, 75, 75, 100];

    // Draw table header background
    doc.rect(tableLeft, tableTop, 490, 20).fill("#f0f0f0");

    // Draw table headers
    doc.fillColor("#000000");
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Description", tableLeft + 10, tableTop + 5);
    doc.text("Unit Price", tableLeft + colWidths[0] + 10, tableTop + 5);
    doc.text(
      "Quantity",
      tableLeft + colWidths[0] + colWidths[1] + 10,
      tableTop + 5
    );
    doc.text(
      "Amount",
      tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10,
      tableTop + 5
    );

    // --- TABLE CONTENT ---
    let y = tableTop + 20;

    // Room charge row
    doc.fontSize(10).font("Helvetica");
    doc.text("Room Accommodation", tableLeft + 10, y + 5);
    doc.text(
      `NPR ${costPerNight.toLocaleString()}`,
      tableLeft + colWidths[0] + 10,
      y + 5
    );
    doc.text(
      `${stayDuration}`,
      tableLeft + colWidths[0] + colWidths[1] + 10,
      y + 5
    );
    doc.text(
      `NPR ${payment.totalAmount.toLocaleString()}`,
      tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10,
      y + 5
    );

    // Draw row line
    y += 25;
    doc
      .moveTo(tableLeft, y)
      .lineTo(tableLeft + 490, y)
      .stroke();

    // Additional services could be added here
    if (payment.additionalServices && payment.additionalServices.length > 0) {
      payment.additionalServices.forEach((service) => {
        y += 25;
        doc.text(service.name, tableLeft + 10, y + 5);
        doc.text(
          `NPR ${service.price.toLocaleString()}`,
          tableLeft + colWidths[0] + 10,
          y + 5
        );
        doc.text(
          `${service.quantity}`,
          tableLeft + colWidths[0] + colWidths[1] + 10,
          y + 5
        );
        doc.text(
          `NPR ${(service.price * service.quantity).toLocaleString()}`,
          tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10,
          y + 5
        );

        // Draw row line
        y += 25;
        doc
          .moveTo(tableLeft, y)
          .lineTo(tableLeft + 490, y)
          .stroke();
      });
    }

    // --- SUMMARY SECTION ---
    const summaryY = y + 15;

    // Subtotal (same as total for this simple case)
    doc.text(
      "Subtotal",
      tableLeft + colWidths[0] + colWidths[1] + 10,
      summaryY
    );
    doc.text(
      `NPR ${payment.totalAmount.toLocaleString()}`,
      tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10,
      summaryY
    );

    // Tax (if applicable)
    if (payment.tax) {
      doc.text(
        "Tax",
        tableLeft + colWidths[0] + colWidths[1] + 10,
        summaryY + 20
      );
      doc.text(
        `NPR ${payment.tax.toLocaleString()}`,
        tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10,
        summaryY + 20
      );
    }

    // Total with bold formatting
    doc.font("Helvetica-Bold");
    doc.text(
      "TOTAL",
      tableLeft + colWidths[0] + colWidths[1] + 10,
      summaryY + 40
    );
    doc.text(
      `NPR ${payment.totalAmount.toLocaleString()}`,
      tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + 10,
      summaryY + 40
    );

    // --- FOOTER ---
    doc.moveDown(4);

    // Add a light gray background for the footer section
    const footerTop = doc.y;
    doc.rect(50, footerTop, 490, 80).fill("#f9f9f9");

    // Thank you message
    doc.fillColor("#000000");
    doc.fontSize(10).font("Helvetica");
    doc.text("Thank you for choosing Bishram Stay!", 50, footerTop + 15, {
      align: "center",
      width: 490,
    });

    // Terms and conditions
    doc.moveDown(1);
    doc.fontSize(8).font("Helvetica-Bold");
    doc.text("TERMS & CONDITIONS", 50, footerTop + 35, {
      align: "center",
      width: 490,
    });
    doc.fontSize(8).font("Helvetica");
    doc.text(
      "1. This is an electronically generated invoice and does not require a signature.",
      50,
      footerTop + 45,
      { align: "center", width: 490 }
    );
    doc.text(
      "2. For any queries regarding this invoice, please contact info@bishramstay.com",
      50,
      footerTop + 55,
      { align: "center", width: 490 }
    );

    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Error generating invoice");
  }
};

const getPayments = async (req, res) => {
  try {
    const payments = await Payment.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $lookup: {
          from: "rooms",
          localField: "room",
          foreignField: "_id",
          as: "room",
        },
      },
      { $unwind: "$room" },
      {
        $project: {
          // Include all payment fields
          transaction_uuid: 1,
          transactionId: 1,
          checkIn: 1,
          checkOut: 1,
          adults: 1,
          children: 1,
          paymentMethod: 1,
          // Add user fields
          userName: "$user.name",
          userEmail: "$user.email",
          userAddress: "$user.address",
          userNumber: "$user.number",
          // Add room field
          roomName: "$room.name",
          // Include other payment fields as needed
          createdAt: 1,
          status: 1,
          totalAmount: 1,
        },
      },
    ]);

    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  verifyPayment,
  bookingcount,
  getCurrentStays,
  generateInvoice,
  getPayments,
};
