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

async function createItem(item) {
  return ItemModel.create(item);
}

async function findById(id) {
  return ItemModel.findById(id).lean();
}

async function findByTrackingCode(trackingCode) {
  return ItemModel.findOne({ trackingCode })
    .populate("reporterId", "name email rollNumber")
    .populate("matchedItemId", "trackingCode itemName status")
    .lean()
    .then((item) => {
      if (!item) {
        return null;
      }

      item.reporter = item.reporterId || null;
      item.matchedItem = item.matchedItemId || null;
      return item;
    });
}

async function searchItems({ q, category, reportType, status }) {
  const filter = {};

  if (q) {
    filter.$or = [
      { trackingCode: { $regex: q, $options: "i" } },
      { itemName: { $regex: q, $options: "i" } },
      { category: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } }
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
  findByTrackingCode,
  searchItems,
  findByReporterId,
  getDashboardSummary,
  updateItem,
  ItemModel
};
