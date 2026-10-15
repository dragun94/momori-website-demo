import User from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { pick } from '../utils/request.js';

const ADDRESS_FIELDS = ['recipient', 'phone', 'zipCode', 'address1', 'address2', 'isDefault'];

async function findUserOrThrow(userId) {
  const user = await User.findById(userId);
  if (!user) throw httpError(404, '사용자를 찾을 수 없습니다');
  return user;
}

function findAddressOrThrow(user, addressId) {
  const address = user.addresses.id(addressId);
  if (!address) throw httpError(404, '배송지를 찾을 수 없습니다');
  return address;
}

// 기본 배송지는 항상 1개: 지정한 주소 외에는 해제, 하나도 없으면 첫 번째를 기본으로
function normalizeDefault(user, defaultAddress) {
  if (defaultAddress?.isDefault) {
    user.addresses.forEach((a) => {
      if (!a._id.equals(defaultAddress._id)) a.isDefault = false;
    });
  }
  if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) {
    user.addresses[0].isDefault = true;
  }
}

export async function getAddresses(req, res) {
  const user = await findUserOrThrow(req.params.userId);
  res.json({ success: true, data: user.addresses });
}

export async function createAddress(req, res) {
  const user = await findUserOrThrow(req.params.userId);
  user.addresses.push(pick(req.body, ADDRESS_FIELDS));
  const address = user.addresses.at(-1);
  normalizeDefault(user, address);
  await user.save();
  res.status(201).json({ success: true, data: address });
}

export async function updateAddress(req, res) {
  const user = await findUserOrThrow(req.params.userId);
  const address = findAddressOrThrow(user, req.params.addressId);
  address.set(pick(req.body, ADDRESS_FIELDS));
  normalizeDefault(user, address);
  await user.save();
  res.json({ success: true, data: address });
}

export async function deleteAddress(req, res) {
  const user = await findUserOrThrow(req.params.userId);
  const address = findAddressOrThrow(user, req.params.addressId);
  address.deleteOne();
  normalizeDefault(user);
  await user.save();
  res.json({ success: true, data: address });
}
