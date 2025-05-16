const mongoose = require("mongoose");

const FacilitySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter user name"],
    },

    myImg: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Facility = mongoose.model("Facility", FacilitySchema);

module.exports = Facility;
