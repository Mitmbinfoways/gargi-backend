const ProductModel = require("../models/Product.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const { uploadToCloudinary } = require("../utils/Cloudinary.utils");
const fs = require("fs");

const createProduct = async (req, res) => {
  try {
    const {
      name,
      category,
      material,
      size,
      quantityPerPack,
      pricePerPack,
      description,
      isActive,
    } = req.body;

    if (!name || !category || !material || !quantityPerPack || !pricePerPack) {
      if (req.files?.length > 0) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res
        .status(400)
        .json(new ApiError(400, "Required fields are missing"));
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const cloudinaryRes = await uploadToCloudinary(file.path, "Gargi");
        imageUrls.push(cloudinaryRes.secure_url);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const newProduct = await ProductModel.create({
      name,
      category,
      material,
      size,
      quantityPerPack,
      pricePerPack,
      description,
      isActive,
      image: imageUrls,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newProduct, "Product created successfully"));
  } catch (error) {
    console.error("CreateProduct Error:", error);
    if (req.files?.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const getHomeScreenProducts = async (req, res) => {
  try {
    const products = await ProductModel.find()
      .sort({ createdAt: -1 })
      .limit(10);

    return res
      .status(200)
      .json(
        new ApiResponse(200, products, "Latest home screen products fetched")
      );
  } catch (error) {
    console.error("GetHomeScreenProducts Error:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, name, material, isActive, page, limit } = req.query;
    
    console.log(isActive)
    let filter = {};

    if (category) filter.category = category;
    if (material) filter.material = material;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (name) filter.name = { $regex: name, $options: "i" };
    if (minPrice || maxPrice) {
      filter.pricePerPack = {};
      if (minPrice) filter.pricePerPack.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerPack.$lte = Number(maxPrice);
    }

    // Pagination setup
    const pageNumber = Number(page) || 1;
    const pageSize = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // If no filter is applied, filter remains empty, which fetches all products
    const totalProducts = await ProductModel.countDocuments(filter);
    const products = await ProductModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    return res.status(200).json(
      new ApiResponse(200, {
        products,
        pagination: {
          total: totalProducts,
          page: pageNumber,
          limit: pageSize,
          totalPages: Math.ceil(totalProducts / pageSize),
        },
      }, "Products fetched successfully")
    );
  } catch (error) {
    console.error("GetAllProducts Error:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json(new ApiError(404, "Product not found"));
    }

    return res
      .status(200)
      .json(new ApiResponse(200, product, "Product fetched"));
  } catch (error) {
    console.error("GetProductById Error:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);
    if (!product) {
      if (req.files?.length > 0) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res.status(404).json(new ApiError(404, "Product not found"));
    }

    let existingImages = [];
    if (req.body.existingImages) {
      if (typeof req.body.existingImages === "string") {
        existingImages = [req.body.existingImages];
      } else if (Array.isArray(req.body.existingImages)) {
        existingImages = req.body.existingImages;
      }
    }

    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await uploadToCloudinary(file.path, "Gargi");
        newImageUrls.push(uploaded.secure_url);
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const {
      name,
      category,
      material,
      size,
      quantityPerPack,
      pricePerPack,
      description,
      isActive,
    } = req.body;

    product.name = name ?? product.name;
    product.category = category ?? product.category;
    product.material = material ?? product.material;
    product.size = size ?? product.size;
    product.quantityPerPack = quantityPerPack ?? product.quantityPerPack;
    product.pricePerPack = pricePerPack ?? product.pricePerPack;
    product.description = description ?? product.description;
    product.isActive = isActive ?? product.isActive;

    product.image = [...existingImages, ...newImageUrls];

    const updatedProduct = await product.save();

    return res
      .status(200)
      .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
  } catch (error) {
    console.error("UpdateProduct Error:", error);
    if (req.files?.length > 0) {
      req.files.forEach((file) => {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ProductModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json(new ApiError(404, "Product not found"));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Product deleted successfully"));
  } catch (error) {
    console.error("DeleteProduct Error:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

const homeScreenCount = async (req, res) => {
  try {
    const counts = await ProductModel.aggregate([
      {
        $facet: {
          products: [{ $count: "total" }],
          blogs: [
            {
              $unionWith: {
                coll: "blogs", // collection name in MongoDB (lowercase plural of Blog model)
                pipeline: [{ $count: "total" }],
              },
            },
          ],
        },
      },
      {
        $project: {
          products: { $arrayElemAt: ["$products.total", 0] },
          blogs: { $arrayElemAt: ["$blogs.total", 0] },
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          counts[0] || { products: 0, blogs: 0 },
          "Home screen counts fetched"
        )
      );
  } catch (error) {
    console.error("HomeScreenCount Error:", error);
    return res.status(500).json(new ApiError(500, "Internal Server Error"));
  }
};

module.exports = {
  createProduct,
  getHomeScreenProducts,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  homeScreenCount,
};
