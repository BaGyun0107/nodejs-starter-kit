require('dotenv').config();

const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const fs = require('fs');
const dotenv = require('dotenv');
const mysql = require('mysql2');
const helmet = require('helmet');
const morgan = require('morgan');
const xss = require('xss-clean');

// 시간 설정
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const { accessLog, errorLog } = require('./log-manager');

const { krDate } = require('./utils/common/krDate');

const { gracefulShutdown } = require('./utils/common/gracefulShutdown');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { socketIo } = require('./utils/common/socketIo');

dayjs.extend(utc);
dayjs.extend(timezone);

// UTC -> 한국시간으로 변환
Date.prototype.toJSON = function () {
  return dayjs(this).tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss');
};

// 배포환경에 따른 설정
const env = process.env.NODE_ENV || 'local';

morgan.token('korean-time', () => {
  const { koreanDate, koreanTime } = krDate();
  return `${koreanDate} ${koreanTime}`;
});

// 사용자 정의 토큰: 요청 값 (body, query, params)
morgan.token('req-body', (req) => JSON.stringify(req.body || {}));
morgan.token('req-query', (req) => JSON.stringify(req.query || {}));
morgan.token('req-params', (req) => JSON.stringify(req.params || {}));

// 사용자 정의 토큰: 응답 값
morgan.token('res-body', (req, res) => res._bodyLog || '');

// 응답 본문을 로그에 기록하기 위해 res.send 감싸기
app.use((req, res, next) => {
  const originalSend = res.send;

  res.send = function (body) {
    res._bodyLog = body; // 응답 본문 저장
    return originalSend.apply(res, arguments); // 원래의 res.send 호출
  };

  next();
});

// 커스텀 로그 포맷 정의
const customMorganFormat = `:remote-addr - :remote-user [:korean-time] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - req-body: :req-body - req-query: :req-query - req-params: :req-params - res-body: :res-body`;

// Morgan 미들웨어 설정 (Access 로그)
app.use(
  morgan(customMorganFormat, {
    // 요청 로그는 400 이상 상태 코드는 로그에 기록하지 않음
    skip: (req, res) => res.statusCode >= 400,
    stream: accessLog,
  }),
);

// Morgan 미들웨어 설정 (Error 로그)
app.use(
  morgan(customMorganFormat, {
    // 에러 로그는 400 미만 상태 코드는 로그에 기록하지 않음
    skip: (req, res) => res.statusCode < 400,
    stream: errorLog,
  }),
);

// CORS 설정
// cors 허용 도메인
let allowedOrigins = [];

// allowedOrigins 정규표현식은, http, https, 서브도메인 허용 하기 위해 작성
if (env === 'development' || env === 'local') {
  // 개발 환경
  allowedOrigins = [
    'http://localhost:3000',
    /^https?:\/\/([a-z0-9-]+\.)*{HOST}\.com$/i,
  ];
} else {
  // 배포 환경에서는 특정 도메인만 허용
  allowedOrigins = [];
}

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.some((allowedOrigin) => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        }
        return allowedOrigin.test(origin);
      })
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], // 허락하고자 하는 메소드
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Access-Token',
    'X-Refresh-Token',
  ], // 허락하고자 하는 헤더
  exposedHeaders: ['content-disposition', 'X-Access-Token', 'X-Refresh-Token'], // 클라이언트에게 응답 헤더로 보낼 수 있는 헤더
  credentials: true,
};

app.use(cors(corsOptions));

// helmet 이란?
// 보안 관련 헤더를 자동으로 설정해주는 라이브러리
// helmet 기본 적용이 아닌 app.js 에서 cors 설정한 것을 사용하기 위해 corssOriginResourcePolicy: false 옵션 추가
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        frameAncestors: ["'self'", 'https://{HOST}.com'],
      },
    },
  }),
);
// xss 공격 방지
app.use(xss());

// HTTP Parameter Pollution 방어
const hpp = require('hpp');
app.use(hpp());

// 보안 미들웨어 적용
const ipFilter = require('./middlewares/security/ipFilter');
const slowDownLimiter = require('./middlewares/security/slowDown');
const {
  globalLimiter,
  apiKeyLimiter,
} = require('./middlewares/security/rateLimiter');
const requestTimeout = require('./middlewares/security/requestTimeout');

// 적용 순서 중요!
app.use(ipFilter); // 1. IP 차단 (가장 먼저)
app.use(requestTimeout); // 2. 타임아웃 설정
app.use(slowDownLimiter); // 3. 점진적 지연
app.use(globalLimiter); // 4. 전역 Rate Limit
app.use(apiKeyLimiter); // 5. API Key별 Rate Limit

// 해당 환경의 .env 파일 로드
const envFilePath = `./.env.${env}`;
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
  console.log(`환경변수 ${envFilePath} 파일 로드 완료`);
}

const config = require('./config/config')[env];

// 데이터베이스 연결 풀 사용으로 변경
const dbPool = mysql.createPool({
  host: config.host,
  user: config.username,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 연결 테스트
dbPool.getConnection((err, connection) => {
  if (err) {
    console.error('DB 연결 실패:', err);
    process.exit(1);
  } else {
    console.log('DB 연결 성공');
    connection.release();
  }
});

// cookie-parser
app.use(cookieParser());

// body-parser (크기 제한 추가)
const MAX_REQUEST_SIZE = process.env.MAX_REQUEST_SIZE || '10mb';
app.use(express.json({ limit: MAX_REQUEST_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_REQUEST_SIZE }));

// 헬스체크 엔드포인트를 캐시 미들웨어 전에 배치
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 라우터
const routes = require('./routes');
routes(app);

//오류 처리
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || 'Somthing went wrong';
  if (env === 'production') {
    return res.status(errorStatus).json({
      success: false,
      status: errorStatus,
      message: errorMessage,
    });
  }

  // 스택은 오류 발생 시 생성된 추적 정보이니, 개발환경에서만 출력
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack,
  });
});

const port = config.port || 8080;

// 개선된 서버 시작 로직
async function startServer() {
  try {
    // 서버 리스닝 시작
    await new Promise((resolve, reject) => {
      server.listen(port, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log(`PORT:${port} 서버 정상 작동`);

    // PM2에 ready 신호 즉시 전송
    if (process.env.NODE_ENV === 'production' && process.send) {
      process.send('ready');
      console.log('PM2 ready 신호 전송 완료');
    }

    // const io = socketIo(server);

    // 서버 종료 처리
    gracefulShutdown(server, dbPool, errorLog, '', '', async () => {
      console.log('[App] 서버 종료 처리 완료');
    });
  } catch (error) {
    console.error('서버 시작 실패:', error);
    process.exit(1);
  }
}

// 서버 시작
startServer();
