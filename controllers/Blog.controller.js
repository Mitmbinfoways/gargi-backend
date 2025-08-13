const Blog = require("../models/Blog.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { uploadToCloudinary } = require("../utils/Cloudinary.utils")
const fs = require('fs')

const cleanupFiles = (files) => {
  if (files?.length > 0) {
    files.forEach((file) => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
  }
};

const createBlog = async (req, res) => {
  try {
    const { title, description, content, isActive } = req.body;

    if (!title || !description) {
      cleanupFiles(req.files);
      return res.status(400).json(new ApiError(400, "Title & description are required"));
    }

    // Parse content JSON safely
    let parsedContent = [];
    if (content) {
      try {
        parsedContent = typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        cleanupFiles(req.files);
        return res.status(400).json(new ApiError(400, "Invalid content format. Must be JSON."));
      }
    }

    if (!Array.isArray(parsedContent)) parsedContent = [];

    // Normalize parsedContent structure
    parsedContent = parsedContent.map(block => ({
      title: block?.title || "",
      description: block?.description || "",
      icon: typeof block?.icon === "string" ? block.icon : ""
    }));

    const filesArray = req.files || [];

    // Upload main images (fieldname: "images")
    const mainImages = filesArray.filter(f => f.fieldname === "images");
    const imageUrls = await Promise.all(
      mainImages.map(async (file) => {
        const cloudRes = await uploadToCloudinary(file.path, "Gargi_Blogs");
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return cloudRes.secure_url;
      })
    );

    // Upload icons for content blocks
    for (let i = 0; i < parsedContent.length; i++) {
      // Possible fieldnames for icon files, depending on how multipart form data is sent
      const iconFile = filesArray.find(f =>
        f.fieldname === `content[${i}][icon]` || f.fieldname === `content.${i}.icon`
      );
      if (iconFile) {
        const cloudRes = await uploadToCloudinary(iconFile.path, "Gargi_Blogs_Icons");
        if (fs.existsSync(iconFile.path)) fs.unlinkSync(iconFile.path);
        parsedContent[i].icon = cloudRes.secure_url;
      }
    }

    // Create blog document with isActive field (default to true if not provided)
    const blog = await Blog.create({
      title,
      description,
      images: imageUrls,
      content: parsedContent,
      isActive: typeof isActive === "boolean" ? isActive : true,
    });

    return res.status(201).json(new ApiResponse(201, blog, "Blog created successfully"));
  } catch (error) {
    console.error("CreateBlog Error:", error);
    cleanupFiles(req.files);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, blogs, "Fetched all blogs"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json(new ApiError(404, "Blog not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Fetched blog successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const updateBlog = async (req, res) => {
  try {
    const { title, description, content, isActive } = req.body;

    let parsedContent = [];
    if (content) {
      try {
        parsedContent = typeof content === "string" ? JSON.parse(content) : content;
      } catch {
        cleanupFiles(req.files);
        return res.status(400).json(new ApiError(400, "Invalid content format. Must be JSON."));
      }
    }
    if (!Array.isArray(parsedContent)) parsedContent = [];

    parsedContent = parsedContent.map(block => ({
      title: block?.title || "",
      description: block?.description || "",
      icon: typeof block?.icon === "string" ? block.icon : ""
    }));

    const filesArray = req.files || [];

    let imageUrls = [];
    const mainImages = filesArray.filter(f => f.fieldname === "images");
    if (mainImages.length) {
      imageUrls = await Promise.all(mainImages.map(async (file) => {
        const cloudRes = await uploadToCloudinary(file.path, "Gargi_Blogs");
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        return cloudRes.secure_url;
      }));
    }

    for (let i = 0; i < parsedContent.length; i++) {
      const iconFile = filesArray.find(f =>
        f.fieldname === `content[${i}][icon]` || f.fieldname === `content.${i}.icon`
      );
      if (iconFile) {
        const cloudRes = await uploadToCloudinary(iconFile.path, "Gargi_Blogs_Icons");
        if (fs.existsSync(iconFile.path)) fs.unlinkSync(iconFile.path);
        parsedContent[i].icon = cloudRes.secure_url;
      }
    }

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      cleanupFiles(req.files);
      return res.status(404).json(new ApiError(404, "Blog not found"));
    }

    const existingImages = blog.images || [];
    const updatedImages = [...existingImages, ...imageUrls];

    const updateData = {
      title,
      description,
      content: parsedContent,
      images: updatedImages,
    };

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(new ApiResponse(200, updatedBlog, "Blog updated successfully"));
  } catch (error) {
    console.error("UpdateBlog Error:", error);
    cleanupFiles(req.files);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json(new ApiError(404, "Blog not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, blog, "Blog deleted successfully"));
  } catch (error) {
    console.error(error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
};
