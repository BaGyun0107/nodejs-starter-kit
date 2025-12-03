const { DecryptData } = require('../../utils/common/Encryption');
const createError = require('../../utils/common/Error');

/**
 * 양방향 암호화된 버퍼를 복호화
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const decryptPayload = (req, res, next) => {
  const { payload } = req.body;

  // console.log('미들웨어 시작 전 body:', req.body);

  // 페이로드가 없으면 다음 미들웨어로 전달
  if (!payload) {
    return next();
  }

  try {
    const decryptedPayload = DecryptData(payload);
    // 복호화된 버퍼를 객체로 변환
    const decryptedObject = JSON.parse(decryptedPayload);

    console.log('decryptedObject', decryptedObject);

    // req.body.key = value 형식으로 저장
    Object.keys(decryptedObject).forEach((key) => {
      req.body[key] = decryptedObject[key];
    });

    // console.log('미들웨어 처리 후 body:', req.body);

    // 버퍼 제거
    delete req.body.payload;
  } catch (error) {
    // console.error('복호화 처리 중 오류 발생:', error);
    return next(createError(401, '복호화 처리 중 오류 발생'));
  }

  // 다음 미들웨어로 전달
  return next();
};

module.exports = {
  decryptPayload,
};
