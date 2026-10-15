import { saveFile } from '../../services/storage.service.js';

// uploadImages 미들웨어에서 형식/용량/개수 검사를 마친 파일들
// 응답: 저장된 이미지 주소 배열 (올린 순서 그대로)
export async function uploadProductImages(req, res) {
  const saved = await Promise.all(req.files.map((file) => saveFile(file, 'products')));
  res.status(201).json({ success: true, data: saved.map((s) => s.url) });
}
