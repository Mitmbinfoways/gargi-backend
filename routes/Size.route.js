const express = require("express");
const {
    createSize,
    getAllSizes,
    getSizeById,
    updateSize,
    deleteSize,
} = require("../controllers/Size.controller");

const router = express.Router();

router.post("/", createSize);
router.get("/", getAllSizes);
router.get("/:id", getSizeById);
router.put("/:id", updateSize);
router.delete("/:id", deleteSize);

module.exports = router;
