const express = require("express");
const {
  AdminRegister,
  AdminLogin,
  UserProfile,
  UpdateProfile,
  logOutUser,
} = require("../controllers/AdminUser.controller");
const { authMiddleware } = require("../middleware/Auth.Middleware");
const AdminUserRoute = express.Router();

AdminUserRoute.post("/register", AdminRegister);
AdminUserRoute.post("/login", AdminLogin);
AdminUserRoute.post("/logout", authMiddleware, logOutUser);
AdminUserRoute.get("/profile/:id", authMiddleware, UserProfile);
AdminUserRoute.put("/profile", authMiddleware, UpdateProfile);
module.exports = AdminUserRoute;
