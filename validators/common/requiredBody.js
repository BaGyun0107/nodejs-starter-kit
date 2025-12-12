const { createValidator } = require('./validationUtils');

/**
 * 문자열 파라미터 검증기
 */
const isStringBody = createValidator('body', 'string');

/**
 * 날짜 파라미터 검증기
 */
const isDateBody = createValidator('body', 'date');

/**
 * 숫자 파라미터 검증기
 */
const isNumericBody = createValidator('body', 'numeric');

/**
 * 정수 파라미터 검증기
 */
const isIntBody = createValidator('body', 'int');

/**
 * 허용되는 값 중 하나인지 검증기
 */
const isInBody = createValidator('body', 'in');

/**
 * 참/거짓 파라미터 검증기
 */
const isBooleanBody = createValidator('body', 'boolean');

/**
 * 이메일 파라미터 검증기
 */
const isEmailBody = createValidator('body', 'email');

/**
 * 배열 파라미터 검증기
 */
const isArrayBody = createValidator('body', 'array');

/**
 * 객체 배열 파라미터 검증기
 */
const isObjectArrayBody = createValidator('body', 'objectArray');

/**
 * 객체 파라미터 검증기
 */
const isObjectBody = createValidator('body', 'object');

/**
 * 파일 검증 함수
 */
const isFileBody = createValidator('body', 'file');

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
