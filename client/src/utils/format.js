/** 12000 → "12,000원" */
export function formatPrice(value) {
  return `${Number(value ?? 0).toLocaleString("ko-KR")}원`;
}
