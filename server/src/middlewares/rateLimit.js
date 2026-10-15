import { rateLimit } from 'express-rate-limit';

// 로그인: IP당 15분에 10회 (성공한 로그인은 횟수에서 제외 → 실패 시도만 제한)
// 운영에서 Nginx 등 프록시 뒤에 둔다면 app.set('trust proxy', 1) 필요
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ success: false, message: '잠시 후 다시 시도해 주세요' });
  },
});
