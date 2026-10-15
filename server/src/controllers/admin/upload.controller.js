import { saveFile, saveFromUrl } from '../../services/storage.service.js';
import { httpError } from '../../utils/httpError.js';

// uploadImages 미들웨어에서 형식/용량/개수 검사를 마친 파일들
// 응답: 저장된 이미지 주소 배열 (올린 순서 그대로)
export async function uploadProductImages(req, res) {
  const saved = await Promise.all(req.files.map((file) => saveFile(file, 'products')));
  res.status(201).json({ success: true, data: saved.map((s) => s.url) });
}

function isHttpUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

// body: { url } — 외부 이미지 주소를 저장소(Cloudinary)로 복사
// 응답: 저장된 이미지 주소 (외부 주소가 아니라 우리 저장소 주소)
export async function uploadProductImageByUrl(req, res) {
  const url = req.body?.url?.trim?.();
  if (!isHttpUrl(url)) throw httpError(400, 'http:// 또는 https://로 시작하는 이미지 주소를 입력해 주세요');
  const saved = await saveFromUrl(url, 'products');
  res.status(201).json({ success: true, data: saved.url });
}
