const createError = require('../../utils/common/error');

/**
 * [Optional] 검증기
 * @param {object} validator - Express Validator 체인
 * @param {string} field - 필드명
 * @returns {object} - Express Validator 체인
 */
const optValidator = (validator, field) => {
  return validator
    .optional()
    .customSanitizer((value) => {
      // "null", "undefined", null, undefined 값을 제거
      if (
        value === 'null' ||
        value === 'undefined' ||
        value === null ||
        value === undefined
      ) {
        return ''; // 해당 값을 ''로 변환
      }

      return value;
    })
    .trim();
};

/**
 * [Required] 검증기
 * @param {object} validator - Express Validator 체인
 * @param {string} field - 필드명
 * @returns {object} - Express Validator 체인
 */
const requiredValidator = (validator, field, emptyMessage) => {
  return validator
    .trim()
    .notEmpty()
    .withMessage(emptyMessage || `${field}는 빈 값이 될 수 없습니다.`)
    .custom((value, { req }) => {
      // 값이 "null", "undefined", null, undefined인 경우 필드 제거
      if (
        value === 'null' ||
        value === 'undefined' ||
        value === null ||
        value === undefined
      ) {
        delete req.body[field]; // 필드를 요청 객체에서 제거
        return false; // 검증을 중단
      }
      return true;
    });
};

/**
 * [Required] 배열/객체용 검증기
 * @param {object} validator - Express Validator 체인
 * @param {string} field - 필드명
 * @returns {object} - Express Validator 체인
 */
const requiredObjectValidator = (validator, field) => {
  return validator
    .notEmpty()
    .withMessage(`${field}는 빈 값이 될 수 없습니다.`)
    .custom((value, { req }) => {
      // 값이 "null", "undefined", null, undefined인 경우 필드 제거
      if (
        value === 'null' ||
        value === 'undefined' ||
        value === null ||
        value === undefined
      ) {
        delete req.body[field]; // 필드를 요청 객체에서 제거
        return false; // 검증을 중단
      }
      return true;
    });
};

/**
 * 패턴 매칭을 위한 공통 함수
 * @param {object} validator - Express Validator 체인
 * @param {RegExp|string} pattern - 검증할 패턴
 * @param {string} field - 필드명
 * @param {string} message - 에러 메시지
 * @returns {object} - 검증 체인
 */
const applyPattern = (validator, pattern, field, message) => {
  if (typeof pattern === 'string') {
    return validator
      .matches(new RegExp(pattern))
      .withMessage(message || `${field}는 올바른 형식이어야 합니다.`);
  }

  if (pattern instanceof RegExp) {
    return validator
      .matches(pattern)
      .withMessage(message || `${field}는 올바른 형식이어야 합니다.`);
  }

  throw createError(400, 'pattern must be a string or RegExp');
};

module.exports = {
  optValidator,
  requiredValidator,
  applyPattern,
  requiredObjectValidator
};
