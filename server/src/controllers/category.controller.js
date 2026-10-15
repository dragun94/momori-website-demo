import Category from '../models/Category.js';
import { httpError } from '../utils/httpError.js';

// 쇼핑몰용: 노출 중인 카테고리만 (관리자용은 controllers/admin/category.controller.js)
const PUBLIC_FILTER = { isActive: true };

export async function getCategories(req, res) {
  const categories = await Category.find(PUBLIC_FILTER).sort({ order: 1, createdAt: 1 }).lean();
  res.json({ success: true, data: categories });
}

export async function getCategory(req, res) {
  const category = await Category.findOne({ _id: req.params.id, ...PUBLIC_FILTER }).lean();
  if (!category) throw httpError(404, '카테고리를 찾을 수 없습니다');
  res.json({ success: true, data: category });
}
