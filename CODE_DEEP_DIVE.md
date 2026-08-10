# 🔍 PHÂN TÍCH CHI TIẾT TỪNG DÒNG CODE VÀ LUỒNG CHẠY HỆ THỐNG
*(Deep-Dive Code Walkthrough & Line-by-Line Technical Analysis)*

Tài liệu này phân tích chi tiết **từng hàm, từng đoạn code và luồng dữ liệu (Data Flow)** trong các file nòng cốt của dự án **Recipe Recommendation System**.

---

## 📂 MỤC LỤC PHÂN TÍCH

1. [Backend - `src/services/recipe.service.ts` (Xử lý CSDL & Phân trang Lọc Món)](#1-backend---srcservicesrecipeservicets)
2. [Frontend - `frontend/src/pages/HomePage.tsx` (State, Gọi API & Thuật toán Khớp)](#2-frontend---frontendsrcpageshomepagetsx)
3. [Frontend - `frontend/src/components/RecipeCard.tsx` (Render Thẻ Món & Huy Hiệu Khớp)](#3-frontend---frontendsrccomponentsrecipecardtsx)
4. [Frontend - `frontend/src/components/RecipeDetailModal.tsx` (Modal Chi Tiết & Tối Ưu Link)](#4-frontend---frontendsrccomponentsrecipedetailmodaltsx)
5. [Cấu hình CSDL - `docker/docker-compose.yml` & `docker/haproxy.cfg`](#5-cấu-hình-csdl---dockerdocker-composeyml--dockerhaproxycfg)

---

## 1. BACKEND - `src/services/recipe.service.ts`
*(File xử lý nghiệp vụ chính cho Món ăn ở Server)*

### 🔹 Hàm `recipeService.list(query: ListQuery)`
Hàm này chịu trách nhiệm tiếp nhận tham số từ Frontend, xây dựng truy vấn SQL động và trả về danh sách món ăn kèm tổng số món thực tế.

```typescript
async list(query: ListQuery) {
  // DÒNG 79: Gọi helper getPagination để tính số hàng cần bỏ qua (skip) và số hàng lấy (take)
  const { skip, take, page, limit } = getPagination(query);

  // DÒNG 81-83: Kiểm tra tham số query.ingredients truyền từ URL.
  // Nếu có, chuyển thành mảng chuỗi ingList và xóa khoảng trắng thừa.
  const ingList = query.ingredients
    ? (Array.isArray(query.ingredients) ? query.ingredients : [query.ingredients]).filter((i) => i && i.trim())
    : [];

  // DÒNG 85: Khai báo đối tượng Prisma Where Input để build câu lệnh WHERE SQL động
  const where: Prisma.RecipeWhereInput = {
    // DÒNG 86-98: Nếu người dùng gõ từ khóa tìm kiếm (searchQuery)
    ...(query.search && {
      OR: [
        // Tìm từ khóa trong Tên món ăn (không phân biệt hoa thường - insensitive)
        { recipeName: { contains: query.search, mode: "insensitive" } },
        // HOẶC Tìm từ khóa nằm trong Tên của bất kỳ Nguyên liệu nào của món đó
        {
          ingredients: {
            some: {
              ingredient: {
                ingredientName: { contains: query.search, mode: "insensitive" },
              },
            },
          },
        },
      ],
    }),

    // DÒNG 99-109: Nếu người dùng chọn nguyên liệu trong Tủ lạnh (ingList có phần tử)
    ...(ingList.length > 0 && {
      // Tìm các món ăn chứa BẤT KỲ nguyên liệu nào trong danh sách tủ lạnh
      OR: ingList.map((ing) => ({
        ingredients: {
          some: {
            ingredient: {
              ingredientName: { contains: ing, mode: "insensitive" },
            },
          },
        },
      })),
    }),

    // DÒNG 110-114: Lọc theo độ khó, thời gian nấu tối đa, danh mục nếu có
    ...(query.difficulty && { difficulty: query.difficulty }),
    ...(query.maxCookTime && { cookTime: { lte: query.maxCookTime } }),
    ...(query.categoryId && {
      recipeCategories: { some: { categoryId: query.categoryId } },
    }),
  };

  // DÒNG 116-125: Chạy song song 2 câu lệnh SQL tới CSDL CockroachDB (Promise.all để tối ưu tốc độ)
  const [items, total] = await Promise.all([
    // Truy vấn 1: Lấy danh sách món ăn thỏa điều kiện `where`, bỏ qua `skip` phần tử, lấy `take` phần tử
    prisma.recipe.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        ingredients: {
          include: { ingredient: true, unit: true },
        },
      },
    }),
    // Truy vấn 2: Đếm TỔNG SỐ THỰC TẾ các món thỏa điều kiện `where` trong CSDL
    prisma.recipe.count({ where }),
  ]);

  // DÒNG 127-135: Định dạng chuẩn dữ liệu đầu ra và tính số trang
  const formattedItems = items.map((r) => ({
    ...r,
    recipeImage: r.hinh_anh || r.recipeImage, // Ưu tiên lấy cột hinh_anh Cookpad
    ingredients: r.ingredients.map((ri) => ({
      ingredientId: ri.ingredientId,
      ingredientName: ri.ingredient?.ingredientName,
      quantity: ri.quantity,
      unit: ri.unit,
    })),
  }));

  return {
    items: formattedItems,
    pagination: {
      total,                               // Tổng số món thực tế khớp
      page,                                // Trang hiện tại
      limit,                               // Số món mỗi trang (15)
      totalPages: Math.ceil(total / limit), // Tổng số trang
    },
  };
}
```

---

## 2. FRONTEND - `frontend/src/pages/HomePage.tsx`
*(Trang chủ giao diện người dùng - Nơi điều phối tìm kiếm & thuật toán sắp xếp)*

### 🔹 Hàm `fetchRecipes(page = 1, append = false)`
Hàm này được gọi mỗi khi người dùng đổi trang, chọn tủ lạnh hoặc gõ từ khóa tìm kiếm.

```typescript
const fetchRecipes = async (page = 1, append = false) => {
  setLoading(true);
  try {
    // DÒNG 53: Tạo URL truy vấn mặc định với phân trang limit = 15
    let url = `/api/recipes?page=${page}&limit=15`;
    
    // DÒNG 54-56: Nếu có từ khóa tìm kiếm, nối thêm &search=...
    if (searchQuery.trim()) {
      url += `&search=${encodeURIComponent(searchQuery.trim())}`;
    }
    
    // DÒNG 57-61: Nếu trong tủ lạnh có chọn nguyên liệu, nối từng nguyên liệu vào &ingredients=...
    if (selectedIngredients.length > 0) {
      selectedIngredients.forEach((ing) => {
        url += `&ingredients=${encodeURIComponent(ing)}`;
      });
    }

    // DÒNG 63-64: Gửi HTTP Request lên Backend và đọc dữ liệu JSON trả về
    const res = await fetch(url);
    const json = await res.json();

    if (json.success && Array.isArray(json.data)) {
      const rawItems: Recipe[] = json.data.map((r: any) => ({
        ...r,
        recipeImage: r.recipeImage || r.hinh_anh,
        khauPhan: r.khauPhan || r.khau_phan,
      }));

      // DÒNG 71-103: THUẬT TOÁN TÍNH TOÁN ĐIỂM TƯƠNG ĐỒNG NGUYÊN LIỆU (CLIENT-SIDE)
      let processedItems = rawItems.map((recipe) => {
        // Lấy danh sách tên tất cả nguyên liệu của món ăn này
        const recipeIngNames = (recipe.ingredients || []).map((ingObj: any) =>
          (ingObj.ingredientName || ingObj.ingredient?.ingredientName || '').trim().toLowerCase()
        ).filter(Boolean);

        // Đếm số nguyên liệu tủ lạnh CÓ XUẤT HIỆN trong công thức món ăn này
        const matchedCount = selectedIngredients.reduce((count, ing) => {
          if (!ing.trim()) return count;
          const isMatch = recipeIngNames.some((rIng: string) => rIng.includes(ing) || ing.includes(rIng));
          return isMatch ? count + 1 : count;
        }, 0);

        const totalIngCount = recipeIngNames.length;
        
        // Tính Tỷ lệ phần trăm đáp ứng (%): (matchedCount / totalIngCount) * 100
        const matchPercentage = totalIngCount > 0 ? Math.round((matchedCount / totalIngCount) * 100) : 0;
        
        // Tính Số nguyên liệu còn thiếu
        const missingCount = Math.max(0, totalIngCount - matchedCount);
        
        // Đánh dấu món ăn có ĐỦ 100% nguyên liệu hay không
        const isFullyMatched = selectedIngredients.length > 0 && totalIngCount > 0 && matchedCount >= totalIngCount;

        return {
          ...recipe,
          matchedCount,
          matchPercentage,
          missingCount,
          isFullyMatched,
        };
      });

      // DÒNG 104-108: SẮP XẾP ĐA TIÊU CHÍ (MULTI-CRITERIA SORTING)
      if (selectedIngredients.length > 0) {
        // Lọc bỏ hẳn các món không chứa bất kỳ nguyên liệu tủ lạnh nào
        processedItems = processedItems.filter((recipe) => (recipe.matchedCount || 0) > 0);

        // Sắp xếp: Ưu tiên 1 (matchedCount giảm dần) -> Ưu tiên 2 (matchPercentage giảm dần)
        processedItems.sort(
          (a, b) => (b.matchedCount || 0) - (a.matchedCount || 0) || (b.matchPercentage || 0) - (a.matchPercentage || 0)
        );
      }

      // DÒNG 110-114: Cập nhật State danh sách món và Phân trang
      if (append) {
        setRecipes((prev) => [...prev, ...processedItems]); // Khi bấm nút "Xem thêm"
      } else {
        setRecipes(processedItems);                         // Khi tải trang mới/tìm kiếm mới
      }
      
      setPagination({
        total: json.meta?.total || processedItems.length,
        page,
        limit: 15,
        totalPages: json.meta?.totalPages || 1,
        hasMore: page < (json.meta?.totalPages || 1),
      });
    }
  } finally {
    setLoading(false);
  }
};
```

---

## 3. FRONTEND - `frontend/src/components/RecipeCard.tsx`
*(Component hiển thị từng thẻ công thức món ăn)*

```typescript
export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  // DÒNG 70: Lấy ảnh món ăn (nếu không có thì dùng ảnh mặc định placeholder)
  const imgUrl = recipe.recipeImage || recipe.hinh_anh || 'https://images.unsplash.com/photo-1495521821757-a1efb6729352';

  return (
    <div className="recipe-card" onClick={onClick}>
      <div className="card-img-wrapper">
        <img src={imgUrl} alt={recipe.recipeName} className="recipe-card-img" />
        
        {/* DÒNG 76-80: Hiển thị Huy hiệu Khớp % nếu tủ lạnh có nguyên liệu khớp */}
        {recipe.matchedCount && recipe.matchedCount > 0 ? (
          <span className="badge-match">
            Khớp {recipe.matchPercentage}%
          </span>
        ) : null}
      </div>

      <div className="recipe-card-content">
        <h3 className="recipe-title">{recipe.recipeName}</h3>
        
        {/* DÒNG 88-95: Thời gian nấu & Độ khó */}
        <div className="recipe-meta">
          <span>⏱️ {recipe.cookTime || 15} phút</span>
          <span>🔥 Độ khó: {recipe.difficulty || 'Dễ'}</span>
        </div>

        {/* DÒNG 98-115: Hiển thị danh sách tóm tắt các nguyên liệu */}
        <div className="recipe-ingredients-preview">
          <small className="text-muted">Thành phần nguyên liệu:</small>
          <div className="ingredients-tags">
            {(recipe.ingredients || []).slice(0, 3).map((ing, idx) => (
              <span key={idx} className="tag-ingredient">
                {ing.ingredientName || ing.ingredient?.ingredientName}
              </span>
            ))}
            {(recipe.ingredients || []).length > 3 && (
              <span className="tag-more">+{(recipe.ingredients || []).length - 3}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

---

## 4. FRONTEND - `frontend/src/components/RecipeDetailModal.tsx`
*(Modal xem chi tiết công thức món ăn & Xử lý chuẩn hóa text/link)*

### 🔹 Hàm `formatStepDescription(desc: string, stepNumber?: number)`

```typescript
function formatStepDescription(desc: string, stepNumber?: number) {
  if (!desc) return '';

  // DÒNG 12-17: Chuẩn hóa chuỗi text, cắt bỏ số bước bị lặp ở đầu câu (Ví dụ: "1 Cho 2tbsp..." -> "Cho 2tbsp...")
  let cleaned = desc.trim();
  if (stepNumber && cleaned.startsWith(stepNumber.toString())) {
    cleaned = cleaned.replace(new RegExp(`^${stepNumber}\\s*`), '');
  } else {
    cleaned = cleaned.replace(/^\d+\s+/, '');
  }

  // DÒNG 19-21: Sử dụng Regular Expression để phát hiện đường dẫn web URL (http:// hoặc https://)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = cleaned.split(urlRegex);

  // DÒNG 22-45: Duyệt qua từng đoạn chuỗi, nếu là URL thì chuyển thành thẻ <a> đường dẫn đẹp mắt
  return parts.map((part, i) => {
    if (part.match(/^https?:\/\//i)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            marginLeft: '0.35rem',
            marginRight: '0.35rem',
            color: '#ea580c',
            backgroundColor: '#fff7ed',
            border: '1px solid #ffedd5',
            padding: '0.15rem 0.5rem',
            borderRadius: '0.5rem',
            fontSize: '0.82rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
          title={part}
        >
          🔗 Bài viết tham khảo
        </a>
      );
    }
    return part;
  });
}
```

---

## 5. CẤU HÌNH CSDL - `docker/docker-compose.yml` & `docker/haproxy.cfg`

### 🔹 File `docker/docker-compose.yml` (Cụm phân tán 3 Node)

```yaml
services:
  # Node 1 trong cụm phân tán
  roach1:
    image: cockroachdb/cockroach:v26.2.0
    container_name: roach1
    command: >
      start --insecure
      --advertise-addr=roach1:26257      # Địa chỉ IP quảng bá trong mạng Docker
      --http-addr=0.0.0.0:8080            # Cổng Web Admin UI
      --listen-addr=0.0.0.0:26257         # Cổng lắng nghe SQL/RPC
      --join=roach1:26257,roach2:26257,roach3:26257 # Khai báo danh sách các Node trong cụm
    ports:
      - "26256:26257"                     # Map cổng SQL ngoài máy thật
      - "8080:8080"                       # Map cổng Admin UI
    volumes:
      - roach1:/cockroach/cockroach-data  # Lưu trữ dữ liệu lâu dài (Persistent Volume)

  # Node 2 & Node 3 được cấu hình tương tự roach1...

  # Cân bằng tải HAProxy
  haproxy:
    image: haproxy:3.0
    container_name: haproxy
    ports:
      - "26260:26257"                     # Cổng công cộng duy nhất Backend kết nối vào
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
    depends_on:
      - roach1
      - roach2
      - roach3
```

### 🔹 File `docker/haproxy.cfg` (Cấu hình Cân bằng tải)

```haproxy
frontend cockroach
    bind *:26257                       # Nhận truy vấn SQL từ Backend gửi tới cổng 26260
    default_backend cockroach_nodes

backend cockroach_nodes
    balance roundrobin                 # Thuật toán xoay vòng phân phối đều tải tới 3 node
    option tcp-check                   # Kiểm tra sức khỏe TCP định kỳ của 3 node

    server roach1 roach1:26257 check   # Nếu roach1 sập, ngắt kết nối roach1
    server roach2 roach2:26257 check   # Chuyển 100% truy vấn sang roach2 & roach3
    server roach3 roach3:26257 check
```

---

> *Tài liệu phân tích mã nguồn chi tiết dòng-theo-dòng dự án Recipe Recommendation System.*
