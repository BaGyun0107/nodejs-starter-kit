/**
 * 숫자의 소수점 자릿수를 반환합니다
 * @param {number} num - 숫자
 * @returns {number} 소수점 자릿수
 */
const getDecimalPlaces = (num) => {
  const str = num.toString();
  if (str.indexOf('.') !== -1 && str.indexOf('e-') === -1) {
    return str.split('.')[1].length;
  } else if (str.indexOf('e-') !== -1) {
    const parts = str.split('e-');
    return parseInt(parts[1], 10);
  }
  return 0;
};

/**
 * 라운딩 모드(ceil, floor, round, trunc)를 옵션으로 제공하는 곱셈
 * @param {number} a - 첫 번째 숫자
 * @param {number} b - 두 번째 숫자
 * @param {Object} options - 옵션 객체
 * @param {string} options.mode - 'ceil' | 'floor' | 'round' | 'trunc'
 * @param {number} options.decimalPlaces - 소수점 자릿수 (기본값: 0)
 * @returns {number} 곱셈 후 라운딩된 결과
 */
const preciseMulMode = (
  a,
  b,
  {
    mode = 'round', // 'ceil' | 'floor' | 'round' | 'trunc'
    decimalPlaces = 0 // 소수 몇 자리까지?
  } = {}
) => {
  const raw = preciseMultiply(a, b);
  const factor = 10 ** decimalPlaces;
  let adjusted = raw * factor;

  // EPSILON 보정은 필요에 따라 추가
  switch (mode) {
    case 'ceil':
      // 소수점 자릿수 올림
      adjusted = Math.ceil(adjusted);
      break;
    case 'floor':
      // 소수점 자릿수 내림
      adjusted = Math.floor(adjusted);
      break;
    case 'round':
      // 소수점 자릿수 반올림
      adjusted = Math.round(adjusted);
      break;
    case 'trunc':
      // 소수점 자릿수 버림
      adjusted = Math.trunc(adjusted);
      break;
    default:
      throw new Error(`Unknown mode: ${mode}`);
  }

  return adjusted / factor;
};

/**
 * 두 숫자를 정확하게 더합니다
 * @param {number} a - 첫 번째 숫자
 * @param {number} b - 두 번째 숫자
 * @returns {number} 정확한 덧셈 결과
 */
const preciseAdd = (a, b) => {
  const places = Math.max(getDecimalPlaces(a), getDecimalPlaces(b));
  return (
    (Math.round(a * 10 ** places) + Math.round(b * 10 ** places)) / 10 ** places
  );
};

/**
 * 두 숫자를 정확하게 뺍니다
 * @param {number} a - 첫 번째 숫자
 * @param {number} b - 두 번째 숫자
 * @returns {number} 정확한 뺄셈 결과
 */
const preciseSub = (a, b) => {
  const places = Math.max(getDecimalPlaces(a), getDecimalPlaces(b));
  return (
    (Math.round(a * 10 ** places) - Math.round(b * 10 ** places)) / 10 ** places
  );
};

/**
 * 두 숫자를 정확하게 곱합니다
 * @param {number} a - 첫 번째 숫자
 * @param {number} b - 두 번째 숫자
 * @returns {number} 정확한 곱셈 결과
 */
const preciseMultiply = (a, b) => {
  const da = getDecimalPlaces(a);
  const db = getDecimalPlaces(b);
  const intA = Math.round(a * 10 ** da);
  const intB = Math.round(b * 10 ** db);
  return (intA * intB) / 10 ** (da + db);
};

/**
 * 두 숫자를 정확하게 나눕니다
 * @param {number} a - 첫 번째 숫자 (피제수)
 * @param {number} b - 두 번째 숫자 (제수)
 * @returns {number} 정확한 나눗셈 결과
 */
const preciseDivide = (a, b) => {
  if (b === 0) {
    throw new Error('0으로 나눌 수 없습니다.');
  }

  const aDecimalPlaces = getDecimalPlaces(a);
  const bDecimalPlaces = getDecimalPlaces(b);
  const aMultiplier = 10 ** aDecimalPlaces;
  const bMultiplier = 10 ** bDecimalPlaces;

  return Math.round(a * aMultiplier) / Math.round(b * bMultiplier);
};

/**
 * amount × (percent/100)을 정확하게 계산한 뒤, 선택적 라운딩
 * @param {number} amount - 기준 금액
 * @param {number} percent - 퍼센트 (예: 3% = 3)
 * @param {Object} opts - 라운딩 옵션 (선택사항)
 * @param {string} opts.mode - 라운딩 모드 'ceil'(올림) | 'floor'(내림) | 'round'(반올림) | 'trunc'(버림)
 * @param {number} opts.decimalPlaces - 소수점 자릿수
 * @returns {number} 퍼센트 계산 결과
 */
const calculatePercentage = (amount, percent, opts) => {
  const multiplier = percent / 100;
  return opts
    ? preciseMulMode(amount, multiplier, opts)
    : preciseMultiply(amount, multiplier);
};

/**
 * 여러 숫자를 정확하게 더합니다
 * @param {...number} numbers - 더할 숫자들
 * @returns {number} 정확한 덧셈 결과
 */
const preciseSum = (...numbers) => {
  return numbers.reduce((sum, num) => preciseAdd(sum, num), 0);
};

module.exports = {
  getDecimalPlaces,
  preciseAdd,
  preciseSub,
  preciseMultiply,
  preciseDivide,
  preciseMulMode,
  calculatePercentage,
  preciseSum
};
