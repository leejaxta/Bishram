// models/Attraction.js
const mongoose = require("mongoose");

const attractionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  distance: {
    type: String,
    required: true,
  },
  travelTime: {
    type: String,
    required: true,
  },
  coords: {
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
  },
});

const Attraction = mongoose.model("Attraction", attractionSchema);

module.exports = Attraction;
