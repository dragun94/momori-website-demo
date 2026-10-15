// 파일 저장소
// - .env에 CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET이 있으면 Cloudinary
// - 없으면 서버 로컬 디스크(server/uploads) — 키 없이 개발할 때용
// 컨트롤러는 saveFile이 돌려주는 { url }만 사용하므로 저장소를 바꿔도 다른 코드는 그대로입니다.
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { ALLOWED_FORMATS, MAX_FILE_SIZE } from '../config/upload.js';
import { httpError } from '../utils/httpError.js';

const { cloudName, apiKey, apiSecret, folder: rootFolder } = env.cloudinary;
const useCloudinary = Boolean(cloudName && apiKey && apiSecret);

export const storageDriver = useCloudinary ? 'cloudinary' : 'local';

if (useCloudinary) {
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
} else if (env.isProduction) {
  console.warn('⚠️  Cloudinary 설정이 없어 이미지를 서버 디스크에 저장합니다. 운영에서는 재배포 시 사라질 수 있어요.');
}

/**
 * @param {{ buffer: Buffer, mimetype: string }} file multer memoryStorage 파일
 * @param {string} folder 예: 'products'
 * @returns {Promise<{ url: string }>} 브라우저에서 접근할 이미지 주소
 */
export function saveFile(file, folder) {
  return useCloudinary ? saveToCloudinary(file, folder) : saveToLocal(file, folder);
}

/**
 * 이미지 주소로 저장: Cloudinary가 그 주소에서 직접 이미지를 가져감 (우리 서버는 외부 주소에 접속하지 않음)
 * 로컬 저장소에서는 지원하지 않음
 * @returns {Promise<{ url: string }>}
 */
export function saveFromUrl(url, folder) {
  if (!useCloudinary) {
    return Promise.reject(httpError(400, '이미지 주소로 올리기는 Cloudinary 설정이 있어야 사용할 수 있어요'));
  }
  return saveUrlToCloudinary(url, folder);
}

export function deleteFile(url) {
  return useCloudinary ? deleteFromCloudinary(url) : deleteFromLocal(url);
}

/* ===== Cloudinary ===== */

function saveToCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      // public_id(파일명)는 Cloudinary가 겹치지 않게 자동 생성
      { folder: `${rootFolder}/${folder}`, resource_type: 'image' },
      (err, result) => {
        if (err) {
          console.error('❌ Cloudinary 업로드 실패:', err.message);
          return reject(httpError(502, '이미지 저장소(Cloudinary)에 업로드하지 못했어요. 잠시 후 다시 시도해 주세요'));
        }
        resolve({ url: result.secure_url });
      },
    );
    stream.end(file.buffer);
  });
}

async function saveUrlToCloudinary(url, folder) {
  let result;
  try {
    result = await cloudinary.uploader.upload(url, {
      folder: `${rootFolder}/${folder}`,
      resource_type: 'image',
      allowed_formats: ALLOWED_FORMATS, // 그 외 형식(gif 등)은 Cloudinary가 거절
    });
  } catch (err) {
    console.error('❌ Cloudinary 주소 업로드 실패:', err.message);
    // 4xx: 주소에 이미지가 없음(웹페이지 등)·허용되지 않은 형식 → 입력한 주소 문제
    if (err.http_code >= 400 && err.http_code < 500) {
      throw httpError(400, '이미지를 가져오지 못했어요. jpg, png, webp 이미지 주소가 맞는지 확인해 주세요');
    }
    throw httpError(502, '이미지 저장소(Cloudinary)에 업로드하지 못했어요. 잠시 후 다시 시도해 주세요');
  }
  // 용량은 가져온 뒤에야 알 수 있으므로 초과하면 바로 삭제
  if (result.bytes > MAX_FILE_SIZE) {
    await cloudinary.uploader.destroy(result.public_id, { invalidate: true }).catch(() => {});
    throw httpError(400, '이미지는 1장당 5MB 이하만 올릴 수 있어요');
  }
  return { url: result.secure_url };
}

// https://res.cloudinary.com/<cloud>/image/upload/v123/momori/products/abc.jpg → momori/products/abc
function toPublicId(url) {
  const match = url?.match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\/image\/upload\/(?:.+\/)?v\d+\/(.+)\.\w+$/);
  return match && match[1] === cloudName ? match[2] : null;
}

// 우리 Cloudinary 계정의 이미지가 아니면(placeholder 등) 아무것도 하지 않음
// invalidate: CDN에 캐시된 이미지도 무효화
async function deleteFromCloudinary(url) {
  const publicId = toPublicId(url);
  if (!publicId) return;
  const { result } = await cloudinary.uploader.destroy(publicId, { invalidate: true });
  if (result !== 'ok' && result !== 'not found') console.warn('⚠️  Cloudinary 삭제 응답:', publicId, result);
}

/* ===== 로컬 디스크 (Cloudinary 설정이 없을 때) ===== */

// server/uploads (실행 위치와 상관없이 고정)
export const LOCAL_UPLOAD_ROOT = fileURLToPath(new URL('../../uploads', import.meta.url));
export const PUBLIC_UPLOAD_PATH = '/uploads';

const EXTENSIONS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

async function saveToLocal(file, folder) {
  const dir = path.join(LOCAL_UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });
  // 원래 파일명은 쓰지 않음 (중복·한글·경로 조작 방지)
  const filename = `${Date.now()}-${randomUUID()}.${EXTENSIONS[file.mimetype]}`;
  await writeFile(path.join(dir, filename), file.buffer);
  return { url: `${PUBLIC_UPLOAD_PATH}/${folder}/${filename}` };
}

// 로컬 저장 이미지 삭제
async function deleteFromLocal(url) {
  if (!url?.startsWith(`${PUBLIC_UPLOAD_PATH}/`)) return;
  const filePath = path.join(LOCAL_UPLOAD_ROOT, url.slice(PUBLIC_UPLOAD_PATH.length));
  if (!filePath.startsWith(LOCAL_UPLOAD_ROOT)) return; // ../ 경로 조작 방지
  await unlink(filePath).catch(() => {});
}
