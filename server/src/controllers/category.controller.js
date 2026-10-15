import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { httpError } from '../utils/httpError.js';
import { pick } from '../utils/request.js';

const CATEGORY_FIELDS = ['name', 'slug', 'order', 'isActive'];

// ?active=true 이면 노출 중인 카테고리만
export async function getCategories(req, res) {
  const filter = req.query.active === 'true' ? { isActive: true } : {};
  const categories = await Category.find(filter).sort({ order: 1, createdAt: 1 });
  res.json({ success: true, data: categories });
}

export async function getCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw httpError(404, '카테고리를 찾을 수 없습니다');
  res.json({ success: true, data: category });
}

export async function createCategory(req, res) {
  const category = await Category.create(pick(req.body, CATEGORY_FIELDS));
  res.status(201).json({ success: true, data: category });
}

export async function updateCategory(req, res) {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    pick(req.body, CATEGORY_FIELDS),
    { returnDocument: 'after', runValidators: true },
  );
  if (!category) throw httpError(404, '카테고리를 찾을 수 없습니다');
  res.json({ success: true, data: category });
}

// 상품이 남아있는 카테고리는 삭제 불가 (숨기려면 isActive: false)
export async function deleteCategory(req, res) {
  if (await Product.exists({ category: req.params.id })) {
    throw httpError(409, '상품이 등록된 카테고리는 삭제할 수 없습니다');
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw httpError(404, '카테고리를 찾을 수 없습니다');
  res.json({ success: true, data: category });
}
