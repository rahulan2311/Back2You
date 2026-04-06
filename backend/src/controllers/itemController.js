const crypto = require("crypto");
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

function serializeItemForResponse(item) {
  if (!item) {
    return item;
  }

  if (item._doc) {
    return { ...item._doc };
  }

  if (typeof item.toObject === "function") {
    return item.toObject();
  }

  return { ...item };
}

function normalizeImageUrl(value) {
  const trimmedValue = String(value || "").trim();

  if (!trimmedValue) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(trimmedValue);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return null;
    }
    return parsedUrl.toString();
  } catch (error) {
    return null;
  }
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME
    && process.env.CLOUDINARY_API_KEY
    && process.env.CLOUDINARY_API_SECRET
  );
}

async function uploadImageToCloudinary(file, reportType) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = process.env.CLOUDINARY_FOLDER || "back2you";
  const publicIdBase = String(file.originalname || "report-image")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "report-image";
  const publicId = `${reportType}-${Date.now()}-${publicIdBase}`;
  const signaturePayload = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");
  const formData = new FormData();
  const imageBlob = new Blob([file.buffer], { type: file.mimetype });

  formData.append("file", imageBlob, file.originalname || `${publicId}.jpg`);
  formData.append("api_key", process.env.CLOUDINARY_API_KEY);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", folder);
  formData.append("public_id", publicId);
  formData.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    const cloudinaryMessage = result && result.error && result.error.message
      ? result.error.message
      : "Unable to upload image to Cloudinary";
    throw new Error(cloudinaryMessage);
  }

  return result.secure_url;
}

async function resolveImageUrl(req, reportType) {
  if (req.file) {
    return uploadImageToCloudinary(req.file, reportType);
  }

  const normalizedImageUrl = normalizeImageUrl(req.body.imageUrl);
  if (req.body.imageUrl && !normalizedImageUrl) {
    return null;
  }

  return normalizedImageUrl;
}

async function generateUniqueTrackingCode(prefix) {
  let trackingCode;
  let exists = true;

  while (exists) {
    trackingCode = generateTrackingCode(prefix);
    exists = await Item.existsByTrackingCode(trackingCode);
  }

  return trackingCode;
}

async function createItem(req, res, reportType) {
  const {
    itemName,
    category,
    description,
    eventLocation,
    eventDate,
    storageLocation,
    contactPhone,
    tags
  } = req.body;

  if (!itemName || !category || !description || !eventLocation || !eventDate) {
    res.status(400);
    throw new Error("Item name, category, description, location, and date are required");
  }

  const resolvedImageUrl = await resolveImageUrl(req, reportType);
  if (req.body.imageUrl && !resolvedImageUrl) {
    res.status(400);
    throw new Error("Image URL must be a valid http or https link");
  }

  const trackingCode = await generateUniqueTrackingCode(reportType === "lost" ? "LNF" : "FND");
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
    contactPhone,
    status: initialStatus,
    reporterId: req.user._id,
    imageUrl: resolvedImageUrl,
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

  const potentialMatch = await Item.findPotentialMatch(item);
  let finalItem = item;
  let autoMatched = false;

  if (potentialMatch) {
    autoMatched = true;
    finalItem = await Item.updateItem(item._id, {
      status: "found",
      matchedItemId: potentialMatch._id,
      activityLog: [
        ...item.activityLog,
        buildActivity("found", `Automatically matched with ${potentialMatch.trackingCode}`, req.user._id)
      ]
    });

    await Item.updateItem(potentialMatch._id, {
      status: "found",
      matchedItemId: item._id,
      activityLog: [
        ...potentialMatch.activityLog,
        buildActivity("found", `Automatically matched with ${item.trackingCode}`, req.user._id)
      ]
    });
  }

  res.status(201).json({
    success: true,
    message: autoMatched
      ? `${reportType} item report created and matched successfully`
      : `${reportType} item report created successfully`,
    data: {
      ...serializeItemForResponse(finalItem),
      autoMatched,
      matchedTrackingCode: potentialMatch ? potentialMatch.trackingCode : null
    }
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
