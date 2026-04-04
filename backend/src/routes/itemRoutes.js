const express = require("express");
const {
  createLostItem,
  createFoundItem,
  getItemStatus,
  searchItems,
  getMyItems,
  getDashboardSummary,
  updateItemStatus
} = require("../controllers/itemController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/search", searchItems);
router.get("/status/:trackingCode", getItemStatus);
router.get("/mine", protect, getMyItems);
router.get("/dashboard/summary", protect, getDashboardSummary);
router.post("/lost", protect, createLostItem);
router.post("/found", protect, createFoundItem);
router.patch("/:itemId/status", protect, authorize("staff", "admin"), updateItemStatus);

module.exports = router;
