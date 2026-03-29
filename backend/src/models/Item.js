const { getPool } = require("../config/db");
const normalizeDbRow = require("../utils/normalizeDbRow");

function mapItemRow(row) {
  const normalized = normalizeDbRow(row);
  if (!normalized) {
    return null;
  }

  if (!Array.isArray(normalized.tags)) {
    normalized.tags = [];
  }

  if (!Array.isArray(normalized.activityLog)) {
    normalized.activityLog = [];
  }

  return normalized;
}

async function createItem(item) {
  const [result] = await getPool().query(
    `INSERT INTO items (
      tracking_code, report_type, item_name, category, description, event_location,
      event_date, storage_location, image_url, tags, status, matched_item_id,
      reporter_id, activity_log
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.trackingCode,
      item.reportType,
      item.itemName,
      item.category,
      item.description,
      item.eventLocation,
      item.eventDate,
      item.storageLocation || null,
      item.imageUrl || null,
      JSON.stringify(item.tags || []),
      item.status,
      item.matchedItemId || null,
      item.reporterId,
      JSON.stringify(item.activityLog || [])
    ]
  );

  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await getPool().query("SELECT * FROM items WHERE id = ? LIMIT 1", [id]);
  return mapItemRow(rows[0]);
}

async function findByTrackingCode(trackingCode) {
  const [rows] = await getPool().query(
    `SELECT i.*, u.name AS reporter_name, u.email AS reporter_email, u.roll_number AS reporter_roll_number,
            mi.tracking_code AS matched_tracking_code, mi.item_name AS matched_item_name, mi.status AS matched_status
     FROM items i
     JOIN users u ON u.id = i.reporter_id
     LEFT JOIN items mi ON mi.id = i.matched_item_id
     WHERE i.tracking_code = ?
     LIMIT 1`,
    [trackingCode]
  );

  const item = mapItemRow(rows[0]);
  if (!item) {
    return null;
  }

  item.reporter = {
    name: rows[0].reporter_name,
    email: rows[0].reporter_email,
    rollNumber: rows[0].reporter_roll_number
  };

  item.matchedItem = rows[0].matched_tracking_code
    ? {
        trackingCode: rows[0].matched_tracking_code,
        itemName: rows[0].matched_item_name,
        status: rows[0].matched_status
      }
    : null;

  delete item.reporter_name;
  delete item.reporter_email;
  delete item.reporter_roll_number;
  delete item.matched_tracking_code;
  delete item.matched_item_name;
  delete item.matched_status;

  return item;
}

async function searchItems({ q, category, reportType, status }) {
  const conditions = [];
  const values = [];

  if (q) {
    conditions.push("(tracking_code LIKE ? OR item_name LIKE ? OR category LIKE ? OR description LIKE ?)");
    values.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }

  if (category) {
    conditions.push("category = ?");
    values.push(category);
  }

  if (reportType) {
    conditions.push("report_type = ?");
    values.push(reportType);
  }

  if (status) {
    conditions.push("status = ?");
    values.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await getPool().query(
    `SELECT * FROM items ${whereClause} ORDER BY created_at DESC LIMIT 50`,
    values
  );

  return rows.map(mapItemRow);
}

async function findByReporterId(reporterId) {
  const [rows] = await getPool().query(
    "SELECT * FROM items WHERE reporter_id = ? ORDER BY created_at DESC",
    [reporterId]
  );

  return rows.map(mapItemRow);
}

async function getDashboardSummary(userId) {
  const pool = getPool();
  const activeStatuses = ["reported", "still-searching", "found", "claimed"];

  const [lostResult, foundResult, returnedResult, activeResult, recentResult] = await Promise.all([
    pool.query("SELECT COUNT(*) AS total FROM items WHERE report_type = 'lost'"),
    pool.query("SELECT COUNT(*) AS total FROM items WHERE report_type = 'found'"),
    pool.query("SELECT COUNT(*) AS total FROM items WHERE status = 'returned'"),
    pool.query(
      `SELECT COUNT(*) AS total
       FROM items
       WHERE reporter_id = ? AND status IN (?, ?, ?, ?)`,
      [userId, ...activeStatuses]
    ),
    pool.query(
      "SELECT tracking_code, item_name, status, report_type, updated_at FROM items ORDER BY updated_at DESC LIMIT 5"
    )
  ]);

  return {
    totalLostReports: lostResult[0][0].total,
    totalFoundReports: foundResult[0][0].total,
    totalReturned: returnedResult[0][0].total,
    myActiveReports: activeResult[0][0].total,
    recentActivity: recentResult[0].map(mapItemRow)
  };
}

async function updateItem(id, updates) {
  await getPool().query(
    `UPDATE items
     SET status = ?, matched_item_id = ?, activity_log = ?
     WHERE id = ?`,
    [
      updates.status,
      updates.matchedItemId || null,
      JSON.stringify(updates.activityLog || []),
      id
    ]
  );

  return findById(id);
}

module.exports = {
  createItem,
  findById,
  findByTrackingCode,
  searchItems,
  findByReporterId,
  getDashboardSummary,
  updateItem
};
