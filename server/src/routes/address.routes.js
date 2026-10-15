import { Router } from 'express';
import * as addressController from '../controllers/address.controller.js';

// /api/users/:userId/addresses 아래에 연결됨 (mergeParams로 :userId 사용)
const router = Router({ mergeParams: true });

router.route('/')
  .get(addressController.getAddresses)
  .post(addressController.createAddress);

router.route('/:addressId')
  .patch(addressController.updateAddress)
  .delete(addressController.deleteAddress);

export default router;
