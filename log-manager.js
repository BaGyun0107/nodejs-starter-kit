const fs = require('fs');
const path = require('path');
const schedule = require('node-schedule');

const cluster = require('cluster');

const { krDate } = require('./utils/common/krDate');

// 현재 로그 파일 스트림들
let errorLogStream;
let accessLogStream;

// 스트림 래퍼 생성
const errorLog = {
  write: (message) => {
    if (errorLogStream) {
      errorLogStream.write(message);
    }
  }
};

const accessLog = {
  write: (message) => {
    if (accessLogStream) {
      accessLogStream.write(message);
    }
  }
};

const getInstanceId = () => {
  return cluster.isWorker ? cluster.worker.id : 'master';
};

// 로그 디렉토리 생성 함수 수정
const createLogDirectory = (date) => {
  const instanceId = getInstanceId();
  const logDir = path.join(__dirname, 'logs', date, `instance_${instanceId}`);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  return logDir;
};

// 로그 파일 갱신 함수
const updateLogFiles = (date) => {
  const logDir = createLogDirectory(date);
  const errorLogPath = path.join(logDir, `error_${date}.log`);
  const accessLogPath = path.join(logDir, `access_${date}.log`);

  return { errorLogPath, accessLogPath };
};

// 새로운 로그 파일 스트림을 여는 함수
const openNewLogStreams = () => {
  const { koreanDate } = krDate();

  // 새로운 로그 파일 경로 가져오기
  const { errorLogPath, accessLogPath } = updateLogFiles(koreanDate);

  // 기존 로그 스트림이 열려 있다면 닫기
  if (errorLogStream) {
    errorLogStream.end();
  }
  if (accessLogStream) {
    accessLogStream.end();
  }

  // 에러 로그 스트림 생성 시 에러 처리 추가
  errorLogStream = fs.createWriteStream(errorLogPath, { flags: 'a' });
  errorLogStream.on('error', (err) => {
    console.error('Error creating error log stream:', err);
  });

  // 접근 로그 스트림 생성 시 에러 처리 추가
  accessLogStream = fs.createWriteStream(accessLogPath, { flags: 'a' });
  accessLogStream.on('error', (err) => {
    console.error('Error creating access log stream:', err);
  });

  console.info('로그 파일을 갱신했습니다:', { errorLogPath, accessLogPath });
};

// 애플리케이션 시작 시 스트림 초기화
openNewLogStreams();

// 매일 자정에 새로운 로그 파일을 생성하는 스케줄러
schedule.scheduleJob('0 0 * * *', () => {
  console.info('새로운 로그 파일을 생성합니다.');
  openNewLogStreams();
});

module.exports = { errorLog, accessLog };
