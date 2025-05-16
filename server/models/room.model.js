const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter user name"],
    },
    myImg: {
      type: [{ type: String }],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    booked_date: {
      type: [{ type: Date }],
      default: [],
    },
    basic_amenities: {
      type: [String],
      default: [],
    },
    room_specific_amenities: {
      type: [String],
      default: [],
    },
    accommodation: {
      type: Object,
      default: {
        Adults: Number,
        Kids: Number,
        Room: Number,
      },
    },
    reviews: {
      type: [
        {
          name: String,
          rating: Number,
          comment: String,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

const Room = mongoose.model("Room", RoomSchema);

module.exports = Room;
