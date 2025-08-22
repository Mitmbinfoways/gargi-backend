const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AdminModel = require("../models/AdminUser.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { generateToken } = require("../utils/generateToken");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRESIN = process.env.JWT_EXPIRESIN;

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const AdminRegister = async (req, res) => {
  try {
    const { name, password, avatar, email } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json(new ApiError(400, "Provide required data"));
    }

    const existing = await AdminModel.findOne({ email });

    if (existing) {
      return res
        .status(409)
        .json(new ApiError(409, "Admin user already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await AdminModel.create({
      name,
      email,
      password: hashedPassword,
      avatar,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, { newAdmin }, "Admin registered successfully")
      );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const AdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(new ApiError(400, "email and password is required data"));
    }

    const admin = await AdminModel.findOne({ email }).lean();
    if (!admin) {
      return res.status(404).json(new ApiError(404, "Invalid credentials"));
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json(new ApiError(401, "Invalid credentials"));
    }

    const token = generateToken(res, admin._id);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          token,
          admin: {
            _id: admin._id,
            name: admin.name,
            avatar: admin.avatar,
            email: admin.email,
            createdAt: admin.createdAt,
            updatedAt: admin.updatedAt,
          },
        },
        "Login successful"
      )
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const SendContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    if (!firstName || !lastName || !email || !message) {
      return res.status(400).json(new ApiError(400, "All required fields must be filled"));
    }

    const fullName = `${firstName} ${lastName}`;

    const htmlContent = `
      <h2>New Contact</h2>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "N/A"}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `;

    // send mail to admin (your email)
    await sendMail(
      process.env.ADMIN_EMAIL, // set your admin email in .env
      "New Contact Form Submission",
      htmlContent
    );

    return res.status(200).json(new ApiResponse(200, null, "Message sent successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const ForgotPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json(new ApiError(400, "Email and new password are required"));
    }

    const admin = await AdminModel.findOne({ email });
    if (!admin) {
      return res.status(404).json(new ApiError(404, "Admin not found"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;

    await admin.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Password reset successfully"));
  } catch (error) {
    console.error("ForgotPassword Error:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const UserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json(new ApiError(400, "User ID is required"));
    }
    const user = await AdminModel.findById(id);
    if (!user) {
      return res.status(404).json(new ApiError(404, "User not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, user, "User profile fetched successfully"));
  } catch (error) {
    console.error("UserProfile Error:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const UpdateProfile = async (req, res) => {
  try {
    const id = req.user._id;
    const { email, name, avatar, oldPassword, newPassword } = req.body;

    const admin = await AdminModel.findById(id);
    if (!admin) {
      return res.status(404).json(new ApiError(404, "Admin not found"));
    }

    if (name) admin.name = name;
    if (email) admin.email = email;
    if (avatar) admin.avatar = avatar;

    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, admin.password);
      if (!isMatch) {
        return res
          .status(401)
          .json(
            new ApiError(
              401,
              "Old password is incorrect Please enter correct password"
            )
          );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      admin.password = hashedPassword;
    } else if (oldPassword || newPassword) {
      return res
        .status(400)
        .json(
          new ApiError(
            400,
            "Both old and new passwords are required to change password"
          )
        );
    }

    await admin.save();

    return res
      .status(200)
      .json(new ApiResponse(200, admin, "Profile updated successfully"));
  } catch (error) {
    console.error("UpdateProfile Error:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const logOutUser = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      expires: new Date(0),
    });
    res.status(200).json(new ApiResponse(200, {}, "User Logged out"));
  } catch (err) {
    console.error("Error in logout ::", err.message);
    res.status(500).json(new ApiError(500, "Logout failed!"));
  }
};

module.exports = {
  AdminLogin,
  AdminRegister,
  SendContactForm,
  ForgotPassword,
  UpdateProfile,
  logOutUser,
  UserProfile,
};
