import { randomBytes } from 'node:crypto';
import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const ORDER_NUMBER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 0/O, 1/I 제외

// 예: 20261015-K7Q2ZP (날짜는 한국 시간 기준)
function generateOrderNumber() {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })
    .format(new Date())
    .replaceAll('-', '');
  const suffix = Array.from(randomBytes(6), (b) => ORDER_NUMBER_CHARS[b % ORDER_NUMBER_CHARS.length]).join('');
  return `${date}-${suffix}`;
}

// 주문 당시 상품 정보 스냅샷 (상품이 수정/삭제돼도 주문 내역 유지)
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: { type: String, required: [true, '상품명은 필수입니다'] },
  optionName: { type: String, required: [true, '옵션명은 필수입니다'] },
  optionSku: { type: String, required: [true, '옵션 SKU는 필수입니다'] },
  price: { type: Number, required: [true, '가격은 필수입니다'], min: [0, '가격은 0 이상이어야 합니다'] }, // 옵션 추가금 포함 단가
  quantity: {
    type: Number,
    required: [true, '수량은 필수입니다'],
    min: [1, '수량은 1개 이상이어야 합니다'],
    validate: { validator: Number.isInteger, message: '수량은 정수여야 합니다' },
  },
  thumbnail: { type: String },
});

const shippingSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: [true, '받는 사람은 필수입니다'], trim: true },
    phone: { type: String, required: [true, '연락처는 필수입니다'], trim: true },
    zipCode: { type: String, required: [true, '우편번호는 필수입니다'], trim: true },
    address1: { type: String, required: [true, '주소는 필수입니다'], trim: true },
    address2: { type: String, trim: true, default: '' },
    memo: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const amountsSchema = new mongoose.Schema(
  {
    itemsTotal: { type: Number, required: true, min: [0, '상품 금액은 0 이상이어야 합니다'] },
    shippingFee: { type: Number, default: 0, min: [0, '배송비는 0 이상이어야 합니다'] },
    discount: { type: Number, default: 0, min: [0, '할인 금액은 0 이상이어야 합니다'] },
    total: { type: Number, required: true, min: [0, '결제 금액은 0 이상이어야 합니다'] },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자는 필수입니다'],
    },
    items: {
      type: [orderItemSchema],
      validate: { validator: (items) => items.length > 0, message: '주문 상품은 최소 1개 이상이어야 합니다' },
    },
    shipping: { type: shippingSchema, required: [true, '배송 정보는 필수입니다'] },
    amounts: { type: amountsSchema, required: [true, '금액 정보는 필수입니다'] },
    status: {
      type: String,
      enum: { values: ORDER_STATUSES, message: '올바르지 않은 주문 상태입니다: {VALUE}' },
      default: 'pending',
    },
    statusHistory: [
      {
        _id: false,
        status: { type: String, enum: ORDER_STATUSES, required: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

// required 검증 전에 주문번호 생성
orderSchema.pre('validate', function () {
  if (!this.orderNumber) this.orderNumber = generateOrderNumber();
});

// 생성 시 / 상태 변경 시 이력 자동 기록 (save()로 변경할 때만 동작)
orderSchema.pre('save', function () {
  if (this.isNew || this.isModified('status')) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
});

export default mongoose.model('Order', orderSchema);
