const { createValidator } = require('./validationUtils');

/**
 * [Optional] 문자열 파라미터 검증기
 */
const isOptStringBody = createValidator('body', 'string', true);

/**
 * [Optional] 날짜 파라미터 검증기
 */
const isOptDateBody = createValidator('body', 'date', true);

/**
 * [Optional] 숫자 파라미터 검증기
 */
const isOptNumericBody = createValidator('body', 'numeric', true);

/**
 * [Optional] 정수 파라미터 검증기
 */
const isOptIntBody = createValidator('body', 'int', true);

/**
 * [Optional] 참/거짓 파라미터 검증기
 */
const isOptBooleanBody = createValidator('body', 'boolean', true);

/**
 * [Optional] 허용되는 값 중 하나인지 검증기
 */
const isOptInBody = createValidator('body', 'in', true);

/**
 * [Optional] 이메일 파라미터 검증기
 */
const isOptEmailBody = createValidator('body', 'email', true);

/**
 * [Optional] 배열 파라미터 검증기
 */
const isOptArrayBody = createValidator('body', 'array', true);

/**
 * [Optional] 객체 파라미터 검증기
 */
const isOptObjectBody = createValidator('body', 'object', true);

/**
 * [Optional] 파일 검증 함수
 */
const isOptFileBody = createValidator('body', 'file', true);

module.exports = {
  isOptStringBody,
  isOptDateBody,
  isOptNumericBody,
  isOptIntBody,
  isOptBooleanBody,
  isOptInBody,
  isOptEmailBody,
  isOptArrayBody,
  isOptFileBody,
  isOptObjectBody,
};
