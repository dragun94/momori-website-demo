// errorHandler가 err.status를 응답 코드로 사용합니다.
export function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}
