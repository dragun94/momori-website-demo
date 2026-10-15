import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';

const router = Router();

router.route('/')
  .get(paymentController.getPayments)
  .post(paymentController.createPayment);

router.route('/:id')
  .get(paymentController.getPayment)
  .patch(paymentController.updatePayment)
  .delete(paymentController.deletePayment);

export default router;
