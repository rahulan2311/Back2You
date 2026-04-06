const multer = require("multer");

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error("Only JPG, PNG, WEBP, and GIF image uploads are allowed"));
      return;
    }

    cb(null, true);
  }
});

module.exports = upload;
