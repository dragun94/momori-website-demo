server 폴더의 Mongoose 모델을 쇼핑몰용으로 만들어줘.

## 배경

- 육아용품 단일 브랜드 테스트 쇼핑몰 "모모리" (첫 상품: 턱받이)
- 회원 주문만 가능 (비회원 주문 없음)
- 나중에 토스페이먼츠 같은 PG 결제를 붙일 예정
- 테스트용이라 과하게 복잡할 필요는 없지만, 실제 쇼핑몰에 필요한 필수 요소는 모두 갖출 것

## 작업 전에

1. server/src 구조와 기존 models/User 모델, package.json을 먼저 읽고
   모듈 방식(ESM/CommonJS), 코드 스타일, 네이밍 규칙을 그대로 따라줘.
2. 모든 스키마에 timestamps: true 적용.

## 만들 모델 (server/src/models/)

1. User (기존 모델 확장)
   - email(unique, 소문자), password(bcrypt 해시, select: false), name, phone
   - role: 'user' | 'admin' (기본 'user')
   - addresses: [{ recipient, phone, zipCode, address1, address2, isDefault }]
   - 저장 전 비밀번호 해시, 비밀번호 비교 메서드 추가

2. Category
   - name, slug(unique), order(정렬순서), isActive

3. Product
   - name, slug(unique), description, price, salePrice(선택)
   - images: [String], thumbnail
   - category(Category ref)
   - options: [{ name, sku, stock, extraPrice(기본 0) }] ← 재고는 옵션 단위
   - isActive(판매 여부)

4. Cart
   - user(User ref, unique — 회원당 1개)
   - items: [{ product(ref), optionSku, quantity(최소 1) }]

5. Order
   - orderNumber(unique, 예: 20261015-XXXXXX 형태 자동 생성)
   - user(User ref, required)
   - items: [{ product(ref), productName, optionName, optionSku, price, quantity, thumbnail }]
     ← 주문 당시 정보를 스냅샷으로 저장 (상품이 수정/삭제돼도 주문 내역 유지)
   - shipping: { recipient, phone, zipCode, address1, address2, memo }
   - amounts: { itemsTotal, shippingFee, discount, total }
   - status: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
     (기본 'pending')
   - 상태 변경 이력용 statusHistory: [{ status, changedAt }]

6. Payment
   - order(Order ref), user(User ref)
   - provider(예: 'toss'), paymentKey, method, amount
   - status: 'ready' | 'done' | 'cancelled' | 'failed'
   - paidAt, cancelledAt, failReason
   - rawResponse(PG 응답 원본, Mixed 타입)

## 요구사항

- 필요한 필드에 required, min, enum 등 검증 추가
- 자주 조회하는 필드(user, orderNumber, slug, category)에 인덱스 설정
- bcrypt 등 필요한 패키지가 없으면 설치 명령어 알려줘
- 이번 작업은 모델 파일만. 라우트/컨트롤러는 아직 만들지 마.

## 완료 후

- 만든 파일 목록과 각 모델 간 관계(ref)를 짧게 정리해줘
- README의 폴더 구조/모델 설명도 업데이트해줘
