// 테스트 데이터: 카테고리와 상품만 지우고 다시 생성 (회원·장바구니·주문·결제는 건드리지 않음)
// 실행 (server 폴더에서): npm run seed
import { connectDB, disconnectDB } from '../src/config/db.js';
import Category from '../src/models/Category.js';
import Product from '../src/models/Product.js';

const image = (bg, fg, text) => `https://placehold.co/600x600/${bg}/${fg}/png?text=${encodeURIComponent(text)}`;

const CATEGORIES = [
  { name: '턱받이', slug: 'bibs', order: 0 },
  { name: '손수건', slug: 'handkerchiefs', order: 1 },
  { name: '스타이', slug: 'stai', order: 2 },
];

// 색상 옵션 → { name, sku, stock, extraPrice }
const colors = (prefix, list) =>
  list.map(([name, code, stock, extraPrice = 0]) => ({ name, sku: `${prefix}-${code}`, stock, extraPrice }));

const PRODUCTS = [
  {
    name: '모모리 방수 턱받이',
    slug: 'momori-waterproof-bib',
    description: '음식물이 스며들지 않는 방수 원단 턱받이예요.\n부드러운 목둘레와 똑딱 단추로 아기 피부에 자극이 적어요.',
    price: 15000,
    salePrice: 12000,
    images: [image('fdeee7', 'e59a7f', 'Waterproof Bib'), image('eef3ec', '7f9c7e', 'Waterproof Bib 2')],
    options: colors('BIB-WP', [['피치', 'PEACH', 30], ['세이지', 'SAGE', 12], ['크림', 'CREAM', 4]]),
  },
  {
    name: '모모리 실리콘 이유식 턱받이',
    slug: 'momori-silicone-bib',
    description: '음식 받침 주머니가 있는 실리콘 턱받이예요.\n물로 헹구기만 하면 되어 세척이 간편해요.',
    price: 18000,
    images: [image('f2b8a2', 'ffffff', 'Silicone Bib')],
    options: colors('BIB-SI', [['코랄', 'CORAL', 20], ['그레이', 'GRAY', 0], ['민트', 'MINT', 8, 1000]]),
  },
  {
    name: '모모리 거즈 턱받이 3종 세트',
    slug: 'momori-gauze-bib-set',
    description: '6겹 순면 거즈로 만든 턱받이 3장 세트예요.\n빨수록 부드러워져요.',
    price: 24000,
    salePrice: 19900,
    images: [image('fbf7f1', 'e59a7f', 'Gauze Bib Set'), image('fdeee7', '8c7f77', 'Gauze Bib Set 2')],
    options: colors('BIB-GZ', [['파스텔 세트', 'PASTEL', 15], ['뉴트럴 세트', 'NEUTRAL', 3]]),
  },
  {
    name: '모모리 소매형 전신 턱받이',
    slug: 'momori-sleeved-bib',
    description: '팔까지 덮어 주는 소매형 턱받이예요. 자기주도 이유식 시기에 좋아요.',
    price: 21000,
    images: [image('eef3ec', '4a3f39', 'Sleeved Bib')],
    options: colors('BIB-SL', [['베이지', 'BEIGE', 10], ['네이비', 'NAVY', 6]]),
    isActive: false, // 판매중지 상품 예시
  },
];

try {
  await connectDB();

  const [deletedProducts, deletedCategories] = await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
  console.log(`🧹 기존 상품 ${deletedProducts.deletedCount}개, 카테고리 ${deletedCategories.deletedCount}개 삭제`);

  const categories = await Category.insertMany(CATEGORIES);
  const bibs = categories.find((c) => c.slug === 'bibs');

  // create()로 저장해야 스키마 검증이 모두 실행됨
  for (const product of PRODUCTS) {
    await Product.create({ ...product, category: bibs._id, thumbnail: product.images[0] });
  }
  console.log(`🌱 카테고리 ${categories.length}개, 상품 ${PRODUCTS.length}개 생성 완료`);
} catch (err) {
  console.error('❌ seed 실패:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
