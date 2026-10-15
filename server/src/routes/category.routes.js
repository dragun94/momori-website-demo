import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';

// 쇼핑몰용 조회 전용 (등록/수정/삭제는 /api/admin/categories)
const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

export default router;
