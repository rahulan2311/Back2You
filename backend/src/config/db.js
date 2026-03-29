const mysql = require("mysql2/promise");

let pool;

async function connectDatabase() {
  const {
    DB_HOST,
    DB_PORT,
    DB_NAME,
    DB_USER,
    DB_PASSWORD
  } = process.env;

  if (!DB_HOST || !DB_NAME || !DB_USER) {
    throw new Error("DB_HOST, DB_NAME, and DB_USER are required environment variables");
  }

  pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT || 3306),
    database: DB_NAME,
    user: DB_USER,
    password: DB_PASSWORD || "",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  await pool.query("SELECT 1");
  console.log("MySQL connected");
}

function getPool() {
  if (!pool) {
    throw new Error("Database pool has not been initialized");
  }

  return pool;
}

module.exports = {
  connectDatabase,
  getPool
};
