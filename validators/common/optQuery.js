const { createValidator } = require('./validationUtils');

/**
 * [Optional] 문자열 파라미터 검증기
 */
const isOptStringQuery = createValidator('query', 'string', true);

/**
 * [Optional] 숫자 파라미터 검증기
 */
const isOptNumericQuery = createValidator('query', 'numeric', true);

/**
 * [Optional] 정수 파라미터 검증기
 */
const isOptIntQuery = createValidator('query', 'int', true);

/**
 * [Optional] 허용되는 값 중 하나인지 검증기
 */
const isOptInQuery = createValidator('query', 'in', true);

/**
 * [Optional] 날짜 파라미터 검증기
 */
const isOptDateQuery = createValidator('query', 'date', true);

module.exports = {
  isOptStringQuery,
  isOptNumericQuery,
  isOptIntQuery,
  isOptInQuery,
  isOptDateQuery,
};
