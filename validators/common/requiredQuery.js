const { createValidator } = require('./validationUtils');

/**
 * 문자열 파라미터 검증기
 */
const isStringQuery = createValidator('query', 'string');

/**
 * 숫자 파라미터 검증기
 */
const isNumericQuery = createValidator('query', 'numeric');

/**
 * 정수 파라미터 검증기
 */
const isIntQuery = createValidator('query', 'int');

/**
 * 허용되는 값 중 하나인지 검증기
 */
const isInQuery = createValidator('query', 'in');

/**
 * 날짜 파라미터 검증기
 */
const isDateQuery = createValidator('query', 'date');

module.exports = {
  isStringQuery,
  isNumericQuery,
  isIntQuery,
  isInQuery,
  isDateQuery,
};
