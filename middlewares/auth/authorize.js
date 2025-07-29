const createError = require('../../utils/common/error');

/**
 * 사용자 헤더의 키값을 확인 및 비교
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
const authorize = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || authorization !== process.env.API_AUTH_KEY) {
    return next(createError(401, '권한이 없습니다.'));
  }

  return next();
};

module.exports = { authorize };
