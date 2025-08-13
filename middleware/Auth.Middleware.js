const jwt = require("jsonwebtoken");
const User = require("../models/AdminUser.model");
const ApiError = require("../utils/ApiError");
const authMiddleware = async (req, res, next) => {
  try {
    let token;
    token = req.headers.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId).select("-password");
        next();
      } catch (error) {
        res
          .status(401)
          .json(new ApiError(401, "Unauthorized! - Invalid Token!"));
      }
    } else {
      res.status(401).json(new ApiError(401, "No Token! Unauthorized!"));
    }
  } catch (error) {
    console.error(
      "ERROR in TOKEN AUTHENTICATION (auth Middleware)-- ",
      error.message
    );
    res.status(401).json(new ApiError(401, "Token authentication problem!"));
  }
};

module.exports = { authMiddleware };
