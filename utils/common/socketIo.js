const cluster = require('cluster');
const { Server } = require('socket.io');
const { setupWorker } = require('@socket.io/sticky');
const { createAdapter } = require('@socket.io/cluster-adapter');

let namespace = {};

const socketIo = (server) => {
  // 배포환경에 따른 설정
  const env = process.env.NODE_ENV || 'local';

  // CORS 설정
  // cors 허용 도메인
  let allowedOrigins = [];

  // allowedOrigins 정규표현식은, http, https, 서브도메인 허용 하기 위해 작성
  if (env === 'development' || env === 'local') {
    // 개발 환경
    allowedOrigins = [
      'http://localhost:3000',
      /^https?:\/\/([a-z0-9-]+\.)*{host}\.com$/i,
    ];
  } else {
    // 배포 환경에서는 특정 도메인만 허용
    allowedOrigins = [

    ];
  }

  const corsOptions = {
    origin: (origin, callback) => {
      // 요청에 origin이 없는 경우(예: 서버 간 통신)는 허용할 수 있음
      if (!origin) return callback(null, true);

      // allowedOrigins 배열에서 origin과 일치하는 항목이 있는지 검사
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin;
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  };

  const io = new Server(server, {
    cors: corsOptions
  });

  // 배포환경에서 pm2 로 실행된 각 여러 워커(클러스터) 간 소켓 연결을 공유하도록 설정
  if (!cluster.isMaster && cluster.worker) {
    console.log('socket-io check console');
    io.adapter(createAdapter());
    setupWorker(io);
  }

  return io;
};

const getNamespace = (name) => {
  if (!namespace[name]) {
    throw new Error(`${name} 네임스페이스가 존재하지 않습니다.`);
  }

  return namespace[name];
};

module.exports = { socketIo, getNamespace };
