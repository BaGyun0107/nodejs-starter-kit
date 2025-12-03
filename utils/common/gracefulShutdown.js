// 모델과 데이터베이스 동기화 (개발 환경에서만 실행)
// const syncDatabase = async () => {
//   try {
//     await db.authenticate();
//     console.log('데이터베이스 연결 성공');

//     await sequelize.sync({ alter: true }); // alter: true는 기존 테이블을 유지하면서 변경 사항 반영
//     console.log('모델과 데이터베이스 동기화 완료');

//     process.exit(0);
//   } catch (error) {
//     console.error('동기화 오류:', error);
//     process.exit(1);
//   }
// };

// 서버 종료 처리
const gracefulShutdown = (server, dbPool, errorLog, scheduledJobs, io) => {
  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      console.log('이미 종료 중입니다.');
      return;
    }

    isShuttingDown = true;
    console.log(`[${signal}] 서버 종료 시작 - PID: ${process.pid}`);

    try {
      // 1. Socket.IO 연결 종료
      if (io) {
        console.log('Socket.IO 연결 종료 중...');
        // 모든 클라이언트에게 종료 알림
        io.emit('server-shutdown', { message: '서버가 재시작됩니다.' });

        // 모든 소켓 연결 종료
        const sockets = await io.fetchSockets();
        for (const socket of sockets) {
          socket.disconnect(true);
        }

        // Socket.IO 서버 종료
        io.close(() => {
          console.log('Socket.IO 서버 종료 완료');
        });
      }

      // 2. 스케줄된 작업 취소
      if (scheduledJobs) {
        if (Array.isArray(scheduledJobs)) {
          scheduledJobs.forEach((job) => job.cancel());
        } else {
          scheduledJobs.cancel();
        }
        console.log('스케줄된 작업 취소 완료');
      }

      // 3. HTTP 서버 종료
      await new Promise((resolve, reject) => {
        // 타임아웃 설정
        const timeout = setTimeout(() => {
          console.log('서버 종료 타임아웃 - 강제 종료 진행');
          resolve();
        }, 5000);

        server.close((err) => {
          clearTimeout(timeout);
          if (err) {
            console.error('서버 close 에러:', err);
            reject(err);
          } else {
            console.log('HTTP 서버 종료 완료');
            resolve();
          }
        });

        // 활성 연결 추적 및 종료
        if (server._connections) {
          console.log(`활성 연결 수: ${server._connections.size}`);
          // Keep-alive 연결 강제 종료
          server._connections.forEach((connection) => {
            connection.destroy();
          });
        }
      });

      // 4. 데이터베이스 연결 풀 종료
      if (dbPool && dbPool.end) {
        await dbPool.end();
        console.log('DB 연결 풀 종료 완료');
      }

      console.log('정상 종료 완료');
      process.exit(0);
    } catch (error) {
      console.error('종료 중 오류 발생:', error);
      if (errorLog && errorLog.write) {
        try {
          errorLog.write(`종료 중 오류: ${error.stack}\n`);
        } catch (logErr) {
          console.error('에러 로그 작성 실패:', logErr);
        }
      }
      process.exit(1);
    }
  };

  // 강제 종료 타이머
  const forceShutdown = (signal) => {
    setTimeout(() => {
      console.error(`[${signal}] 강제 종료 실행 - PID: ${process.pid}`);
      process.exit(1);
    }, 7000); // PM2 kill_timeout(8초)보다 1초 짧게
  };

  // 시그널 핸들러 등록
  ['SIGTERM', 'SIGINT'].forEach((signal) => {
    process.on(signal, () => {
      console.log(`[${signal}] 신호 수신 - PID: ${process.pid}`);
      forceShutdown(signal);
      shutdown(signal);
    });
  });

  // PM2 cluster mode에서의 shutdown 메시지 처리
  process.on('message', (msg) => {
    if (msg === 'shutdown') {
      console.log(`[PM2] shutdown 메시지 수신 - PID: ${process.pid}`);
      forceShutdown('PM2-shutdown');
      shutdown('PM2-shutdown');
    }
  });

  // 처리되지 않은 예외 포착
  process.on('uncaughtException', (err) => {
    console.error(`처리되지 않은 예외 발생 - PID: ${process.pid}:`, err);

    try {
      if (errorLog && errorLog.write) {
        errorLog.write(
          `[${new Date().toISOString()}] PID ${process.pid} - 처리되지 않은 예외: ${err.stack}\n`,
        );
      }
    } catch (logErr) {
      console.error('에러 로그 작성 중 오류:', logErr);
    }

    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error(
      `처리되지 않은 프로미스 거부 발생 - PID: ${process.pid}:`,
      reason,
    );

    try {
      if (errorLog && errorLog.write) {
        errorLog.write(
          `[${new Date().toISOString()}] PID ${process.pid} - 처리되지 않은 프로미스 거부: ${reason}\n`,
        );
      }
    } catch (logErr) {
      console.error('에러 로그 작성 중 오류:', logErr);
    }

    if (process.env.NODE_ENV === 'production') {
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });

  console.log(`Graceful shutdown 핸들러 등록 완료 - PID: ${process.pid}`);
};

module.exports = { gracefulShutdown };
