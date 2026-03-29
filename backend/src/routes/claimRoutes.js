const express = require("express");
const { createClaim, reviewClaim } = require("../controllers/claimController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createClaim);
router.patch("/:claimId/review", protect, authorize("staff", "admin"), reviewClaim);

module.exports = router;
