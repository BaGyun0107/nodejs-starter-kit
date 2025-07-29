const { v4: uuidv4 } = require('uuid');

/**
 * 랜덤 uuid 생성 함수
 * @param {string} prefix - 접두사
 * @returns {string} 생성된 uuid
 */
const generateUUID = (prefix = '') => {
  return prefix ? `${prefix}-${uuidv4()}` : uuidv4();
};

module.exports = generateUUID;
