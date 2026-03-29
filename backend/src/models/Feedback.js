const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    name: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    comment: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const FeedbackModel = mongoose.models.Feedback || mongoose.model("Feedback", feedbackSchema);

async function createFeedback(feedback) {
  return FeedbackModel.create(feedback);
}

async function listFeedback() {
  return FeedbackModel.find()
    .sort({ createdAt: -1 })
    .populate("userId", "name email rollNumber")
    .lean()
    .then((feedback) => feedback.map((entry) => ({
      ...entry,
      user: entry.userId || null
    })));
}

module.exports = {
  createFeedback,
  listFeedback,
  FeedbackModel
};
