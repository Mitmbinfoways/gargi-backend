const express = require("express");
const router = express.Router();
const { createBlog,
    getAllBlogs,
    getBlogById,
    updateBlog,
    deleteBlog } = require("../controllers/Blog.controller");
const { authMiddleware } = require("../middleware/Auth.Middleware");
const Upload = require("../middleware/Multer.middleware");

// todo add auth 
router.post(
    "/",
    Upload.any(),
    createBlog
);
router.get("/", getAllBlogs);
router.get("/:id", getBlogById);
router.put("/:id", Upload.any(), updateBlog);
router.delete("/:id", deleteBlog);

module.exports = router;
