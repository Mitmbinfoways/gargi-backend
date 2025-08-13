const jwt = require("jsonwebtoken");
const ApiError = require("./ApiError");

const generateToken = (res, userId) => {
  if (!process.env.JWT_SECRET || !process.env.CORS_ORIGIN) {
    return res
      .status(404)
      .json(new ApiError(404, "Missing environment variables"));
  }
  try {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRESIN,
    });
    return token;
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(401).json(new ApiError(401, "Error generating token"));
  }
};

module.exports = { generateToken };
