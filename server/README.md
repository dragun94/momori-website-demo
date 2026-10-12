# Momori Server

Node.js + Express 5 + MongoDB(Mongoose) API 서버

## 시작하기

```bash
npm install
cp .env.example .env   # 값 수정
npm run dev            # 개발 (nodemon 자동 재시작)
npm start              # 운영
```

## 폴더 구조

```
src/
├── server.js          # 진입점: DB 연결 → 서버 실행, 종료 처리
├── app.js             # Express 앱, 미들웨어 등록
├── config/            # 환경변수(env.js), DB 연결(db.js)
├── routes/            # URL → 컨트롤러 연결
├── controllers/       # 요청 처리 로직
├── models/            # Mongoose 스키마
└── middlewares/       # 404, 에러 핸들러
```

## API

| Method | URL | 설명 |
|---|---|---|
| GET | /api/health | 서버/DB 상태 |
| GET | /api/users | 목록 |
| POST | /api/users | 생성 `{ name, email }` |
| GET | /api/users/:id | 조회 |
| PATCH | /api/users/:id | 수정 |
| DELETE | /api/users/:id | 삭제 |
