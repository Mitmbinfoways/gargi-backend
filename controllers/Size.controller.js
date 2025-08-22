const SizeModel = require("../models/Size.model.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

const createSize = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || name.trim() === "") {
            return res.status(400).json(new ApiError(400, "Size name is required"));
        }
        const trimmedName = name.trim();
        const existingSize = await SizeModel.findOne({
            name: { $regex: `^${trimmedName}$`, $options: "i" }
        });

        if (existingSize) {
            return res.status(409).json(new ApiError(409, "This Size already exists"));
        }

        const size = await SizeModel.create({ name: trimmedName });

        return res
            .status(201)
            .json(new ApiResponse(201, size, "Size created successfully"));
    } catch (error) {
        console.error("Create Size Error:", error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
};

const getAllSizes = async (req, res) => {
    try {
        const { search, isActive, page, limit } = req.query;
        let filter = {};
        if (search) {
            filter.name = { $regex: search, $options: "i" };
        }
        if (isActive === "true") {
            filter.isActive = true;
        } else if (isActive === "false") {
            filter.isActive = false;
        }
        const pageNumber = Number(page) || 1;
        const pageSize = Number(limit) || 10;
        const skip = (pageNumber - 1) * pageSize;
        const totalSizes = await SizeModel.countDocuments(filter);
        const sizes = await SizeModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    sizes,
                    pagination: {
                        total: totalSizes,
                        page: pageNumber,
                        limit: pageSize,
                        totalPages: Math.ceil(totalSizes / pageSize),
                    },
                },
                "Fetched all sizes successfully"
            )
        );
    } catch (error) {
        console.error("Get All Sizes Error:", error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
};

const getSizeById = async (req, res) => {
    try {
        const size = await SizeModel.findById(req.params.id);

        if (!size) {
            return res.status(404).json(new ApiError(404, "Size not found"));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, size, "Fetched size successfully"));
    } catch (error) {
        console.error("Get Size By ID Error:", error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
};

const updateSize = async (req, res) => {
    try {
        const { name, isActive } = req.body;

        const size = await SizeModel.findById(req.params.id);
        if (!size) {
            return res.status(404).json(new ApiError(404, "Size not found"));
        }

        // Check if name already exists for another size
        if (name && name.trim() !== "") {
            const nameExists = await SizeModel.findOne({
                name: name.trim(),
                _id: { $ne: req.params.id },
            });

            if (nameExists) {
                return res
                    .status(409)
                    .json(new ApiError(409, "Size name already exists"));
            }

            size.name = name.trim();
        }

        // Update active status if provided
        if (typeof isActive === "boolean") {
            size.isActive = isActive;
        }

        await size.save();

        return res
            .status(200)
            .json(new ApiResponse(200, size, "Size updated successfully"));
    } catch (error) {
        console.error("Update Size Error:", error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
};

const deleteSize = async (req, res) => {
    try {
        const size = await SizeModel.findById(req.params.id);

        if (!size) {
            return res.status(404).json(new ApiError(404, "Size not found"));
        }

        await size.deleteOne();

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Size deleted successfully"));
    } catch (error) {
        console.error("Delete Size Error:", error);
        return res.status(500).json(new ApiError(500, "Internal Server Error"));
    }
};

module.exports = {
    createSize,
    getAllSizes,
    getSizeById,
    updateSize,
    deleteSize,
}
