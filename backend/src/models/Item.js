const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    note: {
      type: String,
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    trackingCode: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    reportType: {
      type: String,
      enum: ["lost", "found"],
      required: true
    },
    itemName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    eventLocation: {
      type: String,
      required: true,
      trim: true
    },
    eventDate: {
      type: Date,
      required: true
    },
    storageLocation: {
      type: String,
      trim: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    imageUrl: {
      type: String,
      trim: true
    },
    tags: [{ type: String, trim: true }],
    status: {
      type: String,
      enum: ["reported", "still-searching", "found", "claimed", "returned"],
      default: "reported"
    },
    matchedItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item"
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    activityLog: [activityLogSchema]
  },
  {
    timestamps: true
  }
);

itemSchema.index({
  trackingCode: "text",
  itemName: "text",
  category: "text",
  description: "text",
  eventLocation: "text"
});

const ItemModel = mongoose.models.Item || mongoose.model("Item", itemSchema);

function normalizeWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function countSharedWords(left, right) {
  const leftWords = new Set(normalizeWords(left));
  const rightWords = new Set(normalizeWords(right));
  let count = 0;

  for (const word of leftWords) {
    if (rightWords.has(word)) {
      count += 1;
    }
  }

  return count;
}

function getDayDifference(sourceItem, candidateItem) {
  const sourceDate = new Date(sourceItem.eventDate).getTime();
  const candidateDate = new Date(candidateItem.eventDate).getTime();

  if (Number.isNaN(sourceDate) || Number.isNaN(candidateDate)) {
    return null;
  }

  return Math.abs(sourceDate - candidateDate) / (1000 * 60 * 60 * 24);
}

function analyzePotentialMatch(sourceItem, candidateItem) {
  const categoryMatches = sourceItem.category.trim().toLowerCase() === candidateItem.category.trim().toLowerCase();
  const sharedNameWords = countSharedWords(sourceItem.itemName, candidateItem.itemName);
  const sharedDescriptionWords = countSharedWords(sourceItem.description, candidateItem.description);
  const sharedLocationWords = countSharedWords(sourceItem.eventLocation, candidateItem.eventLocation);
  const dayDifference = getDayDifference(sourceItem, candidateItem);
  const reasons = [];
  let score = 0;

  if (categoryMatches) {
    score += 4;
    reasons.push("same category");
  }

  if (sharedNameWords > 0) {
    score += Math.min(sharedNameWords, 3) * 3;
    reasons.push("similar item name");
  }

  if (sharedDescriptionWords > 0) {
    score += Math.min(sharedDescriptionWords, 4) * 2;
    reasons.push("similar description");
  }

  if (sharedLocationWords > 0) {
    score += Math.min(sharedLocationWords, 2) * 2;
    reasons.push("similar location");
  }

  if (dayDifference !== null && dayDifference <= 1) {
    score += 3;
    reasons.push("same day");
  } else if (dayDifference !== null && dayDifference <= 3) {
    score += 2;
    reasons.push("nearby date");
  } else if (dayDifference !== null && dayDifference <= 7) {
    score += 1;
  }

  return {
    score,
    reasons,
    categoryMatches,
    sharedNameWords,
    sharedDescriptionWords,
    sharedLocationWords,
    dayDifference
  };
}

function scorePotentialMatch(sourceItem, candidateItem) {
  return analyzePotentialMatch(sourceItem, candidateItem).score;
}

async function createItem(item) {
  return ItemModel.create(item);
}

async function findById(id) {
  return ItemModel.findById(id).lean();
}

async function existsByTrackingCode(trackingCode) {
  return ItemModel.exists({ trackingCode });
}

