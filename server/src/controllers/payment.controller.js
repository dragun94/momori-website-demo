import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import { canChangeStatus, changeOrderStatus } from '../services/order.service.js';
import { httpError } from '../utils/httpError.js';
import { pick } from '../utils/request.js';

const CREATE_FIELDS = ['provider', 'method'];
const UPDATE_FIELDS = ['status', 'paymentKey', 'method', 'failReason', 'rawResponse'];

async function findPaymentOrThrow(id) {
  const payment = await Payment.findById(id);
  if (!payment) throw httpError(404, '결제 정보를 찾을 수 없습니다');
  return payment;
}

// ?order=<id>&user=<id>&status=done
export async function getPayments(req, res) {
  const filter = pick(req.query, ['order', 'user', 'status']);
  const payments = await Payment.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: payments });
}

export async function getPayment(req, res) {
  const payment = await findPaymentOrThrow(req.params.id);
  res.json({ success: true, data: payment });
}

// body: { order, amount, provider?, method? } — 금액은 주문 금액과 일치해야 함
export async function createPayment(req, res) {
  const { order: orderId, amount } = req.body ?? {};
  const order = await Order.findById(orderId);
  if (!order) throw httpError(404, '주문을 찾을 수 없습니다');
  if (order.status !== 'pending') throw httpError(400, '결제 대기 중인 주문이 아닙니다');
  if (Number(amount) !== order.amounts.total) throw httpError(400, '결제 금액이 주문 금액과 일치하지 않습니다');

  const payment = await Payment.create({
    ...pick(req.body, CREATE_FIELDS),
    order: order._id,
    user: order.user,
    amount: order.amounts.total,
  });
  res.status(201).json({ success: true, data: payment });
}

// 결제 완료(done) → 주문 paid, 결제 취소(cancelled) → 주문 취소(재고 복구)
export async function updatePayment(req, res) {
  const payment = await findPaymentOrThrow(req.params.id);
  const data = pick(req.body, UPDATE_FIELDS);
  const statusChanged = data.status && data.status !== payment.status;

  payment.set(data);
  if (statusChanged && payment.status === 'done') payment.paidAt = new Date();
  if (statusChanged && payment.status === 'cancelled') payment.cancelledAt = new Date();
  await payment.save();

  if (statusChanged) {
    const order = await Order.findById(payment.order);
    const nextOrderStatus = { done: 'paid', cancelled: 'cancelled' }[payment.status];
    if (order && nextOrderStatus && canChangeStatus(order.status, nextOrderStatus)) {
      await changeOrderStatus(order, nextOrderStatus);
    }
  }
  res.json({ success: true, data: payment });
}

export async function deletePayment(req, res) {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) throw httpError(404, '결제 정보를 찾을 수 없습니다');
  res.json({ success: true, data: payment });
}
