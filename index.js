const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/connection");
const AdminUserRoute = require("./routes/AdminUser.route");
const ProductRoute = require("./routes/Product.route");
const BlogRoutes = require("./routes/Blog.route");
// const ComboRoute = require("./routes/Combo.route");

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/admin", AdminUserRoute);
app.use("/api/v1/products", ProductRoute);
app.use("/api/v1/blogs", BlogRoutes);
// app.use("/api/v1/combo", ComboRoute);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running at ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};
startServer();
