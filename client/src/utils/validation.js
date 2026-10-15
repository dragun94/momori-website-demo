// 서버 User 모델 규칙과 맞춘 클라이언트 유효성 검사
// 각 함수는 문제가 있으면 안내 문구를, 없으면 ""를 반환합니다.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  if (!value.trim()) return "이메일을 입력해 주세요";
  if (!EMAIL_REGEX.test(value.trim())) return "이메일 형식을 한 번 더 확인해 주세요 (예: momori@email.com)";
  return "";
}

export function validatePassword(value) {
  if (!value) return "비밀번호를 입력해 주세요";
  if (value.length < 8) return "비밀번호는 8자 이상이어야 해요";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "영문과 숫자를 함께 사용해 주세요";
  return "";
}

export function validatePasswordConfirm(password, confirm) {
  if (!confirm) return "비밀번호를 한 번 더 입력해 주세요";
  if (password !== confirm) return "비밀번호가 서로 달라요";
  return "";
}

export function validateName(value) {
  if (!value.trim()) return "이름을 입력해 주세요";
  return "";
}
