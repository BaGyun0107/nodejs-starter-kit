const rateLimit = require('express-rate-limit');

/**
 * 전역 Rate Limiter
 * IP 기반 요청 빈도 제한
 */
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100, // IP당 100 요청
  message: {
    success: false,
    status: 429,
    message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true, // RateLimit-* 헤더 반환
  legacyHeaders: false, // X-RateLimit-* 헤더 비활성화
  skipSuccessfulRequests: false, // 성공한 요청도 카운트
  skipFailedRequests: false, // 실패한 요청도 카운트
  // keyGenerator 제거 - 라이브러리 기본값 사용 (IPv6 안전)
  // 커스텀 핸들러
  handler: (req, res) => {
    console.warn(`[Rate Limit] IP ${req.ip} exceeded rate limit`);
    res.status(429).json({
      success: false,
      status: 429,
      message: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.'
    });
  }
});

/**
 * 인증 엔드포인트용 엄격한 Rate Limiter
 * 브루트포스 공격 방어
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 5, // IP당 5회
  message: {
    success: false,
    status: 429,
    message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.'
  },
  skipSuccessfulRequests: true, // 성공한 요청은 카운트 제외
  // keyGenerator 제거 - 라이브러리 기본값 사용 (IPv6 안전)
  handler: (req, res) => {
    console.warn(`[Auth Rate Limit] IP ${req.ip} exceeded auth attempt limit`);
    res.status(429).json({
      success: false,
      status: 429,
      message: '로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.'
    });
  }
});

/**
 * API Key별 Rate Limiter
 * API 사용량 제한 (provider 헤더 기반)
 */
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1분
  max: parseInt(process.env.RATE_LIMIT_API_KEY_MAX, 10) || 30, // provider당 30 req/min
  message: {
    success: false,
    status: 429,
    message: 'API 호출 한도를 초과했습니다.'
  },
  keyGenerator: (req) => {
    // provider 헤더로만 그룹핑 (IP 사용 안 함)
    return req.headers.provider || 'no-provider';
  },
  skip: (req) => {
    // provider 헤더가 없으면 스킵 (globalLimiter가 처리)
    return !req.headers.provider;
  }
});

module.exports = {
  globalLimiter,
  authLimiter,
  apiKeyLimiter
};
