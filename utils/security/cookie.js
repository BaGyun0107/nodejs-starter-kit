// cookie 이름
const ACCESS_TOKEN_COOKIE = 'app-at';
const REFRESH_TOKEN_COOKIE = 'app-rt';
const CSRF_TOKEN_COOKIE = 'app-csrf';

// cookie 유효기간
const ACCESS_TOKEN_MAX_AGE = 1000 * 60 * 10; // 10 minutes
const CSRF_TOKEN_MAX_AGE = 1000 * 60 * 10; // 10 minutes
const REFRESH_TOKEN_MAX_AGE_DEFAULT = 1000 * 60 * 60 * 24 * 7; // 7 days
const REFRESH_TOKEN_MAX_AGE_LONG = 1000 * 60 * 60 * 24 * 365; // 1 year

const getAuthTokens = (req) => {
  const accessToken = req.cookies[ACCESS_TOKEN_COOKIE];
  const refreshToken = req.cookies[REFRESH_TOKEN_COOKIE];
  const csrfToken = req.cookies[CSRF_TOKEN_COOKIE];
  return { accessToken, refreshToken, csrfToken };
};

const setAuthCookies = (res, token, rememberMe = false, req = null) => {
  const { accessToken, refreshToken, csrfToken } = token;

  const isHTTPS =
    process.env.NODE_ENV === 'production' ||
    (req &&
      (req.headers['x-forwarded-proto'] === 'https' ||
        req.headers['x-forwarded-ssl'] === 'on'));

  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

  const commonOptions = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    domain: cookieDomain,
    secure: !!isHTTPS,
  };

  // Access Token
  res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
    ...commonOptions,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  // CSRF Token (httpOnly: false)
  res.cookie(CSRF_TOKEN_COOKIE, csrfToken, {
    ...commonOptions,
    httpOnly: false,
    maxAge: CSRF_TOKEN_MAX_AGE,
  });

  // Refresh Token
  res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
    ...commonOptions,
    maxAge: rememberMe
      ? REFRESH_TOKEN_MAX_AGE_LONG
      : REFRESH_TOKEN_MAX_AGE_DEFAULT,
  });
};

const clearAuthCookies = (res) => {
  const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
  const commonOptions = {
    path: '/',
    domain: cookieDomain,
  };

  res.clearCookie(ACCESS_TOKEN_COOKIE, commonOptions);
  res.clearCookie(REFRESH_TOKEN_COOKIE, commonOptions);
  res.clearCookie(CSRF_TOKEN_COOKIE, commonOptions);
};

module.exports = {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  CSRF_TOKEN_COOKIE,
  getAuthTokens,
  setAuthCookies,
  clearAuthCookies,
};
