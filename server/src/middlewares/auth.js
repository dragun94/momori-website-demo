import User from '../models/User.js';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '../utils/authToken.js';
import { httpError } from '../utils/httpError.js';

// 쿠키의 JWT를 검증하고 req.user에 회원 정보 저장 (매 요청 DB 조회 → 탈퇴/권한 변경 즉시 반영)
export async function requireAuth(req, res, next) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) throw httpError(401, '로그인이 필요해요');

  let payload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw httpError(401, '로그인이 만료되었어요. 다시 로그인해 주세요');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw httpError(401, '로그인이 필요해요');

  req.user = user;
  next();
}

// requireAuth 다음에 사용: router.use(requireAuth, requireAdmin)
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') throw httpError(403, '관리자만 접근할 수 있어요');
  next();
}
