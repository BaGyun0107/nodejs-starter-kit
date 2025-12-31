const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const CSRF_TOKEN_SECRET = process.env.CSRF_TOKEN_SECRET;

const ACCESS_TOKEN_EXPIRES_IN = '10m';
const CSRF_TOKEN_EXPIRES_IN = '10m';
const REFRESH_TOKEN_EXPIRES_IN_DEFAULT = '7d';
const REFRESH_TOKEN_EXPIRES_IN_LONG = '365d';

const generateAccessToken = (payload) => {
  const tokenPayload =
    typeof payload === 'string'
      ? { uuid: payload }
      : { uuid: payload.id, ...payload };
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET is not defined');
  }

  return jwt.sign(tokenPayload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

const generateCSRFToken = () => {
  if (!CSRF_TOKEN_SECRET) {
    throw new Error('CSRF_TOKEN_SECRET is not defined');
  }

  return jwt.sign({ key: uuidv4() }, CSRF_TOKEN_SECRET, {
    expiresIn: CSRF_TOKEN_EXPIRES_IN,
  });
};

const generateRefreshToken = (userId, rememberMe = false) => {
  const expiresIn = rememberMe
    ? REFRESH_TOKEN_EXPIRES_IN_LONG
    : REFRESH_TOKEN_EXPIRES_IN_DEFAULT;

  if (!REFRESH_TOKEN_SECRET) {
    throw new Error('REFRESH_TOKEN_SECRET is not defined');
  }

  return jwt.sign({ uuid: userId }, REFRESH_TOKEN_SECRET, { expiresIn });
};

const verifyAccessToken = (token) => {
  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    return { payload, expired: false, error: null };
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return { payload: null, expired, error };
  }
};

const verifyRefreshToken = (token) => {
  try {
    const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
    return { payload, expired: false, error: null };
  } catch (error) {
    const expired = error.name === 'TokenExpiredError';
    return { payload: null, expired, error };
  }
};

const verifyCSRFToken = (token) => {
  try {
    return jwt.verify(token, CSRF_TOKEN_SECRET);
  } catch {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateCSRFToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifyCSRFToken,
};
