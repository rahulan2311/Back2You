const { getPool } = require("../config/db");
const normalizeDbRow = require("../utils/normalizeDbRow");

async function createFeedback({ userId, name, rating, comment }) {
  const [result] = await getPool().query(
    "INSERT INTO feedback (user_id, name, rating, comment) VALUES (?, ?, ?, ?)",
    [userId || null, name || null, rating, comment]
  );

  const [rows] = await getPool().query("SELECT * FROM feedback WHERE id = ? LIMIT 1", [result.insertId]);
  return normalizeDbRow(rows[0]);
}

async function listFeedback() {
  const [rows] = await getPool().query(
    `SELECT f.*, u.name AS user_name, u.email AS user_email, u.roll_number AS user_roll_number
     FROM feedback f
     LEFT JOIN users u ON u.id = f.user_id
     ORDER BY f.created_at DESC`
  );

  return rows.map((row) => {
    const normalized = normalizeDbRow(row);
    normalized.user = row.user_name
      ? {
          name: row.user_name,
          email: row.user_email,
          rollNumber: row.user_roll_number
        }
      : null;
    delete normalized.user_name;
    delete normalized.user_email;
    delete normalized.user_roll_number;
    return normalized;
  });
}

module.exports = {
  createFeedback,
  listFeedback
};
