# Momori Server

Node.js + Express 5 + MongoDB(Mongoose) API 서버

## 시작하기

```bash
npm install
cp .env.example .env   # 값 수정 (JWT_SECRET은 반드시 무작위 문자열로)
npm run dev            # 개발 (nodemon 자동 재시작)
npm start              # 운영

npm run seed                         # 테스트 데이터: 카테고리·상품만 지우고 다시 생성 (회원·주문 유지)
npm run make-admin -- 이메일          # 해당 회원을 관리자로 지정
```

## 폴더 구조

```
src/
├── server.js          # 진입점: DB 연결 → 서버 실행, 종료 처리
├── app.js             # Express 앱, 미들웨어 등록
├── config/            # 환경변수(env.js), DB 연결(db.js)
├── routes/            # 주소(URL) → 컨트롤러 연결만 담당 (로직 없음)
│   ├── index.js       # /api 아래에 각 라우트 등록
│   ├── admin/              # /api/admin/* 관리자 전용 (requireAuth + requireAdmin)
│   ├── auth.routes.js      # 회원가입, 로그인/로그아웃, 내 정보
│   ├── user.routes.js
│   ├── address.routes.js   # /users/:userId/addresses
│   ├── category.routes.js
│   ├── product.routes.js
│   ├── cart.routes.js
│   ├── order.routes.js
│   └── payment.routes.js
├── controllers/       # 기능(요청 처리 로직): 라우트 파일과 1:1 대응
├── services/          # 여러 컨트롤러가 함께 쓰는 로직
│   ├── order.service.js    # 재고 차감/복구, 주문 상태 변경 규칙
│   └── storage.service.js  # 이미지 저장 (Cloudinary, 키가 없으면 로컬 uploads/)
├── utils/             # httpError(에러 생성), request(pick, 페이지네이션), authToken(JWT·쿠키)
├── models/            # Mongoose 스키마
│   ├── User.js        # 회원 (비밀번호 해시, 배송지 목록)
│   ├── Category.js    # 카테고리
│   ├── Product.js     # 상품 (옵션 단위 재고)
│   ├── Cart.js        # 장바구니 (회원당 1개)
│   ├── Order.js       # 주문 (상품 스냅샷, 상태 이력)
│   └── Payment.js     # 결제 (PG 연동용)
└── middlewares/       # 404, 에러 핸들러, auth(requireAuth/requireAdmin), rateLimit(로그인 시도 제한)
```

## 모델

모든 스키마에 `timestamps: true` (createdAt / updatedAt) 적용.

| 모델 | 주요 필드 | 참조(ref) |
|---|---|---|
| User | email(unique), password(해시, `select: false`), name, phone, role(`user`/`admin`), addresses[], termsAgreedAt, marketingAgreed, marketingAgreedAt | - |
| Category | name, slug(unique), order, isActive | - |
| Product | name, slug(unique), description, price, salePrice, images[], thumbnail, options[{ name, sku, stock, extraPrice }], isActive | category → Category |
| Cart | items[{ product, optionSku, quantity }] | user → User (unique), items.product → Product |
| Order | orderNumber(자동, `20261015-XXXXXX`), items[](스냅샷), shipping, amounts, status, statusHistory[] | user → User, items.product → Product |
| Payment | provider, paymentKey, method, amount, status, paidAt, cancelledAt, failReason, rawResponse | order → Order, user → User |

```
User ─┬─< Cart(1:1) ──> Product ──> Category
      ├─< Order ─────> Product (참고용, 실제 표시는 스냅샷)
      └─< Payment ───> Order
```

참고
- 비밀번호는 저장 시 자동 해시. 로그인 시 `User.findOne({ email }).select('+password')` 후 `user.comparePassword(pw)`.
- 재고는 `Product.options[].stock`에 옵션 단위로 관리. SKU는 전체 상품에서 유일.
- 주문 상품은 주문 당시 이름/옵션/가격/썸네일을 복사해 저장 → 상품이 수정·삭제돼도 주문 내역 유지.
- `Order.statusHistory`는 `save()`로 상태를 바꿀 때만 자동 기록됨 (`findByIdAndUpdate`로는 기록 안 됨).
- 주문 상태: `pending` → `paid` → `preparing` → `shipped` → `delivered` / `cancelled` / `refunded`
- 결제 상태: `ready` / `done` / `cancelled` / `failed`

