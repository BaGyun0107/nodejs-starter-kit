// 서버 종료 처리
const gracefulShutdown = (server, db, errorLog) => {
  const shutdown = () => {
    // 서버 종료 로그
    console.log('서버 종료 중');
    server.close(() => {
      // 서버 종료 로그
      console.log('서버 종료 완료');
      // DB 연결 종료 처리
      db.end((err) => {
        if (err) {
          console.error('DB 연결 종료 실패', err);
          process.exit(1);
        } else {
          console.log('DB 연결 종료 완료');
          process.exit(0);
        }
      });
    });

    // 10초 후 강제 종료 (옵션)
    setTimeout(() => {
      console.error('서버 강제 종료');
      process.exit(1);
    }, 10000);
  };

  // SIGTERM 및 SIGINT 이벤트 핸들러 등록
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  // 처리되지 않은 예외 포착
  process.on('uncaughtException', (err) => {
    try {
      errorLog.write(`처리되지 않은 예외: ${err.stack}\n`);
    } catch (logErr) {
      console.error('에러 로그 작성 중 오류:', logErr);
    } finally {
      console.error('처리되지 않은 예외 발생:', err);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  });

  // 처리되지 않은 프로미스 거부 포착
  process.on('unhandledRejection', (reason, promise) => {
    try {
      errorLog.write(`처리되지 않은 프로미스 거부: ${reason}\n`);
    } catch (logErr) {
      console.error('에러 로그 작성 중 오류:', logErr);
    } finally {
      console.error('처리되지 않은 프로미스 거부 발생:', reason);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  });
};

module.exports = { gracefulShutdown };
