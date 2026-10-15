import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, '주문은 필수입니다'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자는 필수입니다'],
    },
    provider: { type: String, required: true, default: 'toss', trim: true },
    // PG 승인 전(ready)에는 없을 수 있어 sparse
    paymentKey: { type: String, unique: true, sparse: true, trim: true },
    method: { type: String, trim: true }, // 예: 카드, 계좌이체, 간편결제
    amount: { type: Number, required: [true, '결제 금액은 필수입니다'], min: [0, '결제 금액은 0 이상이어야 합니다'] },
    status: {
      type: String,
      enum: { values: ['ready', 'done', 'cancelled', 'failed'], message: '올바르지 않은 결제 상태입니다: {VALUE}' },
      default: 'ready',
    },
    paidAt: { type: Date },
    cancelledAt: { type: Date },
    failReason: { type: String },
    rawResponse: { type: mongoose.Schema.Types.Mixed }, // PG 응답 원본
  },
  { timestamps: true },
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Payment', paymentSchema);
