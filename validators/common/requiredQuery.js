const { query } = require('express-validator');
const { requiredValidator, applyPattern } = require('./validationUtils');

/**
 * 문자열 파라미터 검증기
 * @param {string} field - 필드명
 * @param {object} [options] - 추가 옵션
 * @param {RegExp|string} [options.pattern] - 검증할 패턴 (정규 표현식 또는 문자열)
 * @param {string} [options.message] - 커스텀 에러 메시지
 * @returns {object} - Express Validator 체인
 */
const isStringQuery = (field, options = {}) => {
  const { pattern, message } = options;
  const defaultPattern = /^[^<>'"\\;`%{}$]*$/u; // XSS 및 SQL 인젝션 취약 문자들을 제외

  const validatorPattern = pattern || defaultPattern;

  let validator = query(field);

  // 필수 검증기
  validator = requiredValidator(validator, field);

  // 문자열 검증기
  validator = validator
    .isString()
    .withMessage(`${field}는 문자열이어야 합니다.`);

  // 패턴 검증기
  validator = applyPattern(validator, validatorPattern, field, message);

  return validator;
};

/**
 * 숫자 파라미터 검증기
 * @param {string} field - 필드명
 * @param {object} [options] - 추가 옵션
 * @param {RegExp|string} [options.pattern] - 검증할 패턴 (정규 표현식 또는 문자열)
 * @param {string} [options.message] - 커스텀 에러 메시지
 * @returns {object} - Express Validator 체인
 */
const isNumericQuery = (field, options = {}) => {
  const { pattern, message } = options;
  const defaultPattern = /^[0-9]+$/;

  const validatorPattern = pattern || defaultPattern;

  let validator = query(field);

  // 필수 검증기
  validator = requiredValidator(validator, field);

  // 숫자 검증기
  validator = validator
    .isNumeric()
    .withMessage(`${field}는 숫자이어야 합니다.`);

  // 패턴 검증기
  validator = applyPattern(validator, validatorPattern, field, message);

  return validator;
};

/**
 * 정수 파라미터 검증기
 * @param {string} field - 필드명
 * @param {object} [options] - 추가 옵션
 * @param {RegExp|string} [options.pattern] - 검증할 패턴 (정규 표현식 또는 문자열)
 * @param {string} [options.message] - 커스텀 에러 메시지
 * @returns {object} - Express Validator 체인
 */
const isIntQuery = (field, options = {}) => {
  const { pattern, message } = options;
  const defaultPattern = /^[0-9]+$/;

  const validatorPattern = pattern || defaultPattern;

  let validator = query(field);

  // 필수 검증기
  validator = requiredValidator(validator, field);

  // 정수 검증기
  validator = validator
    .isInt({ min: 0 })
    .withMessage(`${field}는 0 이상의 정수이어야 합니다.`)
    .toInt();

  // 패턴 검증기
  validator = applyPattern(validator, validatorPattern, field, message);

  return validator;
};

/**
 * 허용되는 값 중 하나인지 검증기
 * @param {string} field - 필드명
 * @param {Array} values - 허용되는 값의 배열
 * @param {object} [options] - 추가 옵션
 * @param {string} [options.message] - 커스텀 에러 메시지
 * @returns {object} - Express Validator 체인
 */
const isInQuery = (field, values) => {
  let validator = query(field);

  // 필수 검증기
  validator = requiredValidator(validator, field);

  // 배열 검증기
  validator = validator
    .isIn(values)
    .withMessage(`${field}는 [${values.join(', ')}] 중 하나여야 합니다.`);

  return validator;
};

/**
 * [Optional] 날짜 파라미터 검증기
 * @param {string} field - 필드명
 * @param {object} [options] - 추가 옵션
 * @param {RegExp|string} [options.pattern] - 검증할 패턴 (정규 표현식 또는 문자열)
 * @param {string} [options.message] - 커스텀 에러 메시지
 * @returns {object} - Express Validator 체인
 */
const isDateQuery = (field, options = {}) => {
  const { pattern, message } = options;
  let validator = query(field);

  // Opt 공용 검증기
  validator = requiredValidator(validator, field);

  // 날짜 검증기
  validator = validator
    .isDate()
    .withMessage(`${field}는 날짜형식이어야 합니다.`);

  if (pattern) {
    validator = applyPattern(validator, pattern, field, message);
  }

  return validator;
};

module.exports = {
  isStringQuery,
  isNumericQuery,
  isIntQuery,
  isInQuery,
  isDateQuery
};
