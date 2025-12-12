const { body, query, param } = require('express-validator');
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

/**
 * 검증기 생성 팩토리 함수
 * @param {string} sourceType - 'body', 'query', 'param'
 * @param {string} type - 검증할 데이터 타입 ('string', 'numeric', 'int', 'date', 'boolean', 'email', 'array', 'object', 'file', 'in')
 * @param {boolean} isOptional - 필수 여부 (default: false)
 * @returns {function} - (field, options) => Middleware
 */
const createValidator = (sourceType, type, isOptional = false) => {
  return (field, options = {}) => {
    const {
      pattern,
      message,
      if: ifCondition,
      emptyMessage,
      values,
      allowedMimeTypes,
      maxSize,
    } = options;
    const defaultStringPattern = /^[^<>'"\\;`%{}$]*$/u;
    const defaultNumericPattern = /^[0-9]+$/;
    const defaultIntPattern = /^[0-9]+$/;

    // 1. 소스 선택
    let validator;
    if (sourceType === 'body') validator = body(field);
    else if (sourceType === 'query') validator = query(field);
    else if (sourceType === 'param') validator = param(field);
    else throw new Error(`Invalid source type: ${sourceType}`);

    // 2. 조건부 실행 (if)
    if (ifCondition && typeof ifCondition === 'function') {
      validator = validator.if(ifCondition);
    }

    // 3. 필수/옵션 처리
    if (isOptional) {
      validator = optValidator(validator, field);
    } else {
      if (type === 'object' || type === 'array' || type === 'objectArray') {
        validator = requiredObjectValidator(validator, field);
      } else {
        validator = requiredValidator(validator, field, emptyMessage);
      }
    }

    // 4. 타입별 검증 로직
    switch (type) {
      case 'string':
        validator = validator
          .isString()
          .withMessage(`${field}는 문자열이어야 합니다.`);
        validator = applyPattern(
          validator,
          pattern || defaultStringPattern,
          field,
          message,
        );
        break;

      case 'numeric':
        // Optional 이면서 빈 값 허용 (isOptNumericBody 로직 반영)
        if (isOptional) {
          validator = validator
            .matches(/^(?:[0-9]*|)$/)
            .withMessage(`${field}는 숫자 또는 빈 값이어야 합니다.`);
        } else {
          validator = validator
            .isNumeric()
            .withMessage(`${field}는 숫자이어야 합니다.`);
        }
        if (pattern)
          validator = applyPattern(validator, pattern, field, message);
        else if (!isOptional)
          validator = applyPattern(
            validator,
            defaultNumericPattern,
            field,
            message,
          );
        break;

      case 'int':
        validator = validator
          .isInt({ min: 0 })
          .withMessage(`${field}는 0 이상의 정수이어야 합니다.`)
          .toInt();
        if (pattern)
          validator = applyPattern(validator, pattern, field, message);
        else if (!isOptional)
          validator = applyPattern(
            validator,
            defaultIntPattern,
            field,
            message,
          );
        else if (isOptional)
          validator = applyPattern(validator, /^[0-9]*$/, field, message); // optInt default pattern
        break;

      case 'date':
        validator = validator
          .isDate()
          .withMessage(`${field}는 날짜형식이어야 합니다.`);
        if (pattern)
          validator = applyPattern(validator, pattern, field, message);
        break;

      case 'boolean':
        validator = validator.customSanitizer((value) => {
          if (value === true || value === 'true' || value === 1) return 1;
          if (value === false || value === 'false' || value === 0) return 0;
          throw createError(400, `${field}는 참/거짓이어야 합니다.`);
        });
        break;

      case 'email':
        validator = validator
          .isEmail()
          .withMessage(`${field}는 이메일 형식이어야 합니다.`);
        break;

      case 'array':
        validator = validator
          .isArray()
          .withMessage(`${field}는 배열이어야 합니다.`);
        break;

      case 'objectArray':
        validator = validator
          .isArray()
          .withMessage(`${field}는 배열이어야 합니다.`);
        break;

      case 'object':
        validator = validator.custom((value) => {
          if (
            typeof value !== 'object' ||
            Array.isArray(value) ||
            value === null
          ) {
            throw createError(400, `${field}는 객체여야 합니다.`);
          }
          return true;
        });
        break;

      case 'in':
        if (!values || !Array.isArray(values))
          throw new Error('Values array is required for "in" validator');
        validator = validator
          .isIn(values)
          .withMessage(`${field}는 [${values.join(', ')}] 중 하나여야 합니다.`);
        break;

      case 'file':
        validator = validator.custom((value, { req }) => {
          let fileData;
          if (req.file) fileData = req.file;
          else if (req.files) fileData = req.files[field];

          // Optional 이고 파일 없으면 통과
          if (isOptional) {
            if (!fileData || (Array.isArray(fileData) && fileData.length === 0))
              return true;
          } else {
            if (
              !fileData ||
              (Array.isArray(fileData) && fileData.length === 0)
            ) {
              throw createError(
                400,
                message || `${field} 파일이 업로드되지 않았습니다.`,
              );
            }
          }

          const files = Array.isArray(fileData) ? fileData : [fileData];
          for (const file of files) {
            if (allowedMimeTypes && !allowedMimeTypes.includes(file.mimetype)) {
              throw createError(
                400,
                message || `${field} 파일 형식이 올바르지 않습니다.`,
              );
            }
            if (maxSize && file.size > maxSize) {
              throw createError(
                400,
                message || `${field} 파일 크기가 너무 큽니다.`,
              );
            }
          }
          return true;
        });
        break;

      default:
        throw new Error(`Unknown validator type: ${type}`);
    }

    return validator;
  };
};

module.exports = {
  optValidator,
  requiredValidator,
  applyPattern,
  requiredObjectValidator,
  createValidator,
};
