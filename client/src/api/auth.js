// 인증 관련 API
// 개발 중에는 vite.config.js의 proxy가 /api 요청을 Express 서버(5000)로 전달합니다.

const BASE_URL = "/api/auth";

async function request(path, { method = "GET", body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("서버와 연결할 수 없어요. 잠시 후 다시 시도해 주세요.");
  }

  // 서버 응답 형식: { success, data } 또는 { success: false, message }
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.success === false) {
    const error = new Error(json.message || defaultMessage(res.status));
    error.status = res.status;
    throw error;
  }

  return json.data;
}

function defaultMessage(status) {
  if (status === 401) return "로그인이 필요해요.";
  if (status === 429) return "잠시 후 다시 시도해 주세요.";
  if (status === 404) return "서비스를 준비 중이에요. 조금만 기다려 주세요.";
  if (status === 409) return "이미 가입된 이메일이에요.";
  if (status >= 500) return "서버에 잠시 문제가 생겼어요. 다시 시도해 주세요.";
  return "요청을 처리하지 못했어요. 입력 내용을 확인해 주세요.";
}

/**
 * 회원가입
 * @param {{ email: string, password: string, name: string, termsAgreed: boolean, marketingAgreed: boolean }} payload
 */
export function signup(payload) {
  return request("/signup", { method: "POST", body: payload });
}

/**
 * 로그인 (성공 시 서버가 httpOnly 쿠키에 토큰 저장)
 * @param {{ email: string, password: string, rememberMe: boolean }} payload
 * @returns 비밀번호를 제외한 회원 정보
 */
export function login(payload) {
  return request("/login", { method: "POST", body: payload });
}

/** 로그아웃 (서버가 쿠키 삭제) */
export function logout() {
  return request("/logout", { method: "POST" });
}

/** 현재 로그인한 회원 정보 (로그인 안 됨/만료 시 401 에러) */
export function getMe() {
  return request("/me");
}
