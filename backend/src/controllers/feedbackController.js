const Feedback = require("../models/Feedback");
const asyncHandler = require("../utils/asyncHandler");

const createFeedback = asyncHandler(async (req, res) => {
  const { name, rating, comment } = req.body;

  if (!rating || !comment) {
    res.status(400);
    throw new Error("Rating and comment are required");
  }

  const feedback = await Feedback.createFeedback({
    userId: req.user ? req.user._id : null,
    name: name || req.user?.name || "Anonymous",
    rating,
    comment
  });

  res.status(201).json({
    success: true,
    message: "Feedback submitted successfully",
    data: feedback
  });
});

const listFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.listFeedback();

  res.status(200).json({
    success: true,
    count: feedback.length,
    data: feedback
  });
});

module.exports = {
  createFeedback,
  listFeedback
};
