import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, '상품은 필수입니다'],
  },
  optionSku: { type: String, required: [true, '옵션 SKU는 필수입니다'], uppercase: true, trim: true },
  quantity: {
    type: Number,
    required: [true, '수량은 필수입니다'],
    min: [1, '수량은 1개 이상이어야 합니다'],
    validate: { validator: Number.isInteger, message: '수량은 정수여야 합니다' },
  },
});

const cartSchema = new mongoose.Schema(
  {
    // 회원당 장바구니 1개
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, '사용자는 필수입니다'],
      unique: true,
    },
    items: [cartItemSchema],
  },
  { timestamps: true },
);

export default mongoose.model('Cart', cartSchema);
