import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, '카테고리 이름은 필수입니다'], trim: true },
    slug: {
      type: String,
      required: [true, 'slug는 필수입니다'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'slug는 영소문자, 숫자, 하이픈(-)만 사용할 수 있습니다'],
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ isActive: 1, order: 1 });

export default mongoose.model('Category', categorySchema);
