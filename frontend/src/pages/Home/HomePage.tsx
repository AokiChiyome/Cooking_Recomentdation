import React, { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Recipe } from "../../types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HeroSection } from "../../components/HeroSection";
import { RecipeCard } from "../../components/RecipeCard";
import { RecipeDetailModal } from "../../components/recipeDetailModal/RecipeDetailModal";
import { FridgeSection } from "../../components/FridgeSection";
import { Navbar } from "../../components/Navbar";
import { fetchWithAuth } from "../../services/api";

export const HomePage: React.FC = () => {
  const { currentUser, showToast, openModal } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"fridge" | "all" | "saved">("fridge");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<Recipe | null>(null);

  // 1. Fetch categories with TanStack Query
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });

  // 2. Fetch top popular ingredients dynamically from DB for suggestions
  const { data: suggestedIngredients = [] } = useQuery({
    queryKey: ["popularIngredients"],
    queryFn: async () => {
      const res = await fetch("/api/ingredients/top-popular?limit=10");
      const json = await res.json();
      return json.success && Array.isArray(json.data) ? json.data : [];
    },
    staleTime: 1000 * 60 * 60,
  });

  // 3. Fetch recipes for fridge & search queries
  const { data: recipesData, isLoading: isRecipesLoading } = useQuery({
    queryKey: [
      "recipes",
      page,
      searchQuery,
      selectedIngredients,
      selectedCategoryId,
    ],
    queryFn: async () => {
      let url = `/api/recipes?page=${page}&limit=15`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      if (selectedIngredients.length > 0) {
        selectedIngredients.forEach((ing) => {
          url += `&ingredients=${encodeURIComponent(ing)}`;
        });
      }
      if (selectedCategoryId) {
        url += `&categoryId=${encodeURIComponent(selectedCategoryId)}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data)) {
        return { items: [], total: 0, totalPages: 1 };
      }

      const rawItems: Recipe[] = json.data.map((r: any) => ({
        ...r,
        recipeImage: r.recipeImage || r.hinh_anh,
        khauPhan: r.khauPhan || r.khau_phan,
      }));
      const meta = json.meta || {
        total: rawItems.length,
        page: 1,
        limit: 15,
        totalPages: 1,
      };

      // Compute client-side match percentage for ingredients
      let processedItems = rawItems.map((recipe) => {
        let matchedCount = 0;
        const totalIngCount = (recipe.ingredients || []).length;

        if (selectedIngredients.length > 0 && totalIngCount > 0) {
          recipe.ingredients!.forEach((ingObj: any) => {
            const ingName = (
              ingObj.ingredientName ||
              ingObj.ingredient?.ingredientName ||
              ""
            )
              .trim()
              .toLowerCase();
            if (ingName) {
              const isMatched = selectedIngredients.some((selected) => {
                const s = selected.trim().toLowerCase();
                return (
                  s.length > 0 && (ingName.includes(s) || s.includes(ingName))
                );
              });
              if (isMatched) matchedCount += 1;
            }
          });
        }

        const matchPercentage =
          totalIngCount > 0
            ? Math.round((matchedCount / totalIngCount) * 100)
            : 0;
        const missingCount = Math.max(0, totalIngCount - matchedCount);
        const isFullyMatched =
          selectedIngredients.length > 0 &&
          totalIngCount > 0 &&
          matchedCount >= totalIngCount;

        return {
          ...recipe,
          matchedCount,
          matchPercentage,
          missingCount,
          isFullyMatched,
        };
      });

      if (selectedIngredients.length > 0) {
        processedItems = processedItems.filter(
          (recipe) => (recipe.matchedCount || 0) > 0,
        );
        processedItems.sort(
          (a, b) =>
            (b.matchedCount || 0) - (a.matchedCount || 0) ||
            (b.matchPercentage || 0) - (a.matchPercentage || 0),
        );
      }

      return {
        items: processedItems,
        total: meta.total,
        totalPages: meta.totalPages,
      };
    },
    enabled: activeTab !== "saved",
    staleTime: 1000 * 60 * 5,
  });

  // 4. Fetch saved recipes for logged-in user directly from CockroachDB user_recipes table
  const { data: savedRecipesData = [], isLoading: isSavedLoading } = useQuery({
    queryKey: ["savedRecipes", currentUser?.userId],
    queryFn: async () => {
      if (!currentUser) return [];
      try {
        const res = await fetchWithAuth("/api/recipes/saved");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data.map((r: any) => ({
            ...r,
            recipeImage: r.recipeImage || r.hinh_anh,
            khauPhan: r.khauPhan || r.khau_phan,
          }));
        }
      } catch (err) {
        console.error("Fetch saved recipes DB error:", err);
      }
      return [];
    },
    enabled: activeTab === "saved" && !!currentUser,
  });

  // Decide current active recipe list & loading state
  const recipes =
    activeTab === "saved" ? savedRecipesData : recipesData?.items || [];
  const totalCount =
    activeTab === "saved" ? savedRecipesData.length : recipesData?.total || 0;
  const totalPages = activeTab === "saved" ? 1 : recipesData?.totalPages || 1;
  const loading = activeTab === "saved" ? isSavedLoading : isRecipesLoading;

  const handleAddIngredient = (ing: string) => {
    const cleanIng = ing.trim().toLowerCase();
    if (cleanIng && !selectedIngredients.includes(cleanIng)) {
      setSelectedIngredients((prev) => [...prev, cleanIng]);
      setPage(1);
    }
  };

  const handleRemoveIngredient = (ing: string) => {
    setSelectedIngredients((prev) => prev.filter((item) => item !== ing));
    setPage(1);
  };

  const handleClearAllIngredients = () => {
    setSelectedIngredients([]);
    setPage(1);
  };

  const handleSuggestRandom = () => {
    const list = suggestedIngredients.length > 0
      ? suggestedIngredients
      : ["thịt bò", "thịt heo", "thịt gà", "trứng", "cà chua", "tỏi", "tôm"];
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setSelectedIngredients(shuffled.slice(0, 3));
    setPage(1);
  };

  const handleTabChange = (tab: "fridge" | "all" | "saved") => {
    setActiveTab(tab);
    setPage(1);
    if (tab === "saved" && !currentUser) {
      showToast(
        "⚠️ Vui lòng đăng nhập để xem danh sách công thức đã lưu!",
        "error",
      );
      openModal("login");
    } else if (tab === "all") {
      setSelectedIngredients([]);
      setSearchQuery("");
      setSelectedCategoryId("");
    }
  };

  const handleOpenDetail = async (r: Recipe) => {
    try {
      const res = await fetch(`/api/recipes/${r.recipeId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedRecipeDetail({
          ...json.data,
          recipeImage: json.data.recipeImage || json.data.hinh_anh,
          khauPhan: json.data.khauPhan || json.data.khau_phan,
        });
      } else {
        setSelectedRecipeDetail(r);
      }
    } catch {
      setSelectedRecipeDetail(r);
    }
  };

  return (
    <div className="home-page">
      <Navbar activeTab={activeTab} onTabChange={handleTabChange} />

      <main className="container">
        {activeTab !== "saved" && (
          <>
            <HeroSection
              searchQuery={searchQuery}
              setSearchQuery={(val: string) => {
                setSearchQuery(val);
                setPage(1);
              }}
              onAddIngredient={handleAddIngredient}
              onTriggerSearch={() => setPage(1)}
              onSuggestRandom={handleSuggestRandom}
              suggestedIngredients={suggestedIngredients}
            />

            <FridgeSection
              selectedIngredients={selectedIngredients}
              onRemoveIngredient={handleRemoveIngredient}
              onClearAll={handleClearAllIngredients}
            />
          </>
        )}

        {/* Results Header */}
        <section className="results-header" style={{ marginTop: "2rem" }}>
          <h2 className="results-heading">
            {activeTab === "saved"
              ? "🔖 Công thức đã lưu của bạn"
              : activeTab === "fridge" && selectedIngredients.length === 0
              ? "🧊 Tủ lạnh của bạn đang trống"
              : searchQuery && selectedIngredients.length > 0
              ? `Kết quả cho "${searchQuery}" & Tủ lạnh`
              : searchQuery
              ? `Kết quả cho "${searchQuery}"`
              : selectedIngredients.length > 0
              ? "Gợi ý món ăn có nguyên liệu trong tủ lạnh"
              : "Thịnh hành hôm nay"}
          </h2>

          <span className="results-count-badge">{totalCount} món ăn</span>
        </section>

        {/* Category Pill Tabs */}
        {activeTab !== "saved" && categories.length > 0 && (
          <div
            className="category-pill-tabs"
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
              margin: "1rem 0 1.5rem 0",
            }}
          >
            <button
              className={`pill-tab ${!selectedCategoryId ? "active" : ""}`}
              onClick={() => {
                setSelectedCategoryId("");
                setPage(1);
              }}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "9999px",
                border: "none",
                fontWeight: 600,
                fontSize: "0.92rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                backgroundColor: !selectedCategoryId ? "#0f172a" : "#f1f5f9",
                color: !selectedCategoryId ? "#ffffff" : "#475569",
                boxShadow: !selectedCategoryId
                  ? "0 4px 12px rgba(15, 23, 42, 0.15)"
                  : "none",
              }}
            >
              Tất cả
            </button>

            {categories.map(
              (cat: { categoryId: string; categoryName: string }) => {
                const isActive = selectedCategoryId === cat.categoryId;
                return (
                  <button
                    key={cat.categoryId}
                    className={`pill-tab ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setSelectedCategoryId(isActive ? "" : cat.categoryId);
                      setPage(1);
                    }}
                    style={{
                      padding: "0.5rem 1.25rem",
                      borderRadius: "9999px",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.92rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      backgroundColor: isActive ? "#0f172a" : "#f1f5f9",
                      color: isActive ? "#ffffff" : "#475569",
                      boxShadow: isActive
                        ? "0 4px 12px rgba(15, 23, 42, 0.15)"
                        : "none",
                    }}
                  >
                    {cat.categoryName}
                  </button>
                );
              },
            )}
          </div>
        )}

        {/* Recipes Grid */}
        {loading && recipes.length === 0 ? (
          <div
            style={{ padding: "4rem", color: "#64748b", textAlign: "center" }}
          >
            <RefreshCw
              className="animate-spin"
              size={28}
              style={{ margin: "0 auto 1rem" }}
            />
            <div>Đang tải dữ liệu công thức nấu ăn...</div>
          </div>
        ) : recipes.length === 0 ? (
          <div className="empty-card">
            <span className="empty-icon">
              {activeTab === "saved" ? "🔖" : activeTab === "fridge" ? "🧊" : "🥣"}
            </span>
            <h3>
              {activeTab === "saved"
                ? "Bạn chưa lưu công thức món ăn nào!"
                : activeTab === "fridge" && selectedIngredients.length === 0
                ? "Tủ lạnh của bạn đang trống!"
                : "Rất tiếc, chưa tìm thấy món ăn phù hợp!"}
            </h3>
            <p>
              {activeTab === "saved"
                ? "Hãy bấm biểu tượng Bookmark trên các món ăn để lưu lại nấu sau nhé."
                : activeTab === "fridge" && selectedIngredients.length === 0
                ? "Hãy nhập tên nguyên liệu bằng thanh tìm kiếm ở trên hoặc bấm các nút '+ Nguyên liệu' để tủ lạnh tự động gợi ý món nhé."
                : "Thử nhập thêm nguyên liệu khác hoặc đổi tên món ăn để khám phá thêm."}
            </p>
          </div>
        ) : (
          <div className="recipes-grid">
            {recipes.map((recipe: any) => (
              <RecipeCard
                key={recipe.recipeId}
                recipe={recipe}
                selectedIngredients={selectedIngredients}
                onOpenDetail={handleOpenDetail}
                isSaved={activeTab === "saved"}
                onToggleSaveSuccess={() => {
                  if (activeTab === "saved") {
                    queryClient.invalidateQueries({
                      queryKey: ["savedRecipes"],
                    });
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {activeTab !== "saved" && totalPages > 1 && (
          <div
            className="load-more-wrapper"
            style={{
              display: "flex",
              gap: "0.5rem",
              justifyContent: "center",
              margin: "2rem 0",
            }}
          >
            <button
              className="btn-load-more"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ opacity: page <= 1 ? 0.5 : 1 }}
            >
              Trang trước
            </button>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0 1rem",
                fontWeight: 600,
                color: "#475569",
              }}
            >
              Trang {page} / {totalPages}
            </span>
            <button
              className="btn-load-more"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Trang sau
            </button>
          </div>
        )}
      </main>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={selectedRecipeDetail}
        onClose={() => setSelectedRecipeDetail(null)}
      />
    </div>
  );
};
