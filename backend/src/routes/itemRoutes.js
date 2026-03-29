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
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/search", searchItems);
router.get("/status/:trackingCode", getItemStatus);
router.get("/mine", protect, getMyItems);
router.get("/dashboard/summary", protect, getDashboardSummary);
router.post("/lost", protect, upload.single("image"), createLostItem);
router.post("/found", protect, upload.single("image"), createFoundItem);
router.patch("/:itemId/status", protect, authorize("staff", "admin"), updateItemStatus);

module.exports = router;
