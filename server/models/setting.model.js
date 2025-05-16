// models/Setting.js
const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema({
  // Homestay coordinates
  homestayCoords: {
    type: [Number], // [latitude, longitude]
    required: true,
    validate: {
      validator: function (v) {
        return (
          v.length === 2 &&
          v[0] >= -90 &&
          v[0] <= 90 &&
          v[1] >= -180 &&
          v[1] <= 180
        );
      },
      message: (props) => `${props.value} is not a valid coordinate pair!`,
    },
    default: [27.675864552066322, 85.32510050761249], // Default coordinates for your homestay
  },

  // You can add other global settings here as needed
  // For example:
  // siteTitle: { type: String, default: "My Homestay" },
  // contactEmail: { type: String, default: "contact@homestay.com" },
  // bookingEnabled: { type: Boolean, default: true },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
settingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure there's only one settings document
settingSchema.statics.getSingleton = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const Setting = mongoose.model("Setting", settingSchema);

module.exports = Setting;
