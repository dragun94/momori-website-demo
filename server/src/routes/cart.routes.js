import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';

const router = Router();

router.route('/:userId')
  .get(cartController.getCart)
  .delete(cartController.clearCart);

router.post('/:userId/items', cartController.addCartItem);

router.route('/:userId/items/:itemId')
  .patch(cartController.updateCartItem)
  .delete(cartController.removeCartItem);

export default router;
