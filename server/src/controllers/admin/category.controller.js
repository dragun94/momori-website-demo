import mongoose from 'mongoose';
import Category from '../../models/Category.js';
import Product from '../../models/Product.js';
import { httpError } from '../../utils/httpError.js';
import { pick } from '../../utils/request.js';

const CATEGORY_FIELDS = ['name', 'slug', 'isActive'];

async function assertSlugAvailable(slug, excludeId) {
  if (!slug) return;
  const filter = { slug: String(slug).trim().toLowerCase() };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Category.exists(filter)) throw httpError(409, '이미 사용 중인 slug예요. 다른 값을 입력해 주세요');
}

// 정렬 순서대로 + 카테고리별 상품 수
async function listCategoriesWithCount() {
  const [categories, counts] = await Promise.all([
    Category.find().sort({ order: 1, createdAt: 1 }).lean(),
    Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  return categories.map((c) => ({ ...c, productCount: countMap.get(String(c._id)) ?? 0 }));
}

export async function getCategories(req, res) {
  res.json({ success: true, data: await listCategoriesWithCount() });
}

// 새 카테고리는 맨 뒤 순서로 추가
export async function createCategory(req, res) {
  const data = pick(req.body, CATEGORY_FIELDS);
  await assertSlugAvailable(data.slug);
  const last = await Category.findOne().sort({ order: -1 }).select('order').lean();
  const category = await Category.create({ ...data, order: (last?.order ?? -1) + 1 });
  res.status(201).json({ success: true, data: category });
}

export async function updateCategory(req, res) {
  const data = pick(req.body, CATEGORY_FIELDS);
  await assertSlugAvailable(data.slug, req.params.id);
  const category = await Category.findByIdAndUpdate(req.params.id, data, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!category) throw httpError(404, '카테고리를 찾을 수 없어요');
  res.json({ success: true, data: category });
}

// body: { ids: [카테고리 id, ...] } — 배열 순서대로 order를 0, 1, 2...로 저장
export async function reorderCategories(req, res) {
  const { ids } = req.body ?? {};
  if (!Array.isArray(ids) || !ids.every((id) => mongoose.isValidObjectId(id))) {
    throw httpError(400, '순서를 바꿀 카테고리 목록이 올바르지 않아요');
  }
  await Category.bulkWrite(
    ids.map((id, index) => ({ updateOne: { filter: { _id: id }, update: { $set: { order: index } } } })),
  );
  res.json({ success: true, data: await listCategoriesWithCount() });
}

// 상품이 있는 카테고리는 삭제 불가 (상품의 category 참조가 깨지지 않도록)
export async function deleteCategory(req, res) {
  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    throw httpError(409, `상품 ${productCount}개가 등록되어 있어 삭제할 수 없어요. 상품의 카테고리를 먼저 바꾸거나 노출을 꺼 주세요`);
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw httpError(404, '카테고리를 찾을 수 없어요');
  res.json({ success: true, data: category });
}
