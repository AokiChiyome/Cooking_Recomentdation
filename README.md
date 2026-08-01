# Backend Node.js + TypeScript + CockroachDB (Auth: Login/Register)

Backend mẫu dùng **Express + TypeScript**, ORM **Prisma** (kết nối **CockroachDB** qua giao thức Postgres), xác thực bằng **JWT (access + refresh token)**, có sẵn **middleware** (auth, validate, error handler, logger).

`prisma/schema.prisma` được viết khớp **chính xác** với schema recipe/ingredient bạn cung cấp (`users`, `categories`, `ingredients`, `ingredient_category`, `recipes`, `units`, `recipe_ingredients`, `recipe_steps`, `user_ingredients`, `recipe_categories`, `recipe_recipe_categories`), có thêm bảng `refresh_tokens` (không có trong script gốc, cần thiết để lưu/thu hồi refresh token).

### ⚠️ Lưu ý quan trọng về bảng `users`

Cột `created_by` / `updated_by` trong `users` là `NOT NULL` nhưng **không có ràng buộc FK** trỏ về chính bảng `users` (khác với `categories`, `recipes`... có FK rõ ràng). Vì vậy khi đăng ký user đầu tiên, chưa có ai để tham chiếu — code trong `auth.service.ts` xử lý bằng cách **tự sinh UUID trước** rồi cho user tự tham chiếu chính mình (`created_by = updated_by = user_id` của chính họ). Nếu sau này bạn muốn user được tạo bởi admin/hệ thống khác, chỉnh lại logic này cho phù hợp.

Bảng `users` hiện **chưa có cột `role`**, nên middleware phân quyền theo vai trò chưa được thêm; `auth.middleware.ts` chỉ có `authenticate` (xác thực JWT). Có thể mở rộng sau khi thêm cột role.

## 1. Cấu trúc thư mục

```
backend/
├── prisma/
│   └── schema.prisma        # Model User, RefreshToken
├── src/
│   ├── config/
│   │   ├── env.ts           # Đọc & validate biến môi trường
│   │   └── prisma.ts        # Prisma client singleton
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts       # authenticate, authorize
│   │   ├── validate.middleware.ts   # validate body bằng zod
│   │   ├── error.middleware.ts      # errorHandler, notFoundHandler
│   │   └── requestLogger.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   └── auth.service.ts  # business logic (register/login/refresh/logout)
│   ├── validators/
│   │   └── auth.validator.ts # zod schemas
│   ├── utils/
│   │   ├── ApiError.ts
│   │   ├── asyncHandler.ts
│   │   └── jwt.ts
│   ├── types/
│   │   └── express.d.ts     # mở rộng Request có req.user
│   ├── app.ts                # khởi tạo express app + middleware
│   └── server.ts             # entry point
├── .env.example
├── package.json
└── tsconfig.json
```

## 2. Cài đặt CockroachDB (local, chế độ insecure - cho dev)

```bash
# Tải & chạy 1 node CockroachDB local
cockroach start-single-node --insecure --listen-addr=localhost:26257

# Tạo database
cockroach sql --insecure --host=localhost:26257 -e "CREATE DATABASE backend_db;"
```

> Nếu dùng **CockroachDB Cloud (Serverless)**, lấy connection string trong dashboard và điền vào `DATABASE_URL` (dạng `sslmode=verify-full`).

## 3. Cài đặt dự án

```bash
npm install
cp .env.example .env
# sửa lại DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET trong .env

npx prisma generate
```

Có 2 cách tạo bảng, chọn 1:

**Cách A — dùng đúng script SQL gốc của bạn** (khuyến nghị vì đã test kỹ):
```bash
cockroach sql --insecure --host=localhost:26257 -d backend_db -f schema.sql
# rồi tạo thêm bảng refresh_tokens (không có trong script gốc):
npx prisma migrate dev --name add_refresh_tokens --create-only
# review file migration sinh ra chỉ chứa CREATE TABLE refresh_tokens, rồi:
npx prisma migrate resolve --applied <tên_migration>
```

**Cách B — để Prisma tự tạo toàn bộ bảng từ `schema.prisma`** (đơn giản hơn, tương đương về cấu trúc):
```bash
npx prisma migrate dev --name init
```

## 4. Chạy dự án

```bash
# Dev (hot reload)
npm run dev

# Build production
npm run build
npm start
```

Server mặc định chạy tại `http://localhost:4000`.

## 5. API Endpoints

| Method | Endpoint             | Mô tả                          | Cần token |
|--------|-----------------------|--------------------------------|-----------|
| GET    | /api/health            | Kiểm tra server                | Không     |
| POST   | /api/auth/register      | Đăng ký tài khoản              | Không     |
| POST   | /api/auth/login         | Đăng nhập                      | Không     |
| POST   | /api/auth/refresh       | Làm mới access token           | Không     |
| POST   | /api/auth/logout        | Đăng xuất (thu hồi refresh token) | Không |
| GET    | /api/auth/me            | Lấy thông tin user hiện tại    | Có (Bearer access token) |

### Ví dụ Register

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@example.com","password":"123456","fullName":"Nguyen Van A"}'
```

### Ví dụ Login

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@example.com","password":"123456"}'
```

Response trả về `accessToken` (hết hạn 15 phút mặc định) và `refreshToken` (7 ngày).

### Gọi API cần xác thực

```bash
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <accessToken>"
```

### Refresh token

```bash
curl -X POST http://localhost:4000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

## 6. Cơ chế bảo mật đã áp dụng

- Mật khẩu được hash bằng **bcryptjs** (không lưu plaintext).
- JWT tách riêng **access token** (ngắn hạn) và **refresh token** (dài hạn, lưu trong DB để có thể thu hồi/xoay vòng).
- Refresh token được **xoay vòng** (rotate) mỗi lần gọi `/refresh`, token cũ bị đánh dấu `revoked`.
- `helmet` set các HTTP header bảo mật, `cors` cấu hình cross-origin.
- Validate input bằng **zod** trước khi vào service/controller.
- Middleware `authorize(...roles)` sẵn sàng để phân quyền theo `role` (USER/ADMIN) khi cần mở rộng.

## 7. Mở rộng

- Thêm bảng/entity mới: khai báo trong `prisma/schema.prisma` rồi chạy `npx prisma migrate dev`.
- Thêm route mới: tạo controller + route trong `src/controllers`, `src/routes`, rồi `router.use()` trong `src/routes/index.ts`.
- Áp dụng `authenticate` + `authorize("ADMIN")` cho các route cần giới hạn quyền.
