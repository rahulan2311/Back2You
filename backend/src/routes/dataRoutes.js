const express = require("express");
const { getDataOverview } = require("../controllers/dataController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/overview", protect, authorize("admin"), getDataOverview);

module.exports = router;
