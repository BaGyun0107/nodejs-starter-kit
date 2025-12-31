/**
 * IP Filtering Middleware
 * 블랙리스트/화이트리스트 기반 IP 차단
 */

// 메모리 기반 블랙리스트 (재시작 시 초기화)
const blacklist = new Set();

// 실패 카운터 (IP별 인증 실패 횟수)
const failureCount = new Map();

/**
 * Whitelist에서 IP 확인
 */
const isWhitelisted = (ip) => {
  const whitelist = (process.env.IP_WHITELIST || '').split(',').map((item) => {
    return item.trim();
  });
  return whitelist.includes(ip) || ip === '::1' || ip === '127.0.0.1';
};

/**
 * Blacklist에서 IP 확인
 */
const isBlacklisted = (ip) => {
  return blacklist.has(ip);
};

/**
 * IP를 블랙리스트에 추가
 * @param {string} ip
 * @param {number} duration - 차단 시간 (ms), 0이면 영구
 */
const addToBlacklist = (ip, duration = 0) => {
  console.warn(
    `[IP Filter] Adding ${ip} to blacklist${duration ? ` for ${duration}ms` : ' permanently'}`
  );
  blacklist.add(ip);

  if (duration > 0) {
    setTimeout(() => {
      blacklist.delete(ip);
      console.info(`[IP Filter] Removed ${ip} from blacklist after timeout`);
    }, duration);
  }
};

/**
 * 실패 횟수 증가 및 자동 차단 확인
 */
const recordFailure = (ip) => {
  const count = (failureCount.get(ip) || 0) + 1;
  failureCount.set(ip, count);

  const threshold = parseInt(process.env.AUTO_BAN_THRESHOLD, 10) || 10;
  const banDuration = parseInt(process.env.AUTO_BAN_DURATION, 10) || 3600000; // 기본 1시간

  if (count >= threshold) {
    addToBlacklist(ip, banDuration);
    failureCount.delete(ip); // 카운터 리셋
    console.warn(
      `[IP Filter] IP ${ip} auto-banned after ${count} failures for ${banDuration}ms`
    );
  }
};

/**
 * 실패 카운터 리셋 (성공 시 호출)
 */
const resetFailureCount = (ip) => {
  failureCount.delete(ip);
};

/**
 * IP Filter Middleware
 */
const ipFilter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  // Whitelist는 항상 통과
  if (isWhitelisted(ip)) {
    return next();
  }

  // Blacklist는 차단
  if (isBlacklisted(ip)) {
    console.warn(`[IP Filter] Blocked request from blacklisted IP: ${ip}`);
    return res.status(403).json({
      success: false,
      status: 403,
      message: '접근이 차단되었습니다.'
    });
  }

  return next();
};

// 블랙리스트 수동 관리 함수 export
ipFilter.addToBlacklist = addToBlacklist;
ipFilter.recordFailure = recordFailure;
ipFilter.resetFailureCount = resetFailureCount;
ipFilter.isBlacklisted = isBlacklisted;
ipFilter.blacklist = blacklist; // 관리용

module.exports = ipFilter;
// trigger restart
