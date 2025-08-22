const express = require("express");
const {
    createMaterial,
    getAllMaterials,
    getMaterialById,
    updateMaterial,
    deleteMaterial,
} = require("../controllers/Material.controller");
const { authMiddleware } = require("../middleware/Auth.Middleware");

const router = express.Router();

router.post("/", authMiddleware, createMaterial);
router.get("/", authMiddleware, getAllMaterials);
router.get("/:id", authMiddleware, getMaterialById);
router.put("/:id", authMiddleware, updateMaterial);
router.delete("/:id", authMiddleware, deleteMaterial);

module.exports = router;
