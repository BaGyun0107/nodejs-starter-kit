const jwt = require('jsonwebtoken');

const { DeleteCookie } = require('../../services/auth/CookieUtilSvc');
const CreateError = require('../../utils/common/Error');

/**
 * 토큰 검증 미들웨어
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns {object}
 *
 * @description
 * 토큰을 검증하는 미들웨어 검증 실패시, 쿠키 삭제 및 에러 반환
 */
const chkToken = async (req, res, next) => {
  const { localat, localrt, appAt, appRt } = req.headers;

  // 로컬 환경일 경우, 클라이언트에서 헤더로 전달된 토큰을 req.cookies에 저장
  if (chkLocal) {
    if (localat) {
      req.cookies.ac = localat;
    }
    if (localrt) {
      req.cookies.re = localrt;
    }
  }

  // 웹뷰 환경일 경우, 클라이언트에서 헤더로 전달된 토큰을 req.cookies에 저장
  if (appAt) {
    req.cookies.ac = appAt;
  }
  if (appRt) {
    req.cookies.re = appRt;
  }

  const { ac, re } = req.cookies;

  try {
    if (!ac && !re) {
      // refreshToken, accessToken 모두 없는 경우
      throw CreateError(401, '재로그인이 필요합니다!');
    }

    if (!ac && re) {
      // accessToken이 없는 경우
      return next();
    }

    // userVerify 토큰 검증
    const userVerify = jwt.verify(ac, 'key', (err, data) => {
      if (err) {
        return null;
      }

      return data;
    });

    // 토큰 검증 실패 시, 토큰 재발급
    if (!userVerify && re) {
      return next();
    }

    req.userVerify = userVerify;
    return next();
  } catch (err) {
    // 쿠키 삭제
    DeleteCookie(res, 'ac');
    DeleteCookie(res, 're');

    return next(err);
  }
};

module.exports = { chkToken };
