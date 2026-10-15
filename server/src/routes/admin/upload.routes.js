import { Router } from 'express';
import * as uploadController from '../../controllers/admin/upload.controller.js';
import { uploadImages } from '../../middlewares/upload.js';

const router = Router();

// multipart/form-data, field: images (jpg/png/webp, 1장당 5MB, 최대 10장)
router.post('/', uploadImages, uploadController.uploadProductImages);

export default router;
