import { Router } from 'express';
import mongoose from 'mongoose';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import productRoutes from './product.routes.js';
import cartRoutes from './cart.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';

const router = Router();

// 서버/DB 상태 확인용
router.get('/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  res.json({
    success: true,
    status: 'ok',
    db: dbStates[mongoose.connection.readyState] ?? 'unknown',
    uptime: process.uptime(),
  });
});

router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/carts', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);

export default router;
