import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { changeOrderStatus, deductStock, restoreStock } from '../services/order.service.js';
import { httpError } from '../utils/httpError.js';
import { getPagination, paginationMeta, pick } from '../utils/request.js';

const SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;
const SHIPPING_FIELDS = ['recipient', 'phone', 'zipCode', 'address1', 'address2', 'memo'];
// 출고 전까지만 배송지 수정 가능
const SHIPPING_EDITABLE_STATUSES = ['pending', 'paid', 'preparing'];

async function findOrderOrThrow(id) {
  const order = await Order.findById(id);
  if (!order) throw httpError(404, '주문을 찾을 수 없습니다');
  return order;
}

// 요청된 { product, optionSku, quantity }를 현재 상품 정보로 스냅샷 생성 (가격은 서버에서 계산)
async function buildOrderItems(requestItems) {
  const productIds = [...new Set(requestItems.map((item) => String(item.product)))];
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  return requestItems.map(({ product: productId, optionSku, quantity }) => {
    const product = productMap.get(String(productId));
    if (!product || !product.isActive) throw httpError(400, '판매 중이 아닌 상품이 포함되어 있습니다');
    const option = product.options.find((o) => o.sku === String(optionSku).toUpperCase());
    if (!option) throw httpError(400, `존재하지 않는 옵션입니다: ${product.name} (${optionSku})`);

    return {
      product: product._id,
      productName: product.name,
      optionName: option.name,
      optionSku: option.sku,
      price: (product.salePrice ?? product.price) + option.extraPrice,
      quantity: Number(quantity),
      thumbnail: product.thumbnail ?? product.images[0],
    };
  });
}

function calculateAmounts(items) {
  const itemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingFee = itemsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const discount = 0; // 쿠폰/적립금 도입 시 계산
  return { itemsTotal, shippingFee, discount, total: itemsTotal + shippingFee - discount };
}

// ?user=<id>&status=paid&page=1&limit=20
export async function getOrders(req, res) {
  const filter = {};
  if (req.query.user) filter.user = req.query.user;
  if (req.query.status) filter.status = req.query.status;

  const pagination = getPagination(req.query);
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit),
    Order.countDocuments(filter),
  ]);
  res.json({ success: true, data: orders, pagination: paginationMeta(pagination, total) });
}

export async function getOrder(req, res) {
  const order = await findOrderOrThrow(req.params.id);
  res.json({ success: true, data: order });
}

export async function getOrderByNumber(req, res) {
  const order = await Order.findOne({ orderNumber: req.params.orderNumber });
  if (!order) throw httpError(404, '주문을 찾을 수 없습니다');
  res.json({ success: true, data: order });
}

// body: { user, items?: [{ product, optionSku, quantity }], shipping? }
// - items가 없으면 장바구니 전체를 주문하고, 주문 후 장바구니를 비움
// - shipping이 없으면 회원의 기본 배송지 사용
export async function createOrder(req, res) {
  const { user: userId, items: requestItems, shipping } = req.body ?? {};
  const user = await User.findById(userId);
  if (!user) throw httpError(404, '사용자를 찾을 수 없습니다');

  const fromCart = !requestItems;
  const cart = fromCart ? await Cart.findOne({ user: user._id }) : null;
  const sourceItems = fromCart ? (cart?.items ?? []) : requestItems;
  if (!Array.isArray(sourceItems) || !sourceItems.length) throw httpError(400, '주문할 상품이 없습니다');

  const shippingInfo = shipping
    ? pick(shipping, SHIPPING_FIELDS)
    : pick(user.addresses.find((a) => a.isDefault), SHIPPING_FIELDS);
  if (!shippingInfo.address1) throw httpError(400, '배송 정보가 없습니다 (기본 배송지를 등록하거나 shipping을 입력하세요)');

  const items = await buildOrderItems(sourceItems);
  await deductStock(items);

  let order;
  try {
    order = await Order.create({ user: user._id, items, shipping: shippingInfo, amounts: calculateAmounts(items) });
  } catch (err) {
    await restoreStock(items);
    throw err;
  }

  if (fromCart) {
    cart.items = [];
    await cart.save();
  }
  res.status(201).json({ success: true, data: order });
}

// 배송지(메모 포함)만 수정 가능. 금액/상품은 주문 후 변경 불가
export async function updateOrder(req, res) {
  const order = await findOrderOrThrow(req.params.id);
  if (!SHIPPING_EDITABLE_STATUSES.includes(order.status)) {
    throw httpError(400, '출고 이후에는 배송지를 변경할 수 없습니다');
  }
  order.shipping.set(pick(req.body?.shipping, SHIPPING_FIELDS));
  await order.save();
  res.json({ success: true, data: order });
}

// body: { status } — 취소/환불 시 재고 자동 복구, statusHistory 자동 기록
export async function updateOrderStatus(req, res) {
  const order = await findOrderOrThrow(req.params.id);
  await changeOrderStatus(order, req.body?.status);
  res.json({ success: true, data: order });
}

// 결제 전(pending) 또는 취소된 주문만 삭제 가능 (테스트/관리용)
export async function deleteOrder(req, res) {
  const order = await findOrderOrThrow(req.params.id);
  if (!['pending', 'cancelled'].includes(order.status)) {
    throw httpError(400, '결제 대기 또는 취소된 주문만 삭제할 수 있습니다');
  }
  if (order.status === 'pending') await restoreStock(order.items);
  await order.deleteOne();
  res.json({ success: true, data: order });
}
