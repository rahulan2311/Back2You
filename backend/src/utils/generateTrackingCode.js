function generateTrackingCode(prefix) {
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${randomNumber}`;
}

module.exports = generateTrackingCode;
