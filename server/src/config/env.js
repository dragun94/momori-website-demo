import { existsSync } from 'node:fs';

// .env 파일이 있으면 로드 (Node 20.12+ 내장 기능, dotenv 불필요)
if (existsSync('.env')) process.loadEnvFile('.env');

const required = ['MONGODB_URI'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  throw new Error(`필수 환경변수가 없습니다: ${missing.join(', ')} (.env 파일을 확인하세요)`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  mongodbUri: process.env.MONGODB_URI,
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};
