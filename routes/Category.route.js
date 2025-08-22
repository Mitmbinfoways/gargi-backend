const express = require("express");
const router = express.Router();
const {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory,
} = require("../controllers/Category.controller");
const { authMiddleware } = require("../middleware/Auth.Middleware");

router.post("/", authMiddleware, createCategory);
router.get("/", authMiddleware, getAllCategories);
router.put("/:id", authMiddleware, updateCategory);
router.delete("/:id", authMiddleware, deleteCategory);

module.exports = router;
