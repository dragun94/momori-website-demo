import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const AUTH_COOKIE_NAME = 'momori_token';
const REMEMBER_ME_EXPIRES_IN = '30d';

const baseCookieOptions = {
  httpOnly: true, // JS에서 접근 불가 → XSS로 토큰 탈취 방지
  sameSite: 'lax',
  secure: env.isProduction, // 운영(HTTPS)에서만 secure
  path: '/',
};

export function signAuthToken(userId, rememberMe = false) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, {
    expiresIn: rememberMe ? REMEMBER_ME_EXPIRES_IN : env.jwtExpiresIn,
  });
}

// 유효하지 않거나 만료되면 에러를 던짐
export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

// 로그인 상태 유지: 토큰 만료 시각까지 쿠키 유지
// 미체크: 브라우저를 닫으면 사라지는 세션 쿠키 (토큰 자체도 JWT_EXPIRES_IN 후 만료)
export function setAuthCookie(res, token, rememberMe = false) {
  const options = { ...baseCookieOptions };
  if (rememberMe) {
    const { exp } = jwt.decode(token);
    options.maxAge = exp * 1000 - Date.now();
  }
  res.cookie(AUTH_COOKIE_NAME, token, options);
}

export function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, baseCookieOptions);
}
