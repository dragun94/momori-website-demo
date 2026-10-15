import multer from 'multer';
import { ALLOWED_TYPES, MAX_FILE_SIZE, MAX_FILES } from '../config/upload.js';
import { httpError } from '../utils/httpError.js';

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: '이미지는 1장당 5MB 이하만 올릴 수 있어요',
  LIMIT_FILE_COUNT: `이미지는 한 번에 최대 ${MAX_FILES}장까지 올릴 수 있어요`,
  LIMIT_UNEXPECTED_FILE: `이미지는 한 번에 최대 ${MAX_FILES}장까지 올릴 수 있어요`,
};

// 파일 내용의 앞부분(시그니처)으로 실제 이미지인지 확인 (확장자/MIME만 바꾼 파일 차단)
function hasImageSignature({ buffer, mimetype }) {
  if (mimetype === 'image/jpeg') return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mimetype === 'image/png') return buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (mimetype === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

// 메모리에 받아서 검사 → 저장은 storage.service가 담당
const multerImages = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
    cb(httpError(400, 'jpg, png, webp 이미지만 올릴 수 있어요'));
  },
}).array('images', MAX_FILES);

// field 이름: images (여러 장)
export function uploadImages(req, res, next) {
  multerImages(req, res, (err) => {
    if (err instanceof multer.MulterError) return next(httpError(400, MULTER_MESSAGES[err.code] ?? err.message));
    if (err) return next(err);
    if (!req.files?.length) return next(httpError(400, '올릴 이미지를 선택해 주세요'));
    if (!req.files.every(hasImageSignature)) return next(httpError(400, '이미지 파일이 올바르지 않아요'));
    next();
  });
}
