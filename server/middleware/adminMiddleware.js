const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ message: "Access Denied. Admins only." });
  }
  next(); // Proceed to the next handler
};

module.exports = { adminMiddleware };
