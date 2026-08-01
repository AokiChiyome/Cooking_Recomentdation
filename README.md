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

### Auth

| Method | Endpoint           | Mô tả                             | Cần token |
| ------ | ------------------ | --------------------------------- | --------- |
| GET    | /api/health        | Kiểm tra server                   | Không     |
| POST   | /api/auth/register | Đăng ký tài khoản                 | Không     |
| POST   | /api/auth/login    | Đăng nhập                         | Không     |
| POST   | /api/auth/refresh  | Làm mới access token              | Không     |
| POST   | /api/auth/logout   | Đăng xuất (thu hồi refresh token) | Không     |
| GET    | /api/auth/me       | Lấy thông tin user hiện tại       | Có        |

### CRUD entities

Toàn bộ **GET** (list + detail) đều public, hỗ trợ `?page=&limit=` (mặc định `page=1, limit=20, max=100`). Toàn bộ **POST/PUT/DELETE** yêu cầu `Authorization: Bearer <accessToken>` và đều chạy trong **Prisma transaction** (`prisma.$transaction`) để đảm bảo tính nhất quán khi ghi nhiều bảng liên quan cùng lúc.

| Resource                                                  | Base path                | Query filter hỗ trợ (GET list)                      |
| --------------------------------------------------------- | ------------------------ | --------------------------------------------------- |
| Categories (danh mục nguyên liệu)                         | `/api/categories`        | `search`, `parentCategoryId`                        |
| Ingredients                                               | `/api/ingredients`       | `search`, `categoryId`                              |
| Units                                                     | `/api/units`             | `search`                                            |
| Recipes                                                   | `/api/recipes`           | `search`, `categoryId`, `difficulty`, `maxCookTime` |
| Recipe categories                                         | `/api/recipe-categories` | `search`, `parentCategoryId`                        |
| User ingredients (kho cá nhân, cần token cho mọi request) | `/api/user-ingredients`  | —                                                   |

Mỗi resource ở trên (trừ `user-ingredients`) đều có đầy đủ:

```
GET    /api/<resource>          # danh sách (phân trang)
GET    /api/<resource>/:id      # chi tiết
POST   /api/<resource>          # tạo mới (transaction)
PUT    /api/<resource>/:id      # cập nhật (transaction)
DELETE /api/<resource>/:id      # xoá (transaction)
```

`user-ingredients` dùng `ingredientId` làm khoá thay vì `id` riêng (vì PK là cặp `user_id + ingredient_id`):

```
GET    /api/user-ingredients                 # kho nguyên liệu của user hiện tại
GET    /api/user-ingredients/:ingredientId
POST   /api/user-ingredients                 # thêm nguyên liệu vào kho
PUT    /api/user-ingredients/:ingredientId   # cập nhật số lượng/đơn vị
DELETE /api/user-ingredients/:ingredientId
```

### Ví dụ: tạo Recipe (transaction tạo recipe + steps + ingredients + categories cùng lúc)

```bash
curl -X POST http://localhost:4000/api/recipes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "recipeName": "Phở bò",
    "cookTime": 120,
    "difficulty": "3",
    "steps": [
      { "stepNumber": 1, "description": "Ninh xương bò 6 tiếng" },
      { "stepNumber": 2, "description": "Trần bánh phở và thịt bò" }
    ],
    "ingredients": [
      { "ingredientId": "<uuid-nguyen-lieu>", "quantity": 2, "unitId": "<uuid-don-vi>" }
    ],
    "categoryIds": ["<uuid-danh-muc>"]
  }'
```

Nếu bất kỳ bước nào trong transaction lỗi (VD: `ingredientId` không tồn tại), toàn bộ thao tác được **rollback**, không để lại dữ liệu rác (recipe mồ côi không có steps/ingredients).

### API tra cứu / gợi ý Recipe (map trực tiếp từ 9 câu query SQL)

Toàn bộ nằm dưới `/api/recipes/...`, đặt trước route `/:id` trong code để tránh xung đột path. Các API dùng "kho nguyên liệu của user" đều lấy theo **user đang đăng nhập** (`req.user.userId` từ access token), không truyền `userId` qua query.

| #   | Query gốc                                        | Endpoint                                                          |
| --- | ------------------------------------------------ | ----------------------------------------------------------------- |
| 1   | Tìm món theo nguyên liệu                         | `GET /api/recipes/search-by-ingredient?ingredientName=Ca chua`    |
| 2   | Tìm món có nhiều nguyên liệu nhất                | `GET /api/recipes/most-ingredients?limit=10`                      |
| 3   | Liệt kê nguyên liệu của một món theo tên         | `GET /api/recipes/by-name/Pho bo/ingredients`                     |
| 4   | Nguyên liệu hiện có của user                     | `GET /api/user-ingredients` (cần token)                           |
| 5   | Món user nấu được (đủ 100% nguyên liệu)          | `GET /api/recipes/cookable` (cần token)                           |
| 6   | Món user còn thiếu nguyên liệu gì                | `GET /api/recipes/by-name/Pho bo/missing-ingredients` (cần token) |
| 7   | Món nấu được gần đủ (≥ threshold%)               | `GET /api/recipes/almost-cookable?threshold=70` (cần token)       |
| 8   | Món có thời gian nấu ngắn nhất                   | `GET /api/recipes/quickest?limit=10`                              |
| 9   | Món dùng đồng thời nhiều nguyên liệu (X và Y...) | `GET /api/recipes/search-by-ingredients?names=Thit bo,Hanh tay`   |

