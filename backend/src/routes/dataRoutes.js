const express = require("express");
const { getDataOverview } = require("../controllers/dataController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/overview", protect, getDataOverview);

module.exports = router;
