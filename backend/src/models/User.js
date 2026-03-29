const bcrypt = require("bcryptjs");
const { getPool } = require("../config/db");
const normalizeDbRow = require("../utils/normalizeDbRow");

async function findById(id) {
  const [rows] = await getPool().query(
    "SELECT id, name, email, roll_number, role, created_at, updated_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );

  return normalizeDbRow(rows[0]);
}

async function findByEmailOrRollNumber(email, rollNumber) {
  const [rows] = await getPool().query(
    "SELECT * FROM users WHERE email = ? OR roll_number = ? LIMIT 1",
    [email.toLowerCase(), rollNumber.toUpperCase()]
  );

  return normalizeDbRow(rows[0]);
}

async function findByLogin(value) {
  const [rows] = await getPool().query(
    "SELECT * FROM users WHERE email = ? OR roll_number = ? LIMIT 1",
    [value.toLowerCase(), value.toUpperCase()]
  );

  return normalizeDbRow(rows[0]);
}

async function createUser({ name, email, rollNumber, password, role = "student" }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await getPool().query(
    `INSERT INTO users (name, email, roll_number, password, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email.toLowerCase(), rollNumber.toUpperCase(), hashedPassword, role]
  );

  return findById(result.insertId);
}

function matchPassword(enteredPassword, hashedPassword) {
  return bcrypt.compare(enteredPassword, hashedPassword);
}

module.exports = {
  findById,
  findByEmailOrRollNumber,
  findByLogin,
  createUser,
  matchPassword
};
