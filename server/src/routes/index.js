import { Router } from 'express';
import mongoose from 'mongoose';
import userRoutes from './user.routes.js';

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

export default router;
