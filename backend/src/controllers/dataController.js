const asyncHandler = require("../utils/asyncHandler");
const { UserModel } = require("../models/User");
const { ItemModel } = require("../models/Item");
const { FeedbackModel } = require("../models/Feedback");
const { ClaimModel } = require("../models/Claim");

const getDataOverview = asyncHandler(async (req, res) => {
  const [users, items, feedback, claims] = await Promise.all([
    UserModel.find().select("-password").sort({ createdAt: -1 }).lean(),
    ItemModel.find().populate("reporterId", "name email rollNumber role").sort({ createdAt: -1 }).lean(),
    FeedbackModel.find().populate("userId", "name email rollNumber role").sort({ createdAt: -1 }).lean(),
    ClaimModel.find().populate("itemId", "trackingCode itemName reportType status").populate("claimantId", "name email rollNumber role").sort({ createdAt: -1 }).lean()
  ]);

  const lostItems = items.filter((item) => item.reportType === "lost");
  const foundItems = items.filter((item) => item.reportType === "found");

  res.status(200).json({
    success: true,
    data: {
      counts: {
        users: users.length,
        lostItems: lostItems.length,
        foundItems: foundItems.length,
        feedback: feedback.length,
        claims: claims.length
      },
      users,
      lostItems,
      foundItems,
      feedback,
      claims
    }
  });
});

module.exports = {
  getDataOverview
};
