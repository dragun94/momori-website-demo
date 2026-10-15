import { Router } from 'express';
import { requireAdmin, requireAuth } from '../../middlewares/auth.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import uploadRoutes from './upload.routes.js';

// /api/admin 아래 모든 API는 관리자만 (비로그인 401, 일반 회원 403)
const router = Router();

router.use(requireAuth, requireAdmin);

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/uploads', uploadRoutes);

export default router;
