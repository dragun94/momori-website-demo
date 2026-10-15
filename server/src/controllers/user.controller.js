import User from '../models/User.js';
import { httpError } from '../utils/httpError.js';
import { pick } from '../utils/request.js';

// role은 요청으로 변경 불가 (관리자 지정은 DB에서 직접 / 인증 도입 후 관리자 API로)
const CREATE_FIELDS = ['email', 'password', 'name', 'phone'];
const UPDATE_FIELDS = ['email', 'password', 'name', 'phone'];

async function findUserOrThrow(id) {
  const user = await User.findById(id);
  if (!user) throw httpError(404, '사용자를 찾을 수 없습니다');
  return user;
}

export async function getUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, data: users });
}

export async function getUser(req, res) {
  const user = await findUserOrThrow(req.params.id);
  res.json({ success: true, data: user });
}

export async function createUser(req, res) {
  const user = await User.create(pick(req.body, CREATE_FIELDS));
  res.status(201).json({ success: true, data: user });
}

// 비밀번호 해시가 pre('save')에서 동작하므로 findByIdAndUpdate 대신 save() 사용
export async function updateUser(req, res) {
  const user = await findUserOrThrow(req.params.id);
  user.set(pick(req.body, UPDATE_FIELDS));
  await user.save();
  res.json({ success: true, data: user });
}

export async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw httpError(404, '사용자를 찾을 수 없습니다');
  res.json({ success: true, data: user });
}