async function listPotentialMatches(item, options = {}) {
  const candidateReportType = item.reportType === "lost" ? "found" : "lost";
  const {
    includeMatchedItems = false,
    limit = 5,
    minScore = 3,
    requireNameOrCategory = false
  } = options;
  const candidates = await ItemModel.find({
    reportType: candidateReportType,
    status: { $in: ["reported", "still-searching", "found", "claimed"] }
  })
    .sort({ createdAt: -1 })
    .limit(includeMatchedItems ? 50 : 25)
    .lean();

  const currentItemId = String(item._id);
  const rankedMatches = [];

  for (const candidate of candidates) {
    const candidateMatchedId = candidate.matchedItemId ? String(candidate.matchedItemId) : null;

    if (!includeMatchedItems && candidateMatchedId) {
      continue;
    }

    if (includeMatchedItems && candidateMatchedId && candidateMatchedId !== currentItemId) {
      continue;
    }

    const analysis = analyzePotentialMatch(item, candidate);
    if (requireNameOrCategory && !(analysis.categoryMatches || analysis.sharedNameWords > 0)) {
      continue;
    }

    if (analysis.score < minScore) {
      continue;
    }

    rankedMatches.push({
      ...candidate,
      matchScore: analysis.score,
      matchReasons: analysis.reasons,
      sharedNameWords: analysis.sharedNameWords,
      sharedDescriptionWords: analysis.sharedDescriptionWords,
      sharedLocationWords: analysis.sharedLocationWords,
      dayDifference: analysis.dayDifference
    });
  }

  return rankedMatches
    .sort((left, right) => right.matchScore - left.matchScore || new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, limit);
}

async function findPotentialMatch(item) {
  const matches = await listPotentialMatches(item, {
    includeMatchedItems: false,
    limit: 1,
    minScore: 8
  });

  return matches[0] || null;
}

async function findByTrackingCode(trackingCode) {
  const item = await ItemModel.findOne({ trackingCode })
    .populate("reporterId", "name email rollNumber")
    .populate("matchedItemId", "trackingCode itemName category status reportType eventLocation eventDate contactPhone imageUrl")
    .lean();

  if (!item) {
    return null;
  }

  item.reporter = item.reporterId || null;
  item.matchedItem = item.matchedItemId || null;

  if (item.reportType === "lost") {
    const possibleMatches = await listPotentialMatches(item, {
      includeMatchedItems: true,
      limit: 20,
      minScore: 0,
      requireNameOrCategory: true
    });

    item.possibleMatches = item.matchedItemId
      ? possibleMatches.filter((candidate) => String(candidate._id) !== String(item.matchedItemId._id || item.matchedItemId))
      : possibleMatches;
  } else {
    item.possibleMatches = [];
  }

  return item;
}

async function searchItems({ q, category, reportType, status }) {
  const filter = {};

  if (q) {
    filter.$or = [
      { trackingCode: { $regex: q, $options: "i" } },
      { itemName: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { eventLocation: { $regex: q, $options: "i" } }
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (reportType) {
    filter.reportType = reportType;
  }

  if (status) {
    filter.status = status;
  }

  return ItemModel.find(filter).sort({ createdAt: -1 }).limit(50).lean();
}

async function findByReporterId(reporterId) {
  return ItemModel.find({ reporterId }).sort({ createdAt: -1 }).lean();
}

async function getDashboardSummary(userId) {
  const [totalLostReports, totalFoundReports, totalReturned, myActiveReports, recentActivity] = await Promise.all([
    ItemModel.countDocuments({ reportType: "lost" }),
    ItemModel.countDocuments({ reportType: "found" }),
    ItemModel.countDocuments({ status: "returned" }),
    ItemModel.countDocuments({
      reporterId: userId,
      status: { $in: ["reported", "still-searching", "found", "claimed"] }
    }),
    ItemModel.find().sort({ updatedAt: -1 }).limit(5).select("trackingCode itemName status reportType updatedAt").lean()
  ]);

  return {
    totalLostReports,
    totalFoundReports,
    totalReturned,
    myActiveReports,
    recentActivity
  };
}

async function updateItem(id, updates) {
  return ItemModel.findByIdAndUpdate(
    id,
    {
      status: updates.status,
      matchedItemId: updates.matchedItemId || null,
      activityLog: updates.activityLog || []
    },
    { new: true }
  ).lean();
}

module.exports = {
  createItem,
  findById,
  existsByTrackingCode,
  findPotentialMatch,
  listPotentialMatches,
  findByTrackingCode,
  searchItems,
  findByReporterId,
  getDashboardSummary,
  updateItem,
  ItemModel
};
