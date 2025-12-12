const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const util = require('util');

// 로그 디렉토리 설정
const logDir = 'log';

// 커스텀 포맷
const printFormat = winston.format.printf(({ level, message }) => {
  return `${message}`;
});

/*
 * Log Level
 * error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6
 */

// 에러 레벨 제외 필터 (access.log는 성공 로그만, app.log는 error 포함할 것이므로 필요한 곳에만 적용)
const omitErrorFilter = winston.format((info, opts) => {
  return info.level === 'error' ? false : info;
})();

// HTTP Access 로그 전용 Transport (Morgan 연결) - 성공 로그만 (Error 제외)
const httpTransport = new DailyRotateFile({
  filename: `${logDir}/%DATE%/access.log`,
  auditFile: `${logDir}/.audit/access-audit.json`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
  format: winston.format.combine(omitErrorFilter, printFormat),
});

// App 로그 전용 Transport (일반 어플리케이션 로그) - 모든 레벨 포함 (Error 포함)
const appTransport = new DailyRotateFile({
  filename: `${logDir}/%DATE%/app.log`,
  auditFile: `${logDir}/.audit/app-audit.json`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  // format에서 필터 제거 (에러도 포함되어야 함)
});

// Error 로그 (Error 레벨만) - Morgan 에러 전용으로 변경
const errorTransport = new DailyRotateFile({
  filename: `${logDir}/%DATE%/error.log`,
  auditFile: `${logDir}/.audit/error-audit.json`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'error',
});

// HTTP 전용 Logger (Morgan에서 사용) -> access.log(성공) + error.log(실패)
const httpLogger = winston.createLogger({
  transports: [
    httpTransport, // info 레벨 (omitErrorFilter 적용됨)
    errorTransport, // error 레벨
  ],
  format: printFormat,
});

// 일반 Application Logger (console.log 대용) -> app.log (모든 로그)
const logger = winston.createLogger({
  transports: [
    appTransport, // App 전용 파일 하나에 다 몰아넣음
  ],
  format: printFormat,
});

// console.log -> logger.info -> app.log
// console.error -> logger.error -> app.log
// 오버라이딩 유지 (기존 코드 호환성)
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  const msg = util.format(...args);
  logger.info(msg);
};

console.info = console.log;

console.error = (...args) => {
  const msg = util.format(...args);
  logger.error(msg);
};

console.warn = console.error;

// Morgan용 스트림 어댑터 (httpLogger 사용)
const accessLog = {
  write: (message) => {
    httpLogger.info(message.trim());
  },
};

const errorLog = {
  write: (message) => {
    httpLogger.error(message.trim()); // Morgan 에러는 httpLogger를 통해 처리 -> error.log
  },
};

module.exports = { logger, accessLog, errorLog, httpLogger };
