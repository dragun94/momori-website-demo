import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  name: { type: String, required: [true, '옵션 이름은 필수입니다'], trim: true },
  sku: { type: String, required: [true, 'SKU는 필수입니다'], uppercase: true, trim: true },
  stock: {
    type: Number,
    required: [true, '재고는 필수입니다'],
    min: [0, '재고는 0 이상이어야 합니다'],
    validate: { validator: Number.isInteger, message: '재고는 정수여야 합니다' },
  },
  extraPrice: { type: Number, default: 0, min: [0, '추가 금액은 0 이상이어야 합니다'] },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, '상품명은 필수입니다'], trim: true },
    slug: {
      type: String,
      required: [true, 'slug는 필수입니다'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'slug는 영소문자, 숫자, 하이픈(-)만 사용할 수 있습니다'],
    },
    description: { type: String, default: '' },
    price: { type: Number, required: [true, '가격은 필수입니다'], min: [0, '가격은 0 이상이어야 합니다'] },
    salePrice: {
      type: Number,
      min: [0, '할인가는 0 이상이어야 합니다'],
      validate: {
        // save 시에만 정확히 동작 (update 쿼리에서는 this가 문서가 아님)
        validator(value) {
          return value == null || typeof this.price !== 'number' || value <= this.price;
        },
        message: '할인가는 정가보다 클 수 없습니다',
      },
    },
    images: [{ type: String, trim: true }],
    thumbnail: { type: String, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, '카테고리는 필수입니다'],
    },
    options: {
      type: [optionSchema],
      validate: [
        {
          validator: (options) => options.length > 0,
          message: '옵션은 최소 1개 이상이어야 합니다',
        },
        {
          validator: (options) => new Set(options.map((o) => o.sku)).size === options.length,
          message: '같은 상품 안에 중복된 SKU가 있습니다',
        },
      ],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, isActive: 1 });
// SKU는 전체 상품에서 유일 (장바구니/주문에서 SKU로 옵션을 찾기 때문)
productSchema.index({ 'options.sku': 1 }, { unique: true });

export default mongoose.model('Product', productSchema);
