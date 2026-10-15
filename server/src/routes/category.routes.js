import { Router } from 'express';
import * as categoryController from '../controllers/category.controller.js';

const router = Router();

router.route('/')
  .get(categoryController.getCategories)
  .post(categoryController.createCategory);

router.route('/:id')
  .get(categoryController.getCategory)
  .patch(categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

export default router;
