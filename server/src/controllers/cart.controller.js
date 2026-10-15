import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { httpError } from '../utils/httpError.js';

const PRODUCT_SUMMARY = 'name slug price salePrice thumbnail options isActive';

// 장바구니가 없으면 빈 장바구니를 만들어 반환
async function findOrCreateCart(userId) {
  if (!(await User.exists({ _id: userId }))) throw httpError(404, '사용자를 찾을 수 없습니다');
  return Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, returnDocument: 'after' },
  );
}

function findItemOrThrow(cart, itemId) {
  const item = cart.items.id(itemId);
  if (!item) throw httpError(404, '장바구니 상품을 찾을 수 없습니다');
  return item;
}

// 판매 중인 상품/옵션인지, 재고가 충분한지 확인
async function assertAvailable(productId, optionSku, quantity) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw httpError(400, '판매 중인 상품이 아닙니다');
  const option = product.options.find((o) => o.sku === optionSku?.toUpperCase());
  if (!option) throw httpError(400, '존재하지 않는 옵션입니다');
  if (option.stock < quantity) throw httpError(400, `재고가 부족합니다 (남은 수량: ${option.stock})`);
}

async function sendCart(res, cart, status = 200) {
  await cart.populate('items.product', PRODUCT_SUMMARY);
  res.status(status).json({ success: true, data: cart });
}

export async function getCart(req, res) {
  const cart = await findOrCreateCart(req.params.userId);
  await sendCart(res, cart);
}

// 같은 상품+옵션이 이미 있으면 수량을 합침
export async function addCartItem(req, res) {
  const { product, optionSku, quantity = 1 } = req.body ?? {};
  const cart = await findOrCreateCart(req.params.userId);

  const existing = cart.items.find(
    (item) => item.product.equals(product) && item.optionSku === optionSku?.toUpperCase(),
  );
  const nextQuantity = (existing?.quantity ?? 0) + Number(quantity);
  await assertAvailable(product, optionSku, nextQuantity);

  if (existing) existing.quantity = nextQuantity;
  else cart.items.push({ product, optionSku, quantity });
  await cart.save();
  await sendCart(res, cart, 201);
}

export async function updateCartItem(req, res) {
  const { quantity } = req.body ?? {};
  const cart = await findOrCreateCart(req.params.userId);
  const item = findItemOrThrow(cart, req.params.itemId);
  await assertAvailable(item.product, item.optionSku, Number(quantity));
  item.quantity = quantity;
  await cart.save();
  await sendCart(res, cart);
}

export async function removeCartItem(req, res) {
  const cart = await findOrCreateCart(req.params.userId);
  findItemOrThrow(cart, req.params.itemId).deleteOne();
  await cart.save();
  await sendCart(res, cart);
}

export async function clearCart(req, res) {
  const cart = await findOrCreateCart(req.params.userId);
  cart.items = [];
  await cart.save();
  await sendCart(res, cart);
}
