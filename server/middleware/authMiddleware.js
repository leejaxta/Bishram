const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  console.log("hello");
  // Get the token from the request headers
  const token = req.header("Authorization");

  // Check if the token exists
  if (!token) {
    return res
      .status(401)
      .json({ message: "Access Denied. No token provided." });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    req.user = decoded; // Attach user data to request object
    next(); // Proceed to the next middleware/controller
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = { authMiddleware };