Lưu ý cho endpoint theo tên (`by-name/:name/...`): tên món phải url-encode nếu có dấu cách/dấu tiếng Việt, ví dụ:

```bash
curl "http://localhost:4000/api/recipes/by-name/Ph%E1%BB%9F%20b%C3%B2/ingredients"
```

Ví dụ đầy đủ:

```bash
# 5. Món hiện tại user có thể nấu
curl http://localhost:4000/api/recipes/cookable \
  -H "Authorization: Bearer <accessToken>"

# 7. Món nấu được gần đủ, từ 70% nguyên liệu trở lên
curl "http://localhost:4000/api/recipes/almost-cookable?threshold=70" \
  -H "Authorization: Bearer <accessToken>"

# 9. Món dùng cả "Thit bo" và "Hanh tay"
curl "http://localhost:4000/api/recipes/search-by-ingredients?names=Thit%20bo,Hanh%20tay"
```

### Ví dụ: lấy danh sách Recipe có filter

```bash
curl "http://localhost:4000/api/recipes?search=pho&difficulty=3&page=1&limit=10"
```

### Quy tắc nghiệp vụ đáng chú ý khi xoá (trong transaction)

- Không xoá được `category`/`recipe-category` đang có danh mục con.
- Không xoá được `ingredient` đang được dùng trong công thức nào đó.
- Không xoá được `unit` đang được dùng trong `recipe_ingredients` hoặc `user_ingredients`.
- Xoá `recipe` sẽ dọn cả `recipe_steps`, `recipe_ingredients`, `recipe_recipe_categories` liên quan trong cùng transaction.

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

## 6. API Dashboard

Toàn bộ nằm dưới `/api/dashboard/...`, đều yêu cầu đăng nhập (`Authorization: Bearer <accessToken>`). Vì bảng `users` hiện chưa có cột `role`, mọi user đã đăng nhập đều xem được — nếu cần giới hạn chỉ admin, bổ sung cột role rồi áp middleware `authorize("ADMIN")`.

| Endpoint                                          | Mô tả                                                                        | Dùng cho                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| `GET /api/dashboard/summary`                      | Gộp toàn bộ dữ liệu bên dưới vào 1 response duy nhất                         | Load trang dashboard lần đầu (giảm số round-trip) |
| `GET /api/dashboard/overview`                     | Tổng số recipes/ingredients/users/categories/units, thời gian nấu trung bình | Các "card" số liệu tổng quan                      |
| `GET /api/dashboard/recipes-by-difficulty`        | Số công thức theo từng mức độ khó                                            | Pie/bar chart                                     |
| `GET /api/dashboard/recipes-by-category?limit=10` | Top N danh mục có nhiều công thức nhất                                       | Bar chart                                         |
| `GET /api/dashboard/top-ingredients?limit=10`     | Top N nguyên liệu được dùng nhiều nhất                                       | Bar chart                                         |
| `GET /api/dashboard/cook-time-distribution`       | Số công thức theo khoảng thời gian nấu (0-30p, 31-60p, 61-120p, >120p)       | Bar chart                                         |
| `GET /api/dashboard/recipes-trend?days=30`        | Số công thức tạo mới theo từng ngày, N ngày gần nhất (đủ cả ngày = 0)        | Line chart                                        |
| `GET /api/dashboard/users-trend?days=30`          | Số user đăng ký mới theo từng ngày                                           | Line chart                                        |
| `GET /api/dashboard/recent-recipes?limit=10`      | Danh sách công thức mới tạo gần đây, kèm người tạo                           | Bảng "Hoạt động gần đây"                          |
| `GET /api/dashboard/recent-users?limit=10`        | Danh sách user mới đăng ký gần đây                                           | Bảng "User mới"                                   |

Ví dụ:

```bash
curl http://localhost:4000/api/dashboard/summary \
  -H "Authorization: Bearer <accessToken>"

curl "http://localhost:4000/api/dashboard/recipes-trend?days=14" \
  -H "Authorization: Bearer <accessToken>"
```

Response mẫu của `/summary`:

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalRecipes": 42,
      "totalIngredients": 120,
      "totalUsers": 8,
      "avgCookTimeMinutes": 45,
      "...": "..."
    },
    "recipesByDifficulty": [
      { "difficulty": "1", "count": 10 },
      { "difficulty": "3", "count": 20 }
    ],
    "recipesByCategory": [
      {
        "recipeCategoryId": "...",
        "recipeCategoryName": "Món chính",
        "recipeCount": 15
      }
    ],
    "topIngredients": [
      {
        "ingredientId": "...",
        "ingredientName": "Thịt bò",
        "usedInRecipeCount": 12
      }
    ],
    "cookTimeDistribution": [{ "label": "0-30 phút", "count": 5 }],
    "recipesTrend": [{ "date": "2026-07-19", "count": 2 }],
    "recentRecipes": [
      {
        "recipeId": "...",
        "recipeName": "Phở bò",
        "createdByUser": { "firstName": "A", "lastName": "Nguyen" }
      }
    ]
  }
}
```

**Lưu ý hiệu năng**: `cookTimeDistribution` và các trend hiện tính bucket ở tầng ứng dụng (fetch rồi group trong Node) thay vì raw SQL `GROUP BY date_trunc`, phù hợp cho dữ liệu vừa/nhỏ (dashboard nội bộ). Nếu dữ liệu lớn (hàng trăm nghìn recipe trở lên), nên chuyển sang `prisma.$queryRaw` với `date_trunc('day', created_at)` để CockroachDB tự aggregate.

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
