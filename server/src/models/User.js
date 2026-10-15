import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

const addressSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: [true, '받는 사람은 필수입니다'], trim: true },
    phone: { type: String, required: [true, '연락처는 필수입니다'], trim: true },
    zipCode: { type: String, required: [true, '우편번호는 필수입니다'], trim: true },
    address1: { type: String, required: [true, '주소는 필수입니다'], trim: true },
    address2: { type: String, trim: true, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, '이메일은 필수입니다'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, '올바른 이메일 형식이 아닙니다'],
    },
    password: {
      type: String,
      required: [true, '비밀번호는 필수입니다'],
      minlength: [8, '비밀번호는 8자 이상이어야 합니다'],
      // 검증은 해시 전(pre save보다 먼저) 평문 기준으로 실행됨
      match: [/^(?=.*[A-Za-z])(?=.*\d)/, '비밀번호는 영문과 숫자를 함께 사용해야 합니다'],
      select: false,
    },
    name: { type: String, required: [true, '이름은 필수입니다'], trim: true },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: { values: ['user', 'admin'], message: '올바르지 않은 권한입니다: {VALUE}' },
      default: 'user',
    },
    addresses: [addressSchema],
    // 필수 약관(이용약관, 개인정보, 만 14세 이상) 동의 시각
    termsAgreedAt: { type: Date },
    // 마케팅 수신 동의는 동의 여부와 시각을 함께 기록
    marketingAgreed: { type: Boolean, default: false },
    marketingAgreedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      // 생성 직후 문서에는 password가 남아있으므로 응답에서 항상 제거
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  },
);

// 비밀번호가 새로 설정/변경된 경우에만 해시
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// 사용 시 select('+password')로 조회해야 함
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

export default mongoose.model('User', userSchema);
