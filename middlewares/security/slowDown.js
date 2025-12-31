const slowDown = require('express-slow-down');

/**
 * Slow Down Middleware
 * Rate limit 도달 전 점진적으로 요청을 지연시켜 DDoS 완화
 */
const slowDownLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15분
  delayAfter: parseInt(process.env.SLOW_DOWN_DELAY_AFTER, 10) || 50, // 50 요청 후 지연 시작
  delayMs: (hits) => {
    return hits * 100;
  }, // 요청마다 100ms씩 증가
  maxDelayMs: parseInt(process.env.SLOW_DOWN_MAX_DELAY, 10) || 5000, // 최대 5초
  skipSuccessfulRequests: false,
  skipFailedRequests: false
  // keyGenerator 제거 - 라이브러리 기본값 사용 (IPv6 안전)
});

module.exports = slowDownLimiter;
