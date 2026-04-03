const { randomInt } = require("crypto");

function generateTrackingCode(prefix) {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const randomPart = String(randomInt(1000, 10000)).padStart(4, "0");

  return `${prefix}-${datePart}-${timePart}-${randomPart}`;
}

module.exports = generateTrackingCode;
