import mongoose from 'mongoose';
import { env } from '../config/env.js';

// Express 5는 async 핸들러에서 throw된 에러도 자동으로 여기로 전달합니다.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status ?? err.statusCode ?? 500;
  let message = err.message || '서버 내부 오류';

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `잘못된 ${err.path} 값입니다: ${err.value}`;
  } else if (err.code === 11000) {
    status = 409;
    message = `이미 존재하는 값입니다: ${Object.keys(err.keyValue ?? {}).join(', ')}`;
  }

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message,
    ...(env.isProduction ? {} : { stack: err.stack }),
  });
}
