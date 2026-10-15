import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';

// 쇼핑몰용 조회 전용 (등록/수정/판매중지는 /api/admin/products)
const router = Router();

router.get('/', productController.getProducts);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/:id', productController.getProduct);

export default router;
