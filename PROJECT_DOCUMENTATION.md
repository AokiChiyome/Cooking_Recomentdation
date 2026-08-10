# 🍳 TÀI LIỆU KIẾN TRÚC HỆ THỐNG VÀ PHÂN TÍCH GIẢI THUẬT GỢI Ý MÓN ĂN
*(Recipe Recommendation System Documentation)*

---

## 📌 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

**Recipe Recommendation System** là hệ thống gợi ý và tìm kiếm công thức nấu ăn thông minh dựa trên **thành phần nguyên liệu sẵn có trong tủ lạnh của người dùng**. 

Hệ thống giúp giải quyết bài toán thực tế: *"Hôm nay ăn gì với những nguyên liệu đang có sẵn trong tủ lạnh để vừa ngon miệng vừa tránh lãng phí thực phẩm?"*

### 📊 Quy mô dữ liệu hiện tại
- **22.915** Nguyên liệu (`ingredients`).
- **9.919** Công thức món ăn (`recipes`).
- **82.688** Liên kết món ăn & nguyên liệu (`recipe_ingredients`).
- **38.108** Bước hướng dẫn nấu ăn chi tiết (`recipe_steps`).

---

## 🏛️ 2. CẤU TRÚC THƯ MỤC VÀ KIẾN TRÚC HỆ THỐNG

### 2.1. Cấu trúc thư mục mã nguồn (Directory Structure)

```
Recipe_Recomentdation/
├── docker/                       # Cấu hình cụm CSDL phân tán Docker
│   ├── docker-compose.yml        # Định nghĩa 3 Node CockroachDB + HAProxy Load Balancer
│   └── haproxy.cfg               # Cấu hình cân bằng tải Round-Robin (Port 26260)
│
├── prisma/                       # Cấu hình Prisma ORM
│   └── schema.prisma             # Định nghĩa Schema 11 bảng CSDL CockroachDB
│
├── src/                          # Mã nguồn Backend (Node.js + Express + TypeScript)
│   ├── config/                   # Biến môi trường, cấu hình Prisma Client
│   ├── controllers/              # Xử lý Logic Controller (Recipe, Ingredient, Auth...)
│   ├── middleware/               # Middleware xác thực JWT, validate dữ liệu, xử lý lỗi
│   ├── routes/                   # Định tuyến API (/api/recipes, /api/auth...)
│   ├── services/                 # Xử lý nghiệp vụ CSDL & Giải thuật gợi ý món ăn
│   └── validators/               # Kiểm tra định dạng dữ liệu đầu vào (Zod Schema)
│
├── frontend/                     # Mã nguồn Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── components/           # Component UI (RecipeCard, RecipeDetailModal, Navbar...)
│   │   ├── pages/                # Các trang (HomePage, LoginPage, Dashboard...)
│   │   ├── services/             # Gọi API Fetcher với Auth Token
│   │   └── types/                # Định nghĩa Kiểu dữ liệu TypeScript
│   ├── index.css                 # Hệ thống CSS Design System (Glassmorphism & Animation)
│   └── vite.config.ts            # Cấu hình Vite Proxy sang Backend (Port 4000)
│
├── PROJECT_DOCUMENTATION.md      # Tài liệu tổng quan & Phân tích giải thuật (File này)
└── .env                          # Biến môi trường hệ thống
```

---

### 2.2. Kiến trúc Hạ tầng CSDL Phân tán (Distributed Database Architecture)

Hệ thống sử dụng **CockroachDB (CSDL phân tán chuẩn Cloud-Native)** kết hợp với **HAProxy Load Balancer**:

```
                  ┌──────────────────────────────┐
                  │   Frontend (React Port 5173) │
                  └──────────────┬───────────────┘
                                 │ REST API
                                 ▼
                  ┌──────────────────────────────┐
                  │   Backend (Express Port 4000)│
                  └──────────────┬───────────────┘
                                 │ DATABASE_URL (Port 26260)
                                 ▼
                  ┌──────────────────────────────┐
                  │   HAProxy Load Balancer      │
                  └──────┬───────┬───────┬───────┘
                         │       │       │ Check health (TCP)
            ┌────────────┘       │       └────────────┐
            ▼                    ▼                    ▼
     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │   roach1    │      │   roach2    │      │   roach3    │
     │ (Node 1)    │      │ (Node 2)    │      │ (Node 3)    │
     └─────────────┘      └─────────────┘      └─────────────┘
```

