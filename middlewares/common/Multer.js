const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * Multer 업로더 생성 함수
 * @param {Object} options - 설정 옵션
 * @param {string} options.uploadPath - 업로드 경로 (프로젝트 루트 기준)
 * @param {string|Function} options.filenameStrategy - 파일명 생성 전략 ('uuid', 'original', 또는 함수)
 * @param {Array<string>} options.allowedMimeTypes - 허용할 MIME 타입 (부분 일치 지원)
 * @returns {Object} Multer 인스턴스
 */
const createUploader = ({
  uploadPath = 'uploads',
  filenameStrategy = 'uuid',
  allowedMimeTypes = [],
} = {}) => {
  // 디렉토리 확인 및 생성
  const fullPath = path.join(process.cwd(), uploadPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      if (typeof filenameStrategy === 'function') {
        filenameStrategy(req, file, cb);
      } else if (filenameStrategy === 'original') {
        cb(null, file.originalname);
      } else {
        // 기본값: UUID + 확장자
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
      }
    },
  });

  const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.length === 0) {
      return cb(null, true);
    }

    // MIME 타입 확인 (부분 일치 지원, 예: 'image/'는 'image/png' 허용)
    const isAllowed = allowedMimeTypes.some((type) =>
      file.mimetype.includes(type),
    );

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `허용되지 않는 파일 형식입니다. 허용된 형식: ${allowedMimeTypes.join(', ')}`,
        ),
        false,
      );
    }
  };

  return multer({ storage, fileFilter });
};

module.exports = createUploader;
