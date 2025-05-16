const express = require("express");
const mongoose = require("mongoose");
const userRoute = require("./routes/user.route.js");
const facilityRoute = require("./routes/facility.route.js");
const roomRoute = require("./routes/room.route.js");
const paymentRoute = require("./routes/payment.route.js");
const roomCleaningRoutes = require("./routes/roomCleaning.route.js");
const attractionRoute = require("./routes/attraction.route.js");
const homepageRoute = require("./routes/homepage.route.js");
const initializeSettings = require("./middleware/initializeSettings.js");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/users", userRoute);
app.use("/api/facilities", facilityRoute);
app.use("/api/rooms", roomRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/cleaning", roomCleaningRoutes);
app.use("/api/attractions", attractionRoute);
app.use("/api/homepage", homepageRoute);

app.get("/", (req, res) => {
  res.send("Hello from Node API Server Updated");
});

const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.DB_URL)
  .then(() => {
    console.log("Connected to database!");
    initializeSettings();
  })
  .catch((error) => {
    console.log("Connection failed!", error);
  });
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
