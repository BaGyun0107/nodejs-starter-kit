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

const { accessLog, errorLog } = require('./log-manager');

const { krDate } = require('./utils/common/krDate');

const { gracefulShutdown } = require('./utils/common/gracefulShutdown');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { socketIo } = require('./utils/common/socketIo');

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
    stream: accessLog
  })
);

// Morgan 미들웨어 설정 (Error 로그)
app.use(
  morgan(customMorganFormat, {
    // 에러 로그는 400 미만 상태 코드는 로그에 기록하지 않음
    skip: (req, res) => res.statusCode < 400,
    stream: errorLog
  })
);

// CORS 설정
// cors 허용 도메인
let allowedOrigins = [];

// allowedOrigins 정규표현식은, http, https, 서브도메인 허용 하기 위해 작성
if (env === 'development' || env === 'local') {
  // 개발 환경
  allowedOrigins = [
    'http://localhost:3000',
    /^https?:\/\/([a-z0-9-]+\.)*{HOST}\.com$/i
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
    'X-Refresh-Token'
  ], // 허락하고자 하는 헤더
  exposedHeaders: ['content-disposition', 'X-Access-Token', 'X-Refresh-Token'], // 클라이언트에게 응답 헤더로 보낼 수 있는 헤더
  credentials: true
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
        frameAncestors: ["'self'", 'https://{HOST}.com']
      }
    }
  })
);
// xss 공격 방지
app.use(xss());

// 해당 환경의 .env 파일 로드
const envFilePath = `./.env.${env}`;
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
  console.log(`환경변수 ${envFilePath} 파일 로드 완료`);
}

const config = require('./config/config')[env];

// 데이터베이스 연결
const db = mysql.createConnection({
  host: config.host,
  user: config.username,
  password: config.password,
  database: config.database
});
db.connect((err) => {
  if (err) {
    console.error(err);
  } else {
    console.log('DB 연결 성공');
  }
});

// cookie-parser
app.use(cookieParser());

// body-parser
app.use(express.json());

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
      message: errorMessage
    });
  }

  // 스택은 오류 발생 시 생성된 추적 정보이니, 개발환경에서만 출력
  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: err.stack
  });
});

server.listen(config.port, () => {
  console.log(`PORT:${config.port} 서버 정상 작동`);
});

// // socket 사용 시 주석 해제
// socketIo(server);

// 서버 종료 처리
gracefulShutdown(server, db, errorLog);