- **Tính chịu lỗi cao (High Availability & Fault Tolerance):** Nhờ cơ chế nhân bản bản sao (Replication Factor = 3) và thuật toán đồng thuận **Raft Consensus**, nếu 1 trong 3 Node bị sập đột ngột, HAProxy sẽ tự động chuyển hướng truy vấn sang 2 Node còn lại. Hệ thống **vẫn hoạt động 100% bình thường, không ngắt kết nối hay mất mát dữ liệu**.

---

## 🧮 3. PHÂN TÍCH CHI TIẾT GIẢI THUẬT GỢI Ý MÓN ĂN (RECOMMENDATION ALGORITHM)

### 3.1. Giải thuật đang sử dụng là gì?

Hệ thống áp dụng **Giải thuật Gợi ý Dựa trên Tập hợp và Điểm ưu tiên Đa tiêu chí (Set-Overlap & Multi-Criteria Proportion Matching Algorithm)**.

#### **Tập đầu vào (Input):**
1. Tập hợp các nguyên liệu người dùng đang có trong tủ lạnh:  
   $$I_{\text{user}} = \{i_1, i_2, \dots, i_m\}$$
2. Danh sách công thức nấu ăn trong CSDL. Mỗi món ăn $R$ chứa tập nguyên liệu:  
   $$I_R = \{g_1, g_2, \dots, g_n\}$$

---

### 3.2. Quá trình tính toán của Giải thuật (Step-by-step Execution)

#### **Bước 1: Lọc thô tại CSDL (Database-level Index Filtering)**
Khi người dùng chọn các nguyên liệu tủ lạnh $I_{\text{user}}$, thay vì tải toàn bộ 9.919 món ăn về máy khách (gây giật lag), Backend thực hiện truy vấn Prisma SQL với điều kiện `WHERE ... OR`:
- Chỉ lấy các món ăn có chứa **ít nhất 1 nguyên liệu** nằm trong $I_{\text{user}}$.
- Giúp giảm không gian tìm kiếm từ 9.919 món xuống đúng các ứng viên tiềm năng ngay tại cấp CSDL CockroachDB.

#### **Bước 2: Tính toán chỉ số Khớp (Matching Metrics)**
Đối với mỗi món ăn ứng viên $R$:
1. **Số nguyên liệu khớp ($\text{matchedCount}$):**  
   $$\text{matchedCount}(R) = \Big| \big\{ i \in I_{\text{user}} \;\big|\; \exists g \in I_R \text{ sao cho } g \text{ trùng tên với } i \big\} \Big|$$

2. **Tỷ lệ phần trăm đáp ứng công thức ($\text{matchPercentage}$):**  
   $$\text{matchPercentage}(R) = \left( \frac{\text{matchedCount}(R)}{|I_R|} \right) \times 100\%$$

3. **Số nguyên liệu còn thiếu ($\text{missingCount}$):**  
   $$\text{missingCount}(R) = |I_R| - \text{matchedCount}(R)$$

#### **Bước 3: Sắp xếp theo Thứ tự Ưu tiên Đa tiêu chí (Multi-Criteria Sorting)**
Các món ăn được sắp xếp theo 3 cấp ưu tiên giảm dần:
1. **Ưu tiên 1 ($\text{matchedCount}$ giảm dần):** Đưa các món dùng được **nhiều nguyên liệu tủ lạnh nhất** lên đầu (giúp tận dụng tối đa thực phẩm sẵn có).
2. **Ưu tiên 2 ($\text{matchPercentage}$ giảm dần):** Nếu 2 món có số nguyên liệu khớp bằng nhau, món nào có **tỷ lệ đáp ứng công thức cao hơn** sẽ xếp trên (người dùng phải mua thêm ít đồ hơn).
3. **Ưu tiên 3 (Tên món ăn xếp theo alphabet A-Z):** Đảm bảo thứ tự hiển thị nhất quán.

---

### 3.3. Ví dụ minh họa thực tế (Concrete Example)

Giả sử người dùng chọn Tủ lạnh 3 nguyên liệu: `I_user = ["thịt bò", "hành tây", "tỏi"]`.

