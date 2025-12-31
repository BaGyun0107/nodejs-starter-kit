/**
 * Request Timeout Middleware
 * DDoS 및 Slowloris 공격 방어
 */
const requestTimeout = (req, res, next) => {
  const timeout = parseInt(process.env.REQUEST_TIMEOUT, 10) || 30000; // 기본 30초

  // 요청 타임아웃 설정
  req.setTimeout(timeout, () => {
    console.warn(
      `[Timeout] Request from ${req.ip} timed out after ${timeout}ms`
    );

    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        status: 408,
        message: '요청 시간이 초과되었습니다.'
      });
    }
  });

  // 응답 타임아웃 설정
  res.setTimeout(timeout, () => {
    console.warn(
      `[Timeout] Response to ${req.ip} timed out after ${timeout}ms`
    );

    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        status: 503,
        message: '서버 응답 시간이 초과되었습니다.'
      });
    }
  });

  next();
};

module.exports = requestTimeout;
