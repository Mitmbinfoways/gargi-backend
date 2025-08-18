const express = require("express");
const router = express.Router();
const { createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog } = require("../controllers/Blog.controller");
const { authMiddleware } = require("../middleware/Auth.Middleware");
const Upload = require("../middleware/Multer.middleware");

router.post(
    "/", authMiddleware,
    Upload.any(),
    createBlog
);
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.put("/:id", authMiddleware, Upload.any(), updateBlog);
router.delete("/:id", authMiddleware, deleteBlog);

module.exports = router;
