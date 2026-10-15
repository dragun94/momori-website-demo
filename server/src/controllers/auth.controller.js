import User from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { pick } from '../utils/request.js';

const SIGNUP_FIELDS = ['email', 'password', 'name', 'phone'];

// body: { email, password, name, phone?, termsAgreed, marketingAgreed? }
export async function signup(req, res) {
  const { termsAgreed, marketingAgreed } = req.body ?? {};
  if (termsAgreed !== true) throw httpError(400, '필수 약관에 동의해 주세요');

  const data = pick(req.body, SIGNUP_FIELDS);
  // unique 에러(409) 메시지 대신 친절한 안내를 위해 먼저 확인
  if (data.email && (await User.exists({ email: String(data.email).trim().toLowerCase() }))) {
    throw httpError(409, '이미 가입된 이메일이에요.');
  }

  const now = new Date();
  const user = await User.create({
    ...data,
    termsAgreedAt: now,
    marketingAgreed: marketingAgreed === true,
    marketingAgreedAt: marketingAgreed === true ? now : undefined,
  });
  res.status(201).json({ success: true, data: user });
}
