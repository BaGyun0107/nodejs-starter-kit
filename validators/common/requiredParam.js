const { createValidator } = require('./validationUtils');

/**
 * 문자열 파라미터 검증기
 */
const isStringParam = createValidator('param', 'string');

/**
 * 숫자 파라미터 검증기
 */
const isNumericParam = createValidator('param', 'numeric');

/**
 * 정수 파라미터 검증기
 */
const isIntParam = createValidator('param', 'int');

/**
 * 허용되는 값 중 하나인지 검증기
 */
const isInParam = createValidator('param', 'in');

module.exports = {
  isStringParam,
  isNumericParam,
  isIntParam,
  isInParam,
};
