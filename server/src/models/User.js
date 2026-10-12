import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, '이름은 필수입니다'], trim: true },
    email: {
      type: String,
      required: [true, '이메일은 필수입니다'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, '올바른 이메일 형식이 아닙니다'],
    },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
