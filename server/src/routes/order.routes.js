import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

router.route('/')
  .get(orderController.getOrders)
  .post(orderController.createOrder);

router.get('/number/:orderNumber', orderController.getOrderByNumber);

router.route('/:id')
  .get(orderController.getOrder)
  .patch(orderController.updateOrder)
  .delete(orderController.deleteOrder);

router.patch('/:id/status', orderController.updateOrderStatus);

export default router;
