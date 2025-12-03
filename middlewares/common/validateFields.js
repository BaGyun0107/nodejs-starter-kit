const { validationResult } = require('express-validator');
const createError = require('../../utils/common/Error');

/**
 * 유효성 검사 결과 처리 미들웨어
 * @param {object} req - Express 요청 객체
 * @param {object} res - Express 응답 객체
 * @param {function} next - 다음 미들웨어 함수
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // 프로덕션 환경에서는 문자열을 반환하여 에러 메시지를 숨김
    if (process.env.NODE_ENV === 'production') {
      const msg = errors.array()[0].msg;
      return next(createError(400, msg || '필수 값을 확인해주세요.'));
    }

    const message = errors.array().map((err) => {
      return `[${err.path}] ${err.msg} <${err.value}>`;
    });

    return next(createError(400, message));
  }

  return next();
};

module.exports = {
  validateAreaFields,
  handleValidationErrors,
};
