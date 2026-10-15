모모리 쇼핑몰의 관리자 페이지 1단계를 만들어줘.
이번 범위: 관리자 접근 제어 + 관리자 레이아웃 + 카테고리 관리 + 상품 관리

## 배경

- 육아용품 단일 브랜드 테스트 쇼핑몰 "모모리"
- 회원가입/로그인(JWT httpOnly 쿠키), AuthContext, ProtectedRoute,
  requireAuth/requireAdmin 미들웨어가 이미 구현되어 있음
- Category, Product 모델이 이미 있음 (Product는 옵션 단위 재고: options[{ name, sku, stock, extraPrice }])

## 작업 전에

1. 기존 auth 관련 파일, Category/Product 모델, 미들웨어, client의 공통 컴포넌트와
   스타일 방식을 먼저 읽고 그대로 따라줘.
2. 모델에 부족한 필드가 있으면 수정 전에 무엇을 바꿀지 먼저 알려줘.

## 1. 관리자 접근 제어

- 서버: 모든 관리자 API는 /api/admin/... 경로, requireAuth + requireAdmin 적용
- 클라이언트: AdminRoute 컴포넌트 — 비로그인은 /login, 일반 회원은 메인(/)으로 이동
- 첫 관리자 계정용 스크립트: server/scripts/makeAdmin.js
  (실행: node scripts/makeAdmin.js 이메일 → 해당 회원 role을 admin으로 변경)
  package.json에 npm run make-admin 스크립트도 추가
- 헤더: admin 회원으로 로그인 시 "관리자" 링크 표시

## 2. 관리자 레이아웃 (/admin)

- PC 중심 (최소 1024px 기준), 모바일은 사이드바를 햄버거 메뉴로 접기만
- 왼쪽 사이드바: 대시보드 / 상품 관리 / 카테고리 관리 / 주문 관리 / 회원 관리
  (주문·회원·대시보드는 "준비 중" 빈 화면만)
- 상단: "모모리 관리자" + 로그인한 관리자 이름 + 쇼핑몰로 가기 + 로그아웃
- 디자인: 쇼핑몰보다 단순하고 정돈된 업무용 화면, 브랜드 컬러는 포인트로만
- 공통 컴포넌트: 테이블, 페이지네이션, 검색창, 확인 모달, 토스트 알림

## 3. 카테고리 관리 (/admin/categories)

- API: GET / POST / PATCH /:id / DELETE /:id (/api/admin/categories)
- 목록: 이름, slug, 정렬순서, 노출 여부, 상품 수
- 추가·수정은 모달로 (slug는 이름 입력 시 자동 생성하되 수정 가능, 중복 시 오류 안내)
- 순서 변경: 위/아래 버튼으로 간단하게
- 삭제: 해당 카테고리에 상품이 있으면 삭제 막고 안내

## 4. 상품 관리 (/admin/products)

- API (/api/admin/products)
  · GET: 검색(상품명), 카테고리 필터, 판매 여부 필터, 페이지네이션(20개씩)
  · GET /:id, POST, PATCH /:id
  · DELETE 대신 판매중지 처리(isActive: false) — 주문 기록 보호
- 목록 화면: 대표 이미지 썸네일, 상품명, 카테고리, 가격/할인가, 총 재고(옵션 합계),
  판매 여부 토글, 수정 버튼
  · 총 재고 0이면 "품절", 5개 이하면 "재고 부족" 뱃지
- 등록/수정 화면 (/admin/products/new, /admin/products/:id/edit — 같은 폼 재사용)
  · 상품명, slug(자동 생성 + 수정 가능), 카테고리 선택, 설명(여러 줄)
  · 가격, 할인가(선택, 가격보다 크면 오류)
  · 옵션: 행 추가/삭제 방식 — 옵션명, SKU(자동 생성 + 수정 가능), 재고, 추가금액
  옵션은 최소 1개 필수
  · 판매 여부
  · 저장 전 유효성 검사, 수정 중 페이지 이탈 시 확인

## 5. 이미지 업로드

- 테스트 단계라 서버 로컬 저장: multer 사용, server/uploads/products/ 에 저장
- POST /api/admin/uploads (관리자 전용), jpg/png/webp만, 1장당 5MB 이하, 한 번에 최대 10장
- 파일명은 중복되지 않게 자동 생성, /uploads 경로로 정적 제공
- uploads 폴더는 .gitignore에 추가
- 저장 로직은 별도 파일(services/storage 등)로 분리해서
  나중에 Cloudinary/S3로 바꿀 때 그 파일만 고치면 되게 해줘
- 상품 폼: 여러 장 업로드, 미리보기, 삭제, 순서 변경, 대표 이미지 지정(thumbnail)

## 6. 테스트 데이터

- server/scripts/seed.js: 카테고리 2~3개(예: 턱받이, 손수건, 스타이),
  턱받이 상품 3~4개(색상 옵션 포함) 생성, 이미지는 placeholder URL
- npm run seed 스크립트 추가, 실행 시 기존 상품·카테고리만 지우고 다시 생성
  (회원·주문 데이터는 건드리지 않기)

## 범위

- 주문 관리, 회원 관리, 대시보드 실제 기능은 아직 만들지 마.
- 쇼핑몰 쪽 상품 목록/상세 페이지도 아직 만들지 마.

## 완료 후

- 만든/수정한 파일 목록
- 관리자 계정 만드는 방법과 seed 실행 방법
- 테스트 순서: 관리자 지정 → 로그인 → /admin 접근 → 카테고리 추가 →
  이미지 포함 상품 등록 → 수정 → 판매중지 → 일반 회원으로 /admin 접근 시 차단되는지