## API

모든 응답 형식: `{ success, data }` (목록 페이지네이션 시 `pagination` 추가) / 에러: `{ success: false, message }`

> ⚠️ 아직 인증(로그인)이 없어서 사용자 ID를 URL/body로 직접 넘깁니다. 인증 도입 후 토큰에서 꺼내도록 바꿀 예정.

### 인증 `/api/auth`
| Method | URL | 설명 |
|---|---|---|
| POST | /api/auth/signup | 회원가입 `{ email, password, name, phone?, termsAgreed, marketingAgreed? }` (자동 로그인 안 함) |
| POST | /api/auth/login | 로그인 `{ email, password, rememberMe? }` → 쿠키 발급 + 회원 정보 |
| GET | /api/auth/me | 현재 로그인한 회원 정보 (없거나 만료 시 401) |
| POST | /api/auth/logout | 로그아웃 (쿠키 삭제) |

- `termsAgreed: true`가 아니면 400 (필수 약관: 이용약관·개인정보·만 14세 이상). 동의 시각은 `termsAgreedAt`에 저장.
- 마케팅 동의 시 `marketingAgreed`, `marketingAgreedAt` 저장. 이미 가입된 이메일은 409.
- 비밀번호: 8자 이상, 영문+숫자 포함 (저장 시 bcrypt 해시).
- 로그인 실패는 이메일 없음/비밀번호 틀림 구분 없이 401 "이메일 또는 비밀번호가 맞지 않아요".
- 로그인 시도 제한: IP당 15분에 실패 10회 초과 시 429 (성공한 로그인은 횟수에서 제외).

**인증 방식**: JWT를 httpOnly 쿠키(`momori_token`, sameSite=lax, 운영에서만 secure)에 저장.
- 기본: 토큰 유효기간 `JWT_EXPIRES_IN`(1일), 쿠키는 브라우저를 닫으면 삭제되는 세션 쿠키
- 로그인 상태 유지(`rememberMe: true`): 토큰·쿠키 모두 30일

**보호 미들웨어** (`middlewares/auth.js`)
```js
router.get('/me', requireAuth, handler);           // 로그인 필요 → req.user 사용 가능 (실패 시 401)
router.use(requireAuth, requireAdmin);              // 관리자 전용 (role이 admin이 아니면 403)
```

### 회원 `/api/users`
| Method | URL | 설명 |
|---|---|---|
| GET | /api/health | 서버/DB 상태 |
| GET | /api/users | 목록 |
| POST | /api/users | 생성 `{ email, password, name, phone? }` |
| GET | /api/users/:id | 조회 |
| PATCH | /api/users/:id | 수정 (비밀번호 변경 시 자동 해시) |
| DELETE | /api/users/:id | 삭제 |

`role`은 API로 변경 불가 (관리자 지정은 DB에서 직접).

### 배송지 `/api/users/:userId/addresses`
| Method | URL | 설명 |
|---|---|---|
| GET | / | 배송지 목록 |
| POST | / | 추가 `{ recipient, phone, zipCode, address1, address2?, isDefault? }` |
| PATCH | /:addressId | 수정 |
| DELETE | /:addressId | 삭제 |

기본 배송지는 항상 1개로 유지 (첫 주소는 자동 기본, 기본 주소 삭제 시 첫 번째가 기본).

### 카테고리·상품 (쇼핑몰용, 조회 전용)
| Method | URL | 설명 |
|---|---|---|
| GET | /api/categories | 노출 중인 카테고리 (order 순) |
| GET | /api/categories/:id | 조회 |
| GET | /api/products | 판매 중인 상품. `?category=<id>&page=1&limit=20` |
| GET | /api/products/slug/:slug | slug로 조회 (상품 상세용) |
| GET | /api/products/:id | 조회 |

숨김 카테고리·판매중지 상품은 404. 등록/수정은 아래 관리자 API로만 가능.

### 장바구니 `/api/carts/:userId`
| Method | URL | 설명 |
|---|---|---|
| GET | /:userId | 조회 (없으면 빈 장바구니 생성) |
| DELETE | /:userId | 비우기 |
| POST | /:userId/items | 담기 `{ product, optionSku, quantity? }` — 같은 옵션은 수량 합산 |
| PATCH | /:userId/items/:itemId | 수량 변경 `{ quantity }` |
| DELETE | /:userId/items/:itemId | 빼기 |

