const crypto = require('crypto');

/**
 * 데이터 암호화 및 복호화 유틸리티
 *
 * @param {Object} data - 암호화할 데이터
 * @returns {string} - 암호화된 데이터
 */
const encryptData = (data) => {
  // 암호화 키와 IV 생성
  const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32바이트 (256비트)
  const encryptionIv = crypto.randomBytes(16); // 16바이트 (128비트)

  // AES-256-CBC로 암호화 객체 생성
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    encryptionKey,
    encryptionIv
  );

  // 데이터를 JSON 문자열로 변환 후 암호화
  let encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encryptedData += cipher.final('base64');

  // IV와 암호화된 데이터를 '.'으로 결합 (Base64로 인코딩)
  const encodedIv = encryptionIv.toString('base64');
  return `${encodeURIComponent(encodedIv)}.${encodeURIComponent(encryptedData)}`;
};

/**
 * 암호화된 데이터 복호화
 * @param {String} encryptedData 암호화된 데이터
 * @returns {Object} 복호화된 데이터
 */
const decryptData = (encryptedData) => {
  // URL 디코딩 후 암호화된 데이터 분리
  const [encodedIv, encryptedText] = encryptedData
    .split('.')
    .map(decodeURIComponent);

  // Base64로 디코딩
  const iv = Buffer.from(encodedIv, 'base64');
  const encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const encryptedBuffer = Buffer.from(encryptedText, 'base64');

  // AES-256-CBC로 복호화 객체 생성
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);

  // 복호화 수행
  let decryptedData = decipher.update(encryptedBuffer, 'base64', 'utf8');
  decryptedData += decipher.final('utf8');

  return JSON.parse(decryptedData);
};

module.exports = { encryptData, decryptData };
