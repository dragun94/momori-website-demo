import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { httpError } from '../utils/httpError.js';
import { getPagination, paginationMeta, pick } from '../utils/request.js';

const PRODUCT_FIELDS = [
  'name', 'slug', 'description', 'price', 'salePrice',
  'images', 'thumbnail', 'category', 'options', 'isActive',
];
const CATEGORY_SUMMARY = 'name slug';

async function assertCategoryExists(categoryId) {
  if (categoryId && !(await Category.exists({ _id: categoryId }))) {
    throw httpError(400, '존재하지 않는 카테고리입니다');
  }
}

// ?category=<id>&active=true&page=1&limit=20
export async function getProducts(req, res) {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.active === 'true') filter.isActive = true;

  const pagination = getPagination(req.query);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', CATEGORY_SUMMARY)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data: products, pagination: paginationMeta(pagination, total) });
}

export async function getProduct(req, res) {
  const product = await Product.findById(req.params.id).populate('category', CATEGORY_SUMMARY);
  if (!product) throw httpError(404, '상품을 찾을 수 없습니다');
  res.json({ success: true, data: product });
}

export async function getProductBySlug(req, res) {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category', CATEGORY_SUMMARY);
  if (!product) throw httpError(404, '상품을 찾을 수 없습니다');
  res.json({ success: true, data: product });
}

export async function createProduct(req, res) {
  const data = pick(req.body, PRODUCT_FIELDS);
  await assertCategoryExists(data.category);
  const product = await Product.create(data);
  res.status(201).json({ success: true, data: product });
}

// salePrice ≤ price 검증이 문서 기준으로 동작하도록 save() 사용
export async function updateProduct(req, res) {
  const data = pick(req.body, PRODUCT_FIELDS);
  await assertCategoryExists(data.category);
  const product = await Product.findById(req.params.id);
  if (!product) throw httpError(404, '상품을 찾을 수 없습니다');
  product.set(data);
  await product.save();
  res.json({ success: true, data: product });
}

// 주문 내역은 스냅샷이라 삭제해도 유지됨. 판매 중지만 하려면 isActive: false
export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw httpError(404, '상품을 찾을 수 없습니다');
  res.json({ success: true, data: product });
}
