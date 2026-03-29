const { getPool } = require("../config/db");
const normalizeDbRow = require("../utils/normalizeDbRow");

async function createClaim({ itemId, claimantId, proof }) {
  const [result] = await getPool().query(
    "INSERT INTO claims (item_id, claimant_id, proof) VALUES (?, ?, ?)",
    [itemId, claimantId, proof]
  );

  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await getPool().query("SELECT * FROM claims WHERE id = ? LIMIT 1", [id]);
  return normalizeDbRow(rows[0]);
}

async function updateClaim(id, { status, reviewNote, reviewedBy }) {
  await getPool().query(
    "UPDATE claims SET status = ?, review_note = ?, reviewed_by = ? WHERE id = ?",
    [status, reviewNote || null, reviewedBy || null, id]
  );

  return findById(id);
}

module.exports = {
  createClaim,
  findById,
  updateClaim
};
