/**
 * Cloudinary 이미지는 주소에 변환 옵션을 넣어 필요한 크기로 받음 (원본 주소는 그대로 저장)
 * 예: .../image/upload/v1/momori/a.jpg → .../image/upload/c_fill,w_96,h_96,f_auto,q_auto/v1/momori/a.jpg
 * Cloudinary가 아닌 주소(로컬 /uploads, placeholder 등)는 그대로 반환
 */
export function resizeImage(url, size) {
  if (!url?.startsWith("https://res.cloudinary.com/") || !url.includes("/image/upload/")) return url;
  return url.replace("/image/upload/", `/image/upload/c_fill,w_${size},h_${size},f_auto,q_auto/`);
}
