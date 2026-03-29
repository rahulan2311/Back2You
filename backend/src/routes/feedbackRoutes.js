const express = require("express");
const { createFeedback, listFeedback } = require("../controllers/feedbackController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", createFeedback);
router.get("/", protect, authorize("staff", "admin"), listFeedback);

module.exports = router;
