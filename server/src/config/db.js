import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.connection.on('connected', () => console.log('✅ MongoDB 연결됨'));
mongoose.connection.on('disconnected', () => console.log('⚠️  MongoDB 연결 끊김'));
mongoose.connection.on('error', (err) => console.error('❌ MongoDB 에러:', err.message));

export async function connectDB() {
  await mongoose.connect(env.mongodbUri, { serverSelectionTimeoutMS: 5000 });
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
