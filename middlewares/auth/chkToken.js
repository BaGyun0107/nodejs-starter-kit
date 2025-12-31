const {
  generateAccessToken,
  generateRefreshToken,
  generateCSRFToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyCSRFToken,
} = require('../../utils/security/tokens');
const {
  getAuthTokens,
  setAuthCookies,
  clearAuthCookies,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} = require('../../utils/security/cookie');
const createError = require('../../utils/common/Error');

/**
 * 토큰 검증 미들웨어 (chkToken)
 *
 * 기능:
 * 1. Access Token 검증
 * 2. 만료 시 Refresh Token 검증 및 Access/Refresh Token 재발급 (Rotation)
 * 3. CSRF Token 검증 (GET/HEAD/OPTIONS 제외)
 * 4. 모바일 앱/개발 환경을 위한 헤더 기반 토큰 지원 (localat/localrt 등)
 */
const checkUserToken = async (req, res, next) => {
  try {
    const { method, headers } = req;

    // 1. 헤더에서 토큰 추출 (앱/개발 환경 지원)
    // 기존 chkToken 로직 유지: chkLocal(전역변수 추정) 또는 헤더 존재 시 쿠키로 매핑
    // 주의: chkLocal 변수가 어디서 왔는지 불분명하지만, 기존 코드에 있었으므로
    // 안전하게 헤더가 있으면 우선시하거나 쿠키에 주입하는 방식을 취함.
    // 여기서는 명시적으로 헤더를 확인하여 쿠키 값으로 간주합니다.

    // 로컬/앱 헤더가 있으면 req.cookies에 덮어씌움 (기존 로직 계승)
    const localAt = headers.localat || headers.appat; // 대소문자 유의 (Express headers are lowercase)
    const localRt = headers.localrt || headers.apprt;

    if (localAt) req.cookies[ACCESS_TOKEN_COOKIE] = localAt;
    if (localRt) req.cookies[REFRESH_TOKEN_COOKIE] = localRt;

    // 2. CSRF 검증
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const csrfHeader = headers['x-csrf-token'];
      const { csrfToken: csrfCookie } = getAuthTokens(req);

      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        console.log('[AUTH] CSRF Mismatch', {
          header: csrfHeader,
          cookie: csrfCookie,
        });
        throw createError(403, '토큰이 일치하지 않습니다.');
      }

      const verified = verifyCSRFToken(csrfHeader);
      if (!verified) {
        console.log('[AUTH] CSRF Verification Failed', { header: csrfHeader });
        throw createError(403, '유효하지 않은 CSRF 토큰입니다.');
      }
    }

    // 3. 토큰 가져오기
    const { accessToken, refreshToken } = getAuthTokens(req);

    // AccessToken 검증
    const { payload, expired } = verifyAccessToken(accessToken || '');

    // 유효한 Access Token이 있는 경우
    if (payload && payload.uuid) {
      req.user = payload; // req.userVerify 대신 req.user 사용 권장 (기존 호환성 위해 조치 필요시 수정)
      req.userVerify = payload; // 기존 코드 호환성 유지
      return next();
    }

    // Access Token이 없거나 만료된 경우 -> Refresh Token 확인
    if (expired || !accessToken) {
      if (!refreshToken) {
        // 둘 다 없으면 에러 (기존 chkToken은 '재로그인이 필요합니다!' 에러 발생)
        throw createError(401, '재로그인이 필요합니다!');
      }

      // Refresh Token 검증
      const { payload: refreshPayload } = verifyRefreshToken(refreshToken);

      if (refreshPayload && refreshPayload.uuid) {
        // Valid Refresh Token -> Rotate Tokens
        // console.log('[AUTH] Access Token expired. Rotating tokens.');

        // rememberMe 여부 판단 (기존 로직 참조: exp - iat > 8 days)
        const isRememberMe =
          refreshPayload.exp - refreshPayload.iat > 60 * 60 * 24 * 8;

        const newAccessToken = generateAccessToken(refreshPayload.uuid);
        const newRefreshToken = generateRefreshToken(
          refreshPayload.uuid,
          isRememberMe,
        );
        const newCsrfToken = generateCSRFToken();

        const tokens = {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          csrfToken: newCsrfToken,
        };

        setAuthCookies(res, tokens, isRememberMe, req);

        // 새 토큰 정보로 요청 객체 업데이트
        req.user = { uuid: refreshPayload.uuid };
        req.userVerify = { uuid: refreshPayload.uuid }; // 기존 호환성

        return next();
      } else {
        // Refresh Token도 유효하지 않음
        throw createError(401, '세션이 만료되었습니다. 다시 로그인해주세요.');
      }
    }

    // 그 외의 경우 (검증 실패 등)
    throw createError(401, '인증에 실패했습니다.');
  } catch (err) {
    // 에러 발생 시 쿠키 삭제
    clearAuthCookies(res);
    return next(err);
  }
};

module.exports = { chkToken: checkUserToken, checkUserToken };
