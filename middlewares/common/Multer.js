const multer = require('multer');

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 최대 파일 크기 (500MB)
});

const uploadFax = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 최대 파일 크기 (10MB)
});

module.exports = { upload, uploadFax };
