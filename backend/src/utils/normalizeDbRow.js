function normalizeDbRow(row) {
  if (!row) {
    return null;
  }

  const normalized = { ...row };

  if (normalized.id !== undefined) {
    normalized._id = normalized.id;
  }

  if (normalized.roll_number !== undefined) {
    normalized.rollNumber = normalized.roll_number;
    delete normalized.roll_number;
  }

  if (normalized.tracking_code !== undefined) {
    normalized.trackingCode = normalized.tracking_code;
    delete normalized.tracking_code;
  }

  if (normalized.report_type !== undefined) {
    normalized.reportType = normalized.report_type;
    delete normalized.report_type;
  }

  if (normalized.item_name !== undefined) {
    normalized.itemName = normalized.item_name;
    delete normalized.item_name;
  }

  if (normalized.event_location !== undefined) {
    normalized.eventLocation = normalized.event_location;
    delete normalized.event_location;
  }

  if (normalized.event_date !== undefined) {
    normalized.eventDate = normalized.event_date;
    delete normalized.event_date;
  }

  if (normalized.storage_location !== undefined) {
    normalized.storageLocation = normalized.storage_location;
    delete normalized.storage_location;
  }

  if (normalized.image_url !== undefined) {
    normalized.imageUrl = normalized.image_url;
    delete normalized.image_url;
  }

  if (normalized.matched_item_id !== undefined) {
    normalized.matchedItemId = normalized.matched_item_id;
    delete normalized.matched_item_id;
  }

  if (normalized.reporter_id !== undefined) {
    normalized.reporterId = normalized.reporter_id;
    delete normalized.reporter_id;
  }

  if (normalized.user_id !== undefined) {
    normalized.userId = normalized.user_id;
    delete normalized.user_id;
  }

  if (normalized.item_id !== undefined) {
    normalized.itemId = normalized.item_id;
    delete normalized.item_id;
  }

  if (normalized.claimant_id !== undefined) {
    normalized.claimantId = normalized.claimant_id;
    delete normalized.claimant_id;
  }

  if (normalized.reviewed_by !== undefined) {
    normalized.reviewedBy = normalized.reviewed_by;
    delete normalized.reviewed_by;
  }

  if (normalized.review_note !== undefined) {
    normalized.reviewNote = normalized.review_note;
    delete normalized.review_note;
  }

  if (typeof normalized.tags === "string") {
    normalized.tags = JSON.parse(normalized.tags || "[]");
  }

  if (typeof normalized.activity_log === "string") {
    normalized.activityLog = JSON.parse(normalized.activity_log || "[]");
    delete normalized.activity_log;
  } else if (normalized.activity_log === null) {
    normalized.activityLog = [];
    delete normalized.activity_log;
  }

  if (normalized.created_at !== undefined) {
    normalized.createdAt = normalized.created_at;
    delete normalized.created_at;
  }

  if (normalized.updated_at !== undefined) {
    normalized.updatedAt = normalized.updated_at;
    delete normalized.updated_at;
  }

  return normalized;
}

module.exports = normalizeDbRow;
