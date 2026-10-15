import Product from '../models/Product.js';
import { httpError } from '../utils/httpError.js';

// 현재 상태 → 변경 가능한 상태
const STATUS_TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['preparing', 'cancelled', 'refunded'],
  preparing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

// 이 상태로 바뀌면 재고를 되돌림
const RESTOCK_STATUSES = ['cancelled', 'refunded'];

export function canChangeStatus(from, to) {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function restoreStock(items) {
  await Promise.all(
    items
      .filter((item) => item.product) // 삭제된 상품은 건너뜀
      .map((item) =>
        Product.updateOne(
          { _id: item.product, 'options.sku': item.optionSku },
          { $inc: { 'options.$.stock': item.quantity } },
        ),
      ),
  );
}

// 재고가 충분할 때만 차감 (조건부 업데이트라 동시 주문에도 음수가 되지 않음)
// 하나라도 실패하면 이미 차감한 재고를 되돌리고 409
export async function deductStock(items) {
  const deducted = [];
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product, options: { $elemMatch: { sku: item.optionSku, stock: { $gte: item.quantity } } } },
      { $inc: { 'options.$.stock': -item.quantity } },
    );
    if (result.modifiedCount === 0) {
      await restoreStock(deducted);
      throw httpError(409, `재고가 부족합니다: ${item.productName} (${item.optionName})`);
    }
    deducted.push(item);
  }
}

// save()로 변경해야 statusHistory가 기록됨
export async function changeOrderStatus(order, status) {
  if (!canChangeStatus(order.status, status)) {
    throw httpError(400, `주문 상태를 '${order.status}'에서 '${status}'(으)로 변경할 수 없습니다`);
  }
  if (RESTOCK_STATUSES.includes(status)) await restoreStock(order.items);
  order.status = status;
  return order.save();
}