담기/수량 변경 시 판매 여부와 재고를 확인합니다.

### 주문 `/api/orders`
| Method | URL | 설명 |
|---|---|---|
| GET | / | 목록. `?user=<id>&status=paid&page=1&limit=20` |
| POST | / | 생성 `{ user, items?, shipping? }` |
| GET | /number/:orderNumber | 주문번호로 조회 |
| GET | /:id | 조회 |
| PATCH | /:id | 배송지 수정 `{ shipping }` (출고 전까지만) |
| PATCH | /:id/status | 상태 변경 `{ status }` |
| DELETE | /:id | 삭제 (pending / cancelled만) |

- `items`를 생략하면 **장바구니 전체를 주문**하고 장바구니를 비움. `shipping`을 생략하면 **기본 배송지** 사용.
- 가격·금액은 서버가 상품 정보로 계산 (클라이언트가 보낸 가격은 무시). 배송비 3,000원, 50,000원 이상 무료.
- 주문 생성 시 재고 차감, 취소/환불 시 재고 복구.
- 상태 변경 규칙: `pending`→paid/cancelled, `paid`→preparing/cancelled/refunded, `preparing`→shipped/cancelled/refunded, `shipped`→delivered, `delivered`→refunded

### 결제 `/api/payments`
| Method | URL | 설명 |
|---|---|---|
| GET | / | 목록. `?order=<id>&user=<id>&status=done` |
| POST | / | 생성 `{ order, amount, provider?, method? }` — 금액이 주문 금액과 다르면 400 |
| GET | /:id | 조회 |
| PATCH | /:id | 수정 `{ status, paymentKey, method, failReason, rawResponse }` |
| DELETE | /:id | 삭제 |

결제 `status: 'done'` → paidAt 기록 + 주문 `paid`, `'cancelled'` → cancelledAt 기록 + 주문 취소(재고 복구).

### 관리자 `/api/admin` (관리자만 — 비로그인 401, 일반 회원 403)
| Method | URL | 설명 |
|---|---|---|
| GET | /api/admin/categories | 전체 카테고리 + 상품 수(`productCount`) |
| POST | /api/admin/categories | 추가 `{ name, slug, isActive? }` (맨 뒤 순서로) |
| PATCH | /api/admin/categories/reorder | 순서 변경 `{ ids: [...] }` (배열 순서대로) |
| PATCH | /api/admin/categories/:id | 수정 |
| DELETE | /api/admin/categories/:id | 삭제 (상품이 있으면 409) |
| GET | /api/admin/products | 목록. `?q=상품명&category=<id>&status=active|inactive&page=1` (20개씩, `totalStock` 포함) |
| GET | /api/admin/products/:id | 조회 (수정 폼용) |
| POST | /api/admin/products | 등록 |
| PATCH | /api/admin/products/:id | 수정 (일부 필드만 가능, 예: `{ isActive: false }`) |
| POST | /api/admin/uploads | 이미지 업로드 (multipart, field `images`) → 이미지 주소 배열 |
| POST | /api/admin/uploads/url | 이미지 주소로 올리기 `{ url }` → Cloudinary가 가져와 저장한 주소 (Cloudinary 설정 필요) |

- 상품 수정 시 빠진 이미지는 저장소(Cloudinary)에서도 삭제 (다른 상품이 쓰는 이미지는 유지).
- 상품 **삭제 API는 없음**: 주문 기록 보호를 위해 판매중지(`isActive: false`)로 처리.
- slug·SKU 중복은 409 + 어느 값이 겹치는지 안내. 대표 이미지(`thumbnail`)는 항상 `images` 중 하나로 자동 보정.
- 업로드: jpg/png/webp, 1장당 5MB, 한 번에 최대 10장. 파일 내용(시그니처)까지 확인.
- 저장소: `.env`에 `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`이 모두 있으면
  **Cloudinary**(`momori/products/` 폴더)에 저장하고 `https://res.cloudinary.com/...` 주소를 반환.
  비어 있으면 `server/uploads/products/`에 저장하고 `/uploads/...`로 제공 (키 없이 개발할 때용, git 제외).
  서버 시작 로그에 현재 저장소가 표시됨.

