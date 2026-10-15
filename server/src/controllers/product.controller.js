import Product from '../models/Product.js';
import { httpError } from '../utils/httpError.js';
import { getPagination, paginationMeta } from '../utils/request.js';

// 쇼핑몰용: 판매 중인 상품만 (관리자용은 controllers/admin/product.controller.js)
const PUBLIC_FILTER = { isActive: true };
const CATEGORY_SUMMARY = 'name slug';

// ?category=<id>&page=1&limit=20
export async function getProducts(req, res) {
  const filter = { ...PUBLIC_FILTER };
  if (req.query.category) filter.category = req.query.category;

  const pagination = getPagination(req.query);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', CATEGORY_SUMMARY)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data: products, pagination: paginationMeta(pagination, total) });
}

export async function getProduct(req, res) {
  const product = await Product.findOne({ _id: req.params.id, ...PUBLIC_FILTER })
    .populate('category', CATEGORY_SUMMARY)
    .lean();
  if (!product) throw httpError(404, '상품을 찾을 수 없습니다');
  res.json({ success: true, data: product });
}

export async function getProductBySlug(req, res) {
  const product = await Product.findOne({ slug: req.params.slug, ...PUBLIC_FILTER })
    .populate('category', CATEGORY_SUMMARY)
    .lean();
  if (!product) throw httpError(404, '상품을 찾을 수 없습니다');
  res.json({ success: true, data: product });
}
