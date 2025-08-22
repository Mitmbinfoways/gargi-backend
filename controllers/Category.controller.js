const CategoryModel = require("../models/Category.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const createCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res.status(400).json(new ApiError(400, "Category name is required"));
        }
        const trimmedName = name.trim();
        const existingCategory = await CategoryModel.findOne({
            name: { $regex: `^${trimmedName}$`, $options: "i" }
        });

        if (existingCategory) {
            return res.status(409).json(new ApiError(409, "Category already exists"));
        }
        const category = await CategoryModel.create({ name: trimmedName });
        return res
            .status(201)
            .json(new ApiResponse(201, category, "Category created successfully"));
    } catch (error) {
        console.error("Create Category Error:", error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
};


const getAllCategories = async (req, res) => {
    try {
        const { search, isActive } = req.query;
        let filter = {};
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }
        if (isActive === "true") {
            filter.isActive = true;
        } else if (isActive === "false") {
            filter.isActive = false;
        }
        const categories = await CategoryModel.find(filter).sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, categories, "Fetched categories successfully"));
    } catch (error) {
        console.error("Get All Categories Error:", error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
};

const getCategoryById = async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id);

        if (!category) {
            return res.status(404).json(new ApiError(404, "Category not found"));
        }

        res.status(200).json(new ApiResponse(200, category, "get CategoryById"));
    } catch (error) {
        console.error("Get Category By ID Error:", error);
        res.status(500).json(new ApiError(500, "Intenal Server Error"));
    }
};

const updateCategory = async (req, res) => {
    try {
        const { name, isActive } = req.body;

        const category = await CategoryModel.findById(req.params.id);
        if (!category) {
            return res.status(404).json(new ApiError(404, "Cateogry not Found"));
        }

        if (name) category.name = name.trim();
        if (typeof isActive === "boolean") category.isActive = isActive;

        await category.save();

        res.status(200).json(new ApiError(200, category, "Category updated successfully"));
    } catch (error) {
        console.error("Update Category Error:", error);
        res.status(500).json(new ApiError(500, "Intenal Server Error"));
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await CategoryModel.findById(req.params.id);

        if (!category) {
            return res.status(404).json(new ApiError(404, "Category not found"));
        }

        await category.deleteOne();

        res.status(200).json(new ApiResponse(200, null, "Category deleted successfully"));
    } catch (error) {
        console.error("Delete Category Error:", error);
        res.status(500).json(new ApiError(500, "Intenal Server Error"));
    }
};

module.exports = {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
};