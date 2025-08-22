const MaterialModel = require("../models/Material.model.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

const createMaterial = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === "") {
            return res
                .status(400)
                .json(new ApiError(400, "Material name is required"));
        }
        const trimmedName = name.trim();
        const existingMaterial = await MaterialModel.findOne({
            name: { $regex: `^${trimmedName}$`, $options: "i" }
        });

        if (existingMaterial) {
            return res
                .status(409)
                .json(new ApiError(409, "Material already exists"));
        }

        const material = await MaterialModel.create({ name: trimmedName });
        return res
            .status(201)
            .json(new ApiResponse(201, material, "Material created successfully"));
    } catch (error) {
        console.error("Create Material Error:", error);
        return res
            .status(500)
            .json(new ApiError(500, "Internal Server Error"));
    }
};

const getAllMaterials = async (req, res) => {
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
        const materials = await MaterialModel.find(filter).sort({ createdAt: -1 });

        return res
            .status(200)
            .json(new ApiResponse(200, materials, "Fetched all materials successfully"));
    } catch (error) {
        console.error("Get All Materials Error:", error);
        return res
            .status(500)
            .json(new ApiError(500, "Internal Server Error"));
    }
};

const getMaterialById = async (req, res) => {
    try {
        const material = await MaterialModel.findById(req.params.id);

        if (!material) {
            return res
                .status(404)
                .json(new ApiError(404, "Material not found"));
        }

        return res
            .status(200)
            .json(new ApiResponse(200, material, "Fetched material successfully"));
    } catch (error) {
        console.error("Get Material By ID Error:", error);
        return res
            .status(500)
            .json(new ApiError(500, "Internal Server Error"));
    }
};

const updateMaterial = async (req, res) => {
    try {
        const { name, isActive } = req.body;

        const material = await MaterialModel.findById(req.params.id);
        if (!material) {
            return res
                .status(404)
                .json(new ApiError(404, "Material not found"));
        }

        if (name && name.trim() !== "") {
            const nameExists = await MaterialModel.findOne({
                name: name.trim(),
                _id: { $ne: req.params.id },
            });

            if (nameExists) {
                return res
                    .status(409)
                    .json(new ApiError(409, "Material name already exists"));
            }
            material.name = name.trim();
        }

        if (typeof isActive === "boolean") material.isActive = isActive;

        await material.save();

        return res
            .status(200)
            .json(new ApiResponse(200, material, "Material updated successfully"));
    } catch (error) {
        console.error("Update Material Error:", error);
        return res
            .status(500)
            .json(new ApiError(500, "Internal Server Error"));
    }
};

const deleteMaterial = async (req, res) => {
    try {
        const material = await MaterialModel.findById(req.params.id);

        if (!material) {
            return res
                .status(404)
                .json(new ApiError(404, "Material not found"));
        }

        await material.deleteOne();

        return res
            .status(200)
            .json(new ApiResponse(200, null, "Material deleted successfully"));
    } catch (error) {
        console.error("Delete Material Error:", error);
        return res
            .status(500)
            .json(new ApiError(500, "Internal Server Error"));
    }
};


module.exports = {
    createMaterial,
    getAllMaterials,
    getMaterialById,
    updateMaterial,
    deleteMaterial
}