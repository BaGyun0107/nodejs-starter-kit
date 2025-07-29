/**
 *
 * @param {*} status - 상태 코드
 * @param {*} message - 에러 메시지
 * @returns {Error} - 에러 객체
 *
 * @description
 * createError 함수는 에러 객체를 생성합니다.
 *
 * @example
 * return next(createError(500, '서버 오류'));
 */
const createError = (status, message) => {
  const err = new Error();
  err.status = status;
  err.message = message;
  return err;
};

module.exports = createError;
