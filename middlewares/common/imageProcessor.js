const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// 업로드 디렉토리 설정
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * 이미지 처리를 위한 Sharp 설정
 * @param {Buffer} buffer 이미지 버퍼
 * @returns {Promise} Sharp 인스턴스
 */
const processImage = async (buffer) => {
  // Sharp 인스턴스 캐시 활성화로 메모리 사용량 감소
  sharp.cache(false);

  return sharp(buffer, {
    // 병렬 처리 제한으로 메모리 사용량 조절
    limitInputPixels: 50000000, // 50MP 제한
    failOnError: false
  });
};

const processSingleFile = async (file) => {
  // 이미지 파일이 아니면 오류 반환
  if (!file.mimetype.startsWith('image/')) {
    // pdf 파일로 넘어오는 경우 별도 변환 없이 진행
    // 파일 이름을 Buffer로 처리하여 인코딩 문제를 해결
    const originalnameBuffer = Buffer.from(file.originalname, 'latin1');
    const originalname = originalnameBuffer.toString('utf8'); // UTF-8로 변환

    const outputPath = path.join(uploadDir, originalname);
    // buffer 파일 저장
    fs.writeFileSync(outputPath, file.buffer);

    return {
      originalname,
      filename: originalname,
      path: outputPath,
      mimetype: file.mimetype,
      size: file.size
    };
  }

  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  // 파일 이름을 Buffer로 처리하여 인코딩 문제를 해결
  const originalnameBuffer = Buffer.from(file.originalname, 'latin1');
  const originalname = originalnameBuffer.toString('utf8'); // UTF-8로 변환

  const outputFilename = `${path.parse(originalname).name}_${uniqueSuffix}.webp`;
  const outputPath = path.join(uploadDir, outputFilename);

  const image = await processImage(file.buffer);
  const metadata = await image.metadata();

  console.log(`${originalname} 파일 처리 중...`);

  // 이미지 처리 파이프라인 최적화
  await image
    .webp({
      quality: 60,
      effort: 3, // 압축 속도 vs 품질 균형
      lossless: false
    })
    .toFile(outputPath);

  // 버퍼 플러쉬
  file.buffer = null;

  const size = fs.statSync(outputPath).size;

  return {
    originalname,
    filename: outputFilename,
    path: outputPath,
    mimetype: 'image/webp',
    size
  };
};

/**
 * WebP 변환 및 리사이징 미들웨어 (단일 및 다중 파일 지원)
 * @param {Object} req 요청 객체
 * @param {Object} res 응답 객체
 * @param {Function} next 다음 미들웨어 함수
 * @returns {void} req에 파일정보에 반영된 상태로 다음 미들웨어에게 전달됨
 */
const imageProcessor = async (req, res, next) => {
  // 파일 객체가 없으면 validator에서 걸러지므로 여기선 다음 미들웨어로 패스한다.
  if (!req.file && !req.files) {
    return next();
  }

  try {
    if (req.file) {
      // 단일 파일 처리
      const processedFile = await processSingleFile(req.file);
      req.file.filename = processedFile.filename;
      req.file.path = processedFile.path;
      req.file.mimetype = processedFile.mimetype;
      req.file.size = processedFile.size;
      req.file.originalname = processedFile.originalname;
    }

    if (req.files) {
      // 여러 파일 처리
      const processedFiles = {};

      for (const [fieldName, files] of Object.entries(req.files)) {
        processedFiles[fieldName] = await Promise.all(
          files.map(async (file) => {
            try {
              return await processSingleFile(file);
            } catch (err) {
              console.error(`파일 처리 실패: ${file.originalname}`, err);
              throw new Error('이미지 처리 중 오류 발생');
            }
          })
        );
      }

      // req.files에 변환된 파일 정보 반영
      req.files = processedFiles;
    }

    console.log('이미지 처리 완료');
    return next();
  } catch (error) {
    console.error('WebP 변환 오류:', error);
    return res.status(500).json({ error: '이미지 처리 중 오류 발생' });
  }
};

module.exports = imageProcessor;
