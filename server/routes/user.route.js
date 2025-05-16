const express = require("express");
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  changePassword,
  bookingHistory,
  addReview,
} = require("../controllers/user.controller.js");
const { authMiddleware } = require("../middleware/authMiddleware");

console.log("hello");
router.get("/", getUsers);
// router.get("/:id", getProduct);

router.post("/", createUser);

// update a product
router.patch("/:id", authMiddleware, updateUser);

router.patch("/password/:id", authMiddleware, changePassword);

router.get("/booking/:id", bookingHistory);

router.post("/review", authMiddleware, addReview);

// update a product
// router.put("/:id", updateProduct);

// delete a product
// router.delete("/:id", deleteProduct);

module.exports = router;
