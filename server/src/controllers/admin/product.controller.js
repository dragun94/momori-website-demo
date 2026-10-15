import Category from '../../models/Category.js';
import Product from '../../models/Product.js';
import { deleteFile } from '../../services/storage.service.js';
import { httpError } from '../../utils/httpError.js';
import { escapeRegex, getPagination, paginationMeta, pick } from '../../utils/request.js';

const PRODUCT_FIELDS = [
  'name', 'slug', 'description', 'price', 'salePrice',
  'images', 'thumbnail', 'category', 'options', 'isActive',
];

async function findProductOrThrow(id) {
  const product = await Product.findById(id);
  if (!product) throw httpError(404, '상품을 찾을 수 없어요');
  return product;
}

async function assertCategoryExists(categoryId) {
  if (categoryId && !(await Category.exists({ _id: categoryId }))) {
    throw httpError(400, '존재하지 않는 카테고리예요');
  }
}

async function assertSlugAvailable(slug, excludeId) {
  if (!slug) return;
  const filter = { slug: String(slug).trim().toLowerCase() };
  if (excludeId) filter._id = { $ne: excludeId };
  if (await Product.exists(filter)) throw httpError(409, '이미 사용 중인 slug예요. 다른 값을 입력해 주세요');
}

// SKU는 전체 상품에서 유일해야 함 → 어느 상품과 겹치는지 알려줌
async function assertSkusAvailable(options, excludeId) {
  if (!Array.isArray(options)) return;
  const skus = options.map((o) => String(o?.sku ?? '').trim().toUpperCase()).filter(Boolean);
  const filter = { 'options.sku': { $in: skus } };
  if (excludeId) filter._id = { $ne: excludeId };
  const duplicated = await Product.findOne(filter).select('name options.sku').lean();
  if (duplicated) {
    const conflicts = duplicated.options.map((o) => o.sku).filter((sku) => skus.includes(sku));
    throw httpError(409, `다른 상품(${duplicated.name})에서 이미 사용 중인 SKU예요: ${conflicts.join(', ')}`);
  }
}

// 대표 이미지는 항상 images 중 하나 (없거나 삭제됐으면 첫 번째)
function normalizeThumbnail(data, current) {
  if (data.images === undefined) return data;
  const images = Array.isArray(data.images) ? data.images : [];
  const thumbnail = data.thumbnail ?? current?.thumbnail;
  return { ...data, images, thumbnail: images.includes(thumbnail) ? thumbnail : (images[0] ?? null) };
}

function withTotalStock(product) {
  return { ...product, totalStock: product.options.reduce((sum, o) => sum + o.stock, 0) };
}

// ?q=상품명&category=<id>&status=active|inactive&page=1&limit=20
export async function getProducts(req, res) {
  const filter = {};
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'inactive') filter.isActive = false;

  const pagination = getPagination(req.query);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, data: products.map(withTotalStock), pagination: paginationMeta(pagination, total) });
}

// 수정 폼용: category는 id 그대로
export async function getProduct(req, res) {
  const product = await findProductOrThrow(req.params.id);
  res.json({ success: true, data: product });
}

export async function createProduct(req, res) {
  const data = normalizeThumbnail(pick(req.body, PRODUCT_FIELDS));
  await Promise.all([
    assertCategoryExists(data.category),
    assertSlugAvailable(data.slug),
    assertSkusAvailable(data.options),
  ]);
  const product = await Product.create(data);
  res.status(201).json({ success: true, data: product });
}

// 일부 필드만 보내도 됨 (예: 판매 여부 토글 { isActive: false })
// salePrice ≤ price 검증이 문서 기준으로 동작하도록 save() 사용
export async function updateProduct(req, res) {
  const product = await findProductOrThrow(req.params.id);
  const data = normalizeThumbnail(pick(req.body, PRODUCT_FIELDS), product);
  await Promise.all([
    assertCategoryExists(data.category),
    assertSlugAvailable(data.slug, product._id),
    assertSkusAvailable(data.options, product._id),
  ]);
  const previousImages = [...product.images];
  product.set(data);
  await product.save();
  res.json({ success: true, data: product });

  // 저장이 끝난 뒤, 빠진 이미지를 저장소(Cloudinary)에서도 삭제 (실패해도 상품 수정에는 영향 없음)
  if (data.images !== undefined) removeUnusedImages(previousImages.filter((url) => !product.images.includes(url)));
}

// 다른 상품에서도 쓰는 이미지는 남겨 둠
async function removeUnusedImages(urls) {
  for (const url of urls) {
    try {
      if (!(await Product.exists({ images: url }))) await deleteFile(url);
    } catch (err) {
      console.error('⚠️  이미지 삭제 실패:', url, err.message);
    }
  }
}
