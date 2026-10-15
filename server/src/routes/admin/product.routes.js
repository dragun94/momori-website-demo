import { Router } from 'express';
import * as productController from '../../controllers/admin/product.controller.js';

// 삭제 API 없음: 주문 기록 보호를 위해 판매중지(isActive: false)로 처리
const router = Router();

router.route('/')
  .get(productController.getProducts)
  .post(productController.createProduct);

router.route('/:id')
  .get(productController.getProduct)
  .patch(productController.updateProduct);

export default router;
