const { createValidator } = require('./validationUtils');

/**
 * [Optional] 문자열 파라미터 검증기
 */
const isOptStringParam = createValidator('param', 'string', true);

/**
 * [Optional] 숫자 파라미터 검증기
 */
const isOptNumericParam = createValidator('param', 'numeric', true);

/**
 * [Optional] 정수 파라미터 검증기
 */
const isOptIntParam = createValidator('param', 'int', true);

/**
 * [Optional] 허용되는 값 중 하나인지 검증기
 */
const isOptInParam = createValidator('param', 'in', true);

/**
 * [Optional] 날짜 파라미터 검증기
 */
const isOptDateParam = createValidator('param', 'date', true);

module.exports = {
  isOptStringParam,
  isOptNumericParam,
  isOptIntParam,
  isOptInParam,
  isOptDateParam,
};
