import User from '../models/User.js';

function notFoundError() {
  const err = new Error('사용자를 찾을 수 없습니다');
  err.status = 404;
  return err;
}

export async function getUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ success: true, data: users });
}

export async function getUser(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw notFoundError();
  res.json({ success: true, data: user });
}

export async function createUser(req, res) {
  const { name, email } = req.body;
  const user = await User.create({ name, email });
  res.status(201).json({ success: true, data: user });
}

export async function updateUser(req, res) {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email },
    { returnDocument: 'after', runValidators: true },
  );
  if (!user) throw notFoundError();
  res.json({ success: true, data: user });
}

export async function deleteUser(req, res) {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw notFoundError();
  res.json({ success: true, data: user });
}
