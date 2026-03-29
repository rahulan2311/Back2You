const Claim = require("../models/Claim");
const Item = require("../models/Item");
const asyncHandler = require("../utils/asyncHandler");
const generateTrackingCode = require("../utils/generateTrackingCode");

const createClaim = asyncHandler(async (req, res) => {
  const { trackingCode, proof } = req.body;

  if (!trackingCode || !proof) {
    res.status(400);
    throw new Error("Tracking code and proof are required");
  }

  const item = await Item.findByTrackingCode(trackingCode.toUpperCase());

  if (!item) {
    res.status(404);
    throw new Error("Item not found for this tracking code");
  }

  const claim = await Claim.createClaim({
    itemId: item._id,
    claimantId: req.user._id,
    proof
  });

  await Item.updateItem(item._id, {
    status: "claimed",
    matchedItemId: item.matchedItemId,
    activityLog: [
      ...item.activityLog,
      {
        status: "claimed",
        note: `Ownership claim ${generateTrackingCode("CLM")} submitted for review`,
        updatedBy: req.user._id
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: "Claim submitted successfully",
    data: claim
  });
});

const reviewClaim = asyncHandler(async (req, res) => {
  const { claimId } = req.params;
  const { status, reviewNote } = req.body;

  if (!["approved", "rejected"].includes(status)) {
    res.status(400);
    throw new Error("Claim status must be approved or rejected");
  }

  const claim = await Claim.findById(claimId);

  if (!claim) {
    res.status(404);
    throw new Error("Claim not found");
  }

  const updatedClaim = await Claim.updateClaim(claimId, {
    status,
    reviewNote,
    reviewedBy: req.user._id
  });

  const item = await Item.findById(claim.itemId);
  const nextStatus = status === "approved" ? "returned" : "found";
  await Item.updateItem(claim.itemId, {
    status: nextStatus,
    matchedItemId: item.matchedItemId,
    activityLog: [
      ...item.activityLog,
      {
        status: nextStatus,
        note:
          status === "approved"
            ? "Claim approved and item marked returned"
            : "Claim rejected and item moved back to found status",
        updatedBy: req.user._id
      }
    ]
  });

  res.status(200).json({
    success: true,
    message: `Claim ${status} successfully`,
    data: updatedClaim
  });
});

module.exports = {
  createClaim,
  reviewClaim
};
