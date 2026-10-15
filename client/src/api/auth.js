// 인증 관련 API
import { request } from "./client";

const BASE_URL = "/api/auth";

/**
 * 회원가입
 * @param {{ email: string, password: string, name: string, termsAgreed: boolean, marketingAgreed: boolean }} payload
 */
export function signup(payload) {
  return request(`${BASE_URL}/signup`, { method: "POST", body: payload });
}

/**
 * 로그인 (성공 시 서버가 httpOnly 쿠키에 토큰 저장)
 * @param {{ email: string, password: string, rememberMe: boolean }} payload
 * @returns 비밀번호를 제외한 회원 정보
 */
export function login(payload) {
  return request(`${BASE_URL}/login`, { method: "POST", body: payload });
}

/** 로그아웃 (서버가 쿠키 삭제) */
export function logout() {
  return request(`${BASE_URL}/logout`, { method: "POST" });
}

/** 현재 로그인한 회원 정보 (로그인 안 됨/만료 시 401 에러) */
export function getMe() {
  return request(`${BASE_URL}/me`);
}
