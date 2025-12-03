const { body } = require('express-validator');
const {
  requiredValidator,
  requiredObjectValidator,
  applyPattern,
} = require('./validationUtils');
const createError = require('../../utils/common/error');

/**
 * 문자열 파라미터 검증기
 * @param {string} field - 필드명
 * @param {object} [options] - 추가 옵션
 * @param {RegExp|string} [options.pattern] - 검증할 패턴 (정규 표현식 또는 문자열)
 * @param {string} [options.message] - 커스텀 에러 메시지
 * @returns {object} - Express Validator 체인
 */
const isStringBody = (field, options = {}) => {
  const { pattern, message, if: ifCondition, emptyMessage } = options;
  const defaultPattern = /^[^<>'"\\;`%{}$]*$/u; // XSS 및 SQL 인젝션 취약 문자들을 제외

  const validatorPattern = pattern || defaultPattern;

  let validator = body(field);

  if (ifCondition && typeof ifCondition === 'function') {
    validator = validator.if(ifCondition);
  }

  // 필수 검증기
  validator = requiredValidator(validator, field, emptyMessage);

  // 문자열 검증기
  validator = validator
    .isString()
    .withMessage(`${field}는 문자열이어야 합니다.`);

  // 패턴 검증기
  validator = applyPattern(validator, validatorPattern, field, message);

  return validator;
};

/**
 * 날짜 파라미터 검증기
 * @param {string} field - 필드명
 * @param {object} [options] - 추가 옵션
 * @param {RegExp|string} [options.pattern] - 검증할 패턴 (정규 표현식 또는 문자열)
 * @param {string} [options.message] - 커스텀 에러 메시지
 * @returns {object} - Express Validator 체인
 */
const isDateBody = (field, options = {}) => {
  const { pattern, message, if: ifCondition } = options;
  let validator = body(field);

  if (ifCondition && typeof ifCondition === 'function') {
    validator = validator.if(ifCondition);
  }

  // 필수 검증기
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

/**
 * 숫자 파라미터 검증기
 * @param {string} field - 필드명
 * @param {object} [options] - 추가 옵션
 * @param {RegExp|string} [options.pattern] - 검증할 패턴 (정규 표현식 또는 문자열)
 * @param {string} [options.message] - 커스텀 에러 메시지
 * @returns {object} - Express Validator 체인
 */
const isNumericBody = (field, options = {}) => {
  const { pattern, message, if: ifCondition } = options;
  const defaultPattern = /^[0-9]+$/;

  const validatorPattern = pattern || defaultPattern;

  let validator = body(field);

  if (ifCondition && typeof ifCondition === 'function') {
    validator = validator.if(ifCondition);
  }

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
const isIntBody = (field, options = {}) => {
  const { pattern, message, if: ifCondition } = options;
  const defaultPattern = /^[0-9]+$/;

  const validatorPattern = pattern || defaultPattern;

  let validator = body(field);

  if (ifCondition && typeof ifCondition === 'function') {
    validator = validator.if(ifCondition);
  }

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
 * @returns {object} - Express Validator 체인
 */
const isInBody = (field, values) => {
  let validator = body(field);

  // 필수 검증기
  validator = requiredValidator(validator, field);

  // 배열 검증기
  validator = validator
    .isIn(values)
    .withMessage(`${field}는 [${values.join(', ')}] 중 하나여야 합니다.`);

  return validator;
};

/**
 * 참/거짓 파라미터 검증기
 * @param {string} field - 필드명
 * @returns {object} - Express Validator 체인
 */
const isBooleanBody = (field) => {
  let validator = body(field);

  // 필수 검증기
  validator = requiredValidator(validator, field);

  // 불리언 검증기
  validator = validator.customSanitizer((value) => {
    if (value === true || value === 'true' || value === 1) return 1;
    if (value === false || value === 'false' || value === 0) return 0;
    throw createError(400, `${field}는 참/거짓이어야 합니다.`);
  });

  return validator;
};

/**
 * 정수 파라미터 검증기
 * @param {string} field - 필드명
 * @returns {object} - Express Validator 체인
 */
const isEmailBody = (field, options = {}) => {
  const { if: ifCondition } = options;
  let validator = body(field);

  if (ifCondition && typeof ifCondition === 'function') {
    validator = validator.if(ifCondition);
  }

  // 필수 검증기
  validator = requiredValidator(validator, field);

  // 이메일 검증기
  validator = validator
    .isEmail()
    .withMessage(`${field}는 이메일 형식이어야 합니다.`);

  return validator;
};

/**
 * 배열 파라미터 검증기
 * @param {string} field - 필드명
 * @returns {object} - Express Validator 체인
 */
const isArrayBody = (field, options = {}) => {
  const { if: ifCondition } = options;
  let validator = body(field);

  // 필수 검증기
  validator = requiredValidator(validator, field);

  if (ifCondition && typeof ifCondition === 'function') {
    validator = validator.if(ifCondition);
  }

  // 배열 검증기
  validator = validator.isArray().withMessage(`${field}는 배열이어야 합니다.`);

  return validator;
};

/**
 * 객체 배열 파라미터 검증기 : isArrayBody 사용시 배열 내 요소가 string 타입으로 변환되어 검증되므로, 객체 타입으로 검증하기 위해 사용
 * @param {string} field - 필드명
 * @returns {object} - Express Validator 체인
 */
const isObjectArrayBody = (field, options = {}) => {
  const { if: ifCondition } = options;
  let validator = body(field);

  // 필수 검증기
  validator = requiredObjectValidator(validator, field);

  if (ifCondition && typeof ifCondition === 'function') {
    validator = validator.if(ifCondition);
  }

  // 배열 검증기
  validator = validator.isArray().withMessage(`${field}는 배열이어야 합니다.`);

  return validator;
};

/**
 * 객체 파라미터 검증기
 * @param {string} field - 필드명
 * @returns {object} - Express Validator 체인
 */
const isObjectBody = (field, options = {}) => {
  const { if: ifCondition } = options;
  let validator = body(field);

  if (ifCondition && typeof ifCondition === 'function') {
    validator = validator.if(ifCondition);
  }

  // 객체 검증기
  validator = validator.custom((value) => {
    if (typeof value !== 'object' || Array.isArray(value) || value === null) {
      throw createError(400, `${field}는 객체여야 합니다.`);
    }
    return true;
  });

  return validator;
};

/**
 * 필수 파일 검증 함수
 *
 * @param {string} field - req.files 내에 파일이 들어있는 필드명
 * @param {object} [options] - 추가 옵션
 * @param {string[]} [options.allowedMimeTypes] - 허용할 MIME 타입 배열 (예: ['image/jpeg', 'image/png'])
 * @param {number} [options.maxSize] - 허용할 최대 파일 크기 (바이트 단위)
 * @param {string} [options.message] - 커스텀 에러 메시지
 * @returns {object} - Express Validator 체인
 */
const isFileBody = (field, options = {}) => {
  const { allowedMimeTypes, maxSize, message } = options;
  return body(field).custom((value, { req }) => {
    let fileData;
    if (!req.file) {
      fileData = req.files ? req.files[field] : undefined;
    } else {
      fileData = req.file ?? undefined;
    }

    // 파일이 반드시 존재해야 합니다.
    if (!fileData || (Array.isArray(fileData) && fileData.length === 0)) {
      throw createError(
        400,
        message || `${field} 파일이 업로드되지 않았습니다.`,
      );
    }

    // 파일이 있다면 배열로 처리하여 각 파일에 대해 검증
    const files = Array.isArray(fileData) ? fileData : [fileData];
    for (const file of files) {
      if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
        throw createError(
          400,
          message || `${field} 파일 형식이 올바르지 않습니다.`,
        );
      }
      if (maxSize && file.size > maxSize) {
        throw createError(400, message || `${field} 파일 크기가 너무 큽니다.`);
      }
    }
    return true;
  });
};

module.exports = {
  isStringBody,
  isDateBody,
  isNumericBody,
  isIntBody,
  isInBody,
  isBooleanBody,
  isEmailBody,
  isArrayBody,
  isObjectBody,
  isFileBody,
  isObjectArrayBody,
};
