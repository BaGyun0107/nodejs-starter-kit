/**
 * 객체나 배열에서 `null` 값이 포함된 항목을 제거하는 재귀 함수
 * @param {Object|Array} obj - 입력 객체 또는 배열
 * @returns {Object|Array|null} - `null` 값이 제거된 객체 또는 배열
 * @description 재귀 함수로 객체 또는 배열의 모든 항목을 확인하고 `null` 값이 포함된 항목을 제거합니다.
 * @warning sequelize 리턴값에 쓸거면 raw: true, nest: true(선택) 옵션 추가할 것
 */
function removeNullFields(obj) {
  // 배열인 경우 모든 항목이 `null` 인 경우 배열 자체가 제거됩니다.
  if (Array.isArray(obj)) {
    return obj.map(removeNullFields).filter((item) => {
      return item !== null;
    });
  }

  // 객체인 경우 모든 항목이 `null` 인 경우 객체 자체가 제거됩니다.
  if (typeof obj === 'object' && obj !== null) {
    const cleanedObj = Object.fromEntries(
      Object.entries(obj)
        .map(([key, value]) => {
          return [key, removeNullFields(value)];
        })
        .filter(([_, value]) => {
          return value !== null && value !== undefined;
        })
    );
    return Object.keys(cleanedObj).length > 0 ? cleanedObj : null;
  }
  // 기본 타입인 경우 그대로 반환
  return obj;
}

module.exports = removeNullFields;
