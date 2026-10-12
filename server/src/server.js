import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

async function start() {
  try {
    await connectDB();
    const server = app.listen(env.port, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${env.port} (${env.nodeEnv})`);
    });

    // 종료 시 DB 연결과 서버를 정리
    const shutdown = (signal) => {
      console.log(`\n${signal} 수신, 서버를 종료합니다...`);
      server.close(async () => {
        await disconnectDB();
        process.exit(0);
      });
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('❌ 서버 시작 실패:', err.message);
    process.exit(1);
  }
}

start();
