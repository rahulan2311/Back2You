const Feedback = require("../models/Feedback");
const asyncHandler = require("../utils/asyncHandler");

const createFeedback = asyncHandler(async (req, res) => {
  const { name, rating, comment } = req.body;
  const normalizedRating = Number(rating);
  const normalizedComment = String(comment || "").trim();

  if (!Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5 || !normalizedComment) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5, and comment is required");
  }

  const feedback = await Feedback.createFeedback({
    userId: req.user ? req.user._id : null,
    name: name || req.user?.name || "Anonymous",
    rating: normalizedRating,
    comment: normalizedComment
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
