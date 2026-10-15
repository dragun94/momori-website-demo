import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { clearAuthCookie, setAuthCookie, signAuthToken } from '../utils/authToken.js';
import { httpError } from '../utils/httpError.js';
import { pick } from '../utils/request.js';

const SIGNUP_FIELDS = ['email', 'password', 'name', 'phone'];
const LOGIN_FAILED_MESSAGE = '이메일 또는 비밀번호가 맞지 않아요';
// 없는 이메일이어도 비교 연산을 해서 응답 시간으로 가입 여부를 알 수 없게 함
const DUMMY_HASH = bcrypt.hashSync('momori-dummy-password', 10);

// body: { email, password, name, phone?, termsAgreed, marketingAgreed? }
// 가입 후 자동 로그인하지 않음 (클라이언트에서 로그인 페이지로 이동)
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

// body: { email, password, rememberMe? }
// 이메일 없음/비밀번호 틀림을 구분하지 않고 같은 401 응답
export async function login(req, res) {
  const { email, password, rememberMe } = req.body ?? {};
  // 문자열만 허용 ({ $gt: '' } 같은 쿼리 주입 방지)
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    throw httpError(400, '이메일과 비밀번호를 입력해 주세요');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  const matched = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_HASH);
  if (!user || !matched) throw httpError(401, LOGIN_FAILED_MESSAGE);

  setAuthCookie(res, signAuthToken(user._id, rememberMe === true), rememberMe === true);
  res.json({ success: true, data: user }); // toJSON에서 password 제거됨
}

// requireAuth 이후: 현재 로그인한 회원 정보
export async function getMe(req, res) {
  res.json({ success: true, data: req.user });
}

export async function logout(req, res) {
  clearAuthCookie(res);
  res.json({ success: true, data: null });
}
