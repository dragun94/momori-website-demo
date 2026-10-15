import { Router } from 'express';
import * as uploadController from '../../controllers/admin/upload.controller.js';
import { uploadImages } from '../../middlewares/upload.js';

const router = Router();

// multipart/form-data, field: images (jpg/png/webp, 1장당 5MB, 최대 10장)
router.post('/', uploadImages, uploadController.uploadProductImages);

// JSON { url } — 이미지 주소로 올리기 (Cloudinary 설정 필요)
router.post('/url', uploadController.uploadProductImageByUrl);

export default router;
