// 공통 API 요청 함수
// 개발 중에는 vite.config.js의 proxy가 /api 요청을 Express 서버(5000)로 전달합니다.

/**
 * @param {string} url 예: "/api/auth/login"
 * @param {{ method?: string, body?: object | FormData, query?: object, raw?: boolean }} options
 *   - query: { page: 1, q: "" } → ?page=1 (빈 값은 제외)
 *   - raw: true면 { data, pagination } 등 응답 전체를, 아니면 data만 반환
 */
export async function request(url, { method = "GET", body, query, raw = false } = {}) {
  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(`${url}${toQueryString(query)}`, {
      method,
      // FormData는 브라우저가 multipart 경계값을 포함한 Content-Type을 직접 설정
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      credentials: "include",
      body: isForm ? body : body ? JSON.stringify(body) : undefined,
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

  return raw ? json : json.data;
}

function toQueryString(query) {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function defaultMessage(status) {
  if (status === 401) return "로그인이 필요해요.";
  if (status === 403) return "권한이 없어요.";
  if (status === 429) return "잠시 후 다시 시도해 주세요.";
  if (status === 404) return "서비스를 준비 중이에요. 조금만 기다려 주세요.";
  if (status === 409) return "이미 가입된 이메일이에요.";
  if (status >= 500) return "서버에 잠시 문제가 생겼어요. 다시 시도해 주세요.";
  return "요청을 처리하지 못했어요. 입력 내용을 확인해 주세요.";
}
