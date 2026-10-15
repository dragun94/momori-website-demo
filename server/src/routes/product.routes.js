import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';

const router = Router();

router.route('/')
  .get(productController.getProducts)
  .post(productController.createProduct);

router.get('/slug/:slug', productController.getProductBySlug);

router.route('/:id')
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

export default router;
