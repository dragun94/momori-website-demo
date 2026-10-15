import { Router } from 'express';
import * as categoryController from '../../controllers/admin/category.controller.js';

const router = Router();

router.route('/')
  .get(categoryController.getCategories)
  .post(categoryController.createCategory);

// /:id보다 먼저 선언해야 'reorder'가 id로 인식되지 않음
router.patch('/reorder', categoryController.reorderCategories);

router.route('/:id')
  .patch(categoryController.updateCategory)
  .delete(categoryController.deleteCategory);

export default router;