| Tên món ăn ($R$) | Tổng nguyên liệu món ($I_R$) | Khớp ($\text{matchedCount}$) | Tỷ lệ ($\text{matchPercentage}$) | Số món thiếu | Xếp vị trí |
|:---|:---|:---:|:---:|:---:|:---:|
| **Bò Xào Hành Tây** | `[thịt bò, hành tây, tỏi]` | **3 / 3** | **100%** | 0 | 🥇 **Vị trí 1** (Đủ 100%) |
| **Mì Udon Xào Bò** | `[thịt bò, hành tây, tỏi, mì udon, cải]` | **3 / 5** | **60%** | 2 | 🥈 **Vị trí 2** |
| **Bò Lúc Lắc** | `[thịt bò, tỏi, ớt chuông, bơ]` | **2 / 4** | **50%** | 2 | 🥉 **Vị trí 3** |
| **Canh Bầu Tôm** | `[bầu, tôm, hành lá]` | **0 / 3** | **0%** | 3 | ❌ **Loại bỏ** |

---

## ⚖️ 4. TẠI SAO CHỌN GIẢI THUẬT NÀY MÀ KHÔNG CHỌN CÁCH KHÁC?

Dưới đây là so sánh chi tiết giữa giải thuật được chọn và các phương pháp phổ biến khác:

| Phương pháp | Mô tả | Nhược điểm lớn | Tại sao KHÔNG chọn? |
|:---|:---|:---|:---|
| **Exact Match (Khớp tuyệt đối 100%)** | Chỉ hiển thị món ăn nếu người dùng có đủ 100% tất cả nguyên liệu. | Quá khắt khe. Nếu người dùng có 4/5 đồ (thiếu mỗi tiêu/muối), hệ thống sẽ ẩn luôn món đó. | Người dùng sẽ thấy màn hình trống không và cho rằng hệ thống dở. |
| **Collaborative Filtering (Lọc cộng tác AI)** | Gợi ý món ăn dựa trên lịch sử xem/thích của các người dùng tương tự. | Bị lỗi **Cold Start Problem** (người dùng mới hoặc món ăn mới chưa có lịch sử sẽ không gợi ý được). | Mục tiêu dự án là **gợi ý theo tủ lạnh thực tế hiện tại**, không phải gợi ý theo sở thích quá khứ. |
| **Deep Learning / Vector Embeddings** | Dùng mô hình AI nhúng vector nguyên liệu để đo khoảng cách Cosine. | Tính toán rất nặng, tốn tài nguyên GPU, kết quả mang tính xác suất và là **"Hộp đen" (Black Box)** khó giải thích cho người dùng. | Không cần thiết cho bài toán tập hợp nguyên liệu, gây chậm tốc độ phản hồi. |
| **Set-Overlap & Multi-Criteria Matching (ĐƯỢC CHỌN)** | Đếm tập hợp nguyên liệu giao nhau + tính tỷ lệ phần trăm công thức. | Cần xử lý chuẩn hóa tên nguyên liệu đầu vào. | **TỐI ƯU NHẤT:** Rõ ràng, minh bạch (hiển thị rõ "Khớp 75% - Thiếu 1 món"), tốc độ phản hồi tính bằng millisecond, xử lý tức thì cho người dùng mới. |

---

## 🎯 5. TỔNG KẾT TÍNH NĂNG NỔI BẬT DỰ ÁN

1. **Gợi ý món ăn thông minh theo Tủ lạnh:** Lọc và sắp xếp công thức phù hợp nhất với nguyên liệu sẵn có.
2. **Tìm kiếm đa năng:** Tìm kiếm tức thì theo cả **Tên món ăn** lẫn **Tên thành phần nguyên liệu**.
3. **Phân trang & Tải trang tối ưu:** Mỗi lần tải đúng 15 món ăn, có nút "Xem thêm" mượt mà.
4. **Giao diện Modal Xem chi tiết chuẩn Responsive:** Hiển thị hình ảnh Cookpad sắc nét, định dạng từng bước nấu ăn sạch sẽ, tự động chuyển URL thành nút tham khảo.
5. **CSDL Phân tán chịu lỗi 100%:** Cụm 3 Node CockroachDB + HAProxy giúp hệ thống hoạt động liên tục ngay cả khi có sự cố sập server CSDL.

---

> *Tài liệu được cập nhật tự động cho hệ thống Recipe Recommendation System.*
