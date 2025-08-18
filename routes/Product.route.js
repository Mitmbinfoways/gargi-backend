const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getHomeScreenProducts,
  homeScreenCount,
} = require("../controllers/Product.controller");
const { authMiddleware } = require("../middleware/Auth.Middleware");
const Upload = require("../middleware/Multer.middleware");

router.post("/", authMiddleware, Upload.array("images"), createProduct);
router.get("/home", getHomeScreenProducts);
router.get("/", getAllProducts);
router.get("/:id", getProductById);
router.put("/:id", authMiddleware, Upload.array("images"), updateProduct);
router.get("/dashboard/counts", authMiddleware, homeScreenCount);
router.delete("/:id", authMiddleware, deleteProduct);

module.exports = router;
