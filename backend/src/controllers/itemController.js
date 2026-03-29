const Item = require("../models/Item");
const asyncHandler = require("../utils/asyncHandler");
const generateTrackingCode = require("../utils/generateTrackingCode");

function buildActivity(status, note, updatedBy) {
  return {
    status,
    note,
    updatedBy
  };
}

async function createItem(req, res, reportType) {
  const {
    itemName,
    category,
    description,
    eventLocation,
    eventDate,
    storageLocation,
    tags
  } = req.body;

  if (!itemName || !category || !description || !eventLocation || !eventDate) {
    res.status(400);
    throw new Error("Item name, category, description, location, and date are required");
  }

  const trackingCode = generateTrackingCode(reportType === "lost" ? "LNF" : "FND");
  const normalizedTags = Array.isArray(tags)
    ? tags
    : typeof tags === "string" && tags.trim()
      ? tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [];

  const initialStatus = reportType === "lost" ? "still-searching" : "found";

  const item = await Item.createItem({
    trackingCode,
    reportType,
    itemName,
    category,
    description,
    eventLocation,
    eventDate,
    storageLocation,
    status: initialStatus,
    reporterId: req.user._id,
    imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
    tags: normalizedTags,
    activityLog: [
      buildActivity(
        initialStatus,
        reportType === "lost"
          ? "Lost item report created"
          : "Found item report created and stored for verification",
        req.user._id
      )
    ]
  });

  res.status(201).json({
    success: true,
    message: `${reportType} item report created successfully`,
    data: item
  });
}

const createLostItem = asyncHandler(async (req, res) => createItem(req, res, "lost"));
const createFoundItem = asyncHandler(async (req, res) => createItem(req, res, "found"));

const getItemStatus = asyncHandler(async (req, res) => {
  const { trackingCode } = req.params;
  const item = await Item.findByTrackingCode(trackingCode.toUpperCase());

  if (!item) {
    res.status(404);
    throw new Error("Tracking code not found");
  }

  res.status(200).json({
    success: true,
    data: item
  });
});

const searchItems = asyncHandler(async (req, res) => {
  const items = await Item.searchItems(req.query);

  res.status(200).json({
    success: true,
    count: items.length,
    data: items
  });
});

const getMyItems = asyncHandler(async (req, res) => {
  const items = await Item.findByReporterId(req.user._id);

  res.status(200).json({
    success: true,
    count: items.length,
    data: items
  });
});

const getDashboardSummary = asyncHandler(async (req, res) => {
  const summary = await Item.getDashboardSummary(req.user._id);

  res.status(200).json({
    success: true,
    data: summary
  });
});

const updateItemStatus = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const { status, note, matchedItem } = req.body;

  const item = await Item.findById(itemId);

  if (!item) {
    res.status(404);
    throw new Error("Item not found");
  }

  const nextStatus = status || item.status;
  const updatedItem = await Item.updateItem(itemId, {
    status: nextStatus,
    matchedItemId: matchedItem || item.matchedItemId,
    activityLog: [
      ...item.activityLog,
      buildActivity(nextStatus, note || `Status updated to ${nextStatus}`, req.user._id)
    ]
  });

  res.status(200).json({
    success: true,
    message: "Item status updated successfully",
    data: updatedItem
  });
});

module.exports = {
  createLostItem,
  createFoundItem,
  getItemStatus,
  searchItems,
  getMyItems,
  getDashboardSummary,
  updateItemStatus
};
