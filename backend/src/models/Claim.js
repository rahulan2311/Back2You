const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true
    },
    claimantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    proof: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewNote: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const ClaimModel = mongoose.models.Claim || mongoose.model("Claim", claimSchema);

async function createClaim(claim) {
  return ClaimModel.create(claim);
}

async function findById(id) {
  return ClaimModel.findById(id).lean();
}

async function updateClaim(id, updates) {
  return ClaimModel.findByIdAndUpdate(
    id,
    {
      status: updates.status,
      reviewNote: updates.reviewNote,
      reviewedBy: updates.reviewedBy
    },
    { new: true }
  ).lean();
}

module.exports = {
  createClaim,
  findById,
  updateClaim,
  ClaimModel
};
