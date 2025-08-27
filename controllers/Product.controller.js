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
      // pricePerPack,
      description,
      isActive,
    } = req.body;

    if (!name || !category || !material) {
      if (req.files?.length > 0) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }
      return res
        .status(400)
        .json(
          new ApiError(
            400,
            "Name, Category, Material and Quantity are Required"
          )
        );
    }

    const existingProduct = await ProductModel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      category,
      material,
    });

    if (existingProduct) {
      if (req.files?.length > 0) {
        req.files.forEach((file) => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      }

      return res
        .status(409)
        .json(
          new ApiError(
            409,
            "Product with this name, category, and material already exists"
          )
        );
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
      name: name.trim(),
      category,
      material,
      size,
      quantityPerPack: quantityPerPack ?? 0,
      // pricePerPack,
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
    const products = await ProductModel.find().sort({ createdAt: -1 }).limit(8);

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
    const { category, name, material, isActive, page, limit } = req.query;
    let filter = {};

    if (category) filter.category = category;
    if (material) filter.material = material;
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (name) filter.name = { $regex: name, $options: "i" };

    let products;
    let totalProducts = await ProductModel.countDocuments(filter);

    if (limit) {
      // Pagination when limit is provided
      const pageNumber = Number(page) || 1;
      const pageSize = Number(limit);
      const skip = (pageNumber - 1) * pageSize;

      products = await ProductModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize);

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            products,
            pagination: {
              total: totalProducts,
              page: pageNumber,
              limit: pageSize,
              totalPages: Math.ceil(totalProducts / pageSize),
            },
          },
          "Products fetched successfully"
        )
      );
    } else {
      // If no limit → fetch all products without pagination
      products = await ProductModel.find(filter).sort({ createdAt: -1 });

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            products,
            pagination: {
              total: totalProducts,
              page: 1,
              limit: totalProducts,
              totalPages: 1,
            },
          },
          "Products fetched successfully"
        )
      );
    }
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

    const {
      name,
      category,
      material,
      size,
      quantityPerPack,
      description,
      isActive,
    } = req.body;

    const bodyKeys = Object.keys(req.body);
    const isOnlyIsActive =
      bodyKeys.length === 1 && bodyKeys.includes("isActive");

    if (isOnlyIsActive) {
      product.isActive =
        isActive === "true" || isActive === true ? true : false;

      const updatedProduct = await product.save();
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            updatedProduct,
            "Product status updated successfully"
          )
        );
    }

    if (name || category || material) {
      const duplicateProduct = await ProductModel.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${(name || product.name).trim()}$`, "i") },
        category: category || product.category,
        material: material || product.material,
      });

      if (duplicateProduct) {
        if (req.files?.length > 0) {
          req.files.forEach((file) => {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
          });
        }
        return res
          .status(409)
          .json(
            new ApiError(
              409,
              "A product with this name, category, and material already exists"
            )
          );
      }
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

    product.name = name ?? product.name;
    product.category = category ?? product.category;
    product.material = material ?? product.material;
    product.size = size ?? product.size;
    product.quantityPerPack = quantityPerPack ?? product.quantityPerPack;
    product.description = description ?? product.description;
    product.isActive =
      isActive !== undefined
        ? isActive === "true" || isActive === true
        : product.isActive;
    product.image = [...existingImages, ...newImageUrls];

    const updatedProduct = await product.save();
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedProduct, "Product updated successfully")
      );
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
          categories: [
            {
              $unionWith: {
                coll: "categories",
                pipeline: [{ $count: "total" }],
              },
            },
          ],
          materials: [
            {
              $unionWith: {
                coll: "materials",
                pipeline: [{ $count: "total" }],
              },
            },
          ],
        },
      },
      {
        $project: {
          products: { $ifNull: [{ $arrayElemAt: ["$products.total", 0] }, 0] },
          categories: {
            $ifNull: [{ $arrayElemAt: ["$categories.total", 0] }, 0],
          },
          materials: {
            $ifNull: [{ $arrayElemAt: ["$materials.total", 0] }, 0],
          },
        },
      },
    ]);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          counts[0] || { products: 0, blogs: 0, categories: 0, materials: 0 },
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
