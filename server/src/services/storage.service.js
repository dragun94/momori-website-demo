// 파일 저장소 (지금은 서버 로컬 디스크)
// Cloudinary/S3로 바꿀 때는 이 파일의 saveFile/deleteFile만 교체하면 됩니다.
// (컨트롤러는 saveFile이 돌려주는 { url }만 사용)
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// server/uploads (실행 위치와 상관없이 고정)
export const LOCAL_UPLOAD_ROOT = fileURLToPath(new URL('../../uploads', import.meta.url));
export const PUBLIC_UPLOAD_PATH = '/uploads';

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * @param {{ buffer: Buffer, mimetype: string }} file multer memoryStorage 파일
 * @param {string} folder 예: 'products'
 * @returns {Promise<{ url: string }>} 브라우저에서 접근할 주소
 */
export async function saveFile(file, folder) {
  const dir = path.join(LOCAL_UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  // 원래 파일명은 쓰지 않음 (중복·한글·경로 조작 방지)
  const filename = `${Date.now()}-${randomUUID()}.${EXTENSIONS[file.mimetype]}`;
  await writeFile(path.join(dir, filename), file.buffer);
  return { url: `${PUBLIC_UPLOAD_PATH}/${folder}/${filename}` };
}

// 아직 사용하는 곳은 없음 (나중에 이미지 정리 기능에서 사용)
export async function deleteFile(url) {
  if (!url?.startsWith(`${PUBLIC_UPLOAD_PATH}/`)) return;
  const filePath = path.join(LOCAL_UPLOAD_ROOT, url.slice(PUBLIC_UPLOAD_PATH.length));
  if (!filePath.startsWith(LOCAL_UPLOAD_ROOT)) return; // ../ 경로 조작 방지
  await unlink(filePath).catch(() => {});
}
