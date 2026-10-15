import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import addressRoutes from './address.routes.js';

const router = Router();

router.route('/')
  .get(userController.getUsers)
  .post(userController.createUser);

router.route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.use('/:userId/addresses', addressRoutes);

export default router;
