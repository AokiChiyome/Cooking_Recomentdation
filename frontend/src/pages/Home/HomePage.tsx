import React, { useState, useEffect } from "react";
import { Navbar } from "../../components/Navbar";
import { HeroSection } from "../../components/HeroSection";
import { FridgeSection } from "../../components/FridgeSection";
import { RecipeCard } from "../../components/RecipeCard";
import { RecipeDetailModal } from "../../components/recipeDetailModal/RecipeDetailModal";
import type { Recipe, SearchRecipeResponse } from "../../types";
import { fetchWithAuth } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { RefreshCw } from "lucide-react";

const SUGGESTED_INGREDIENTS = [
  "thịt bò",
  "thịt heo",
  "thịt gà",
  "trứng",
  "cà chua",
  "hành tây",
  "tỏi",
  "khoai tây",
  "rau muống",
  "tôm",
];

export const HomePage: React.FC = () => {
  const { currentUser, showToast, openModal } = useAuth();

  const [activeTab, setActiveTab] = useState<"fridge" | "all" | "saved">(
    "fridge",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
    hasMore: false,
  });
  const [loading, setLoading] = useState(false);

  const [selectedRecipeDetail, setSelectedRecipeDetail] =
    useState<Recipe | null>(null);

  const handleAddIngredient = (ing: string) => {
    const cleanIng = ing.trim().toLowerCase();
    if (cleanIng && !selectedIngredients.includes(cleanIng)) {
      setSelectedIngredients((prev) => [...prev, cleanIng]);
    }
  };

  const handleRemoveIngredient = (ing: string) => {
    setSelectedIngredients((prev) => prev.filter((item) => item !== ing));
  };

  const handleClearAllIngredients = () => {
    setSelectedIngredients([]);
  };

  const handleSuggestRandom = () => {
    const shuffled = [...SUGGESTED_INGREDIENTS].sort(() => 0.5 - Math.random());
    setSelectedIngredients(shuffled.slice(0, 3));
  };

  // Fetch search recipes from backend API
  const fetchRecipes = async (page = 1, append = false) => {
    setLoading(true);
    try {
      let url = `/api/recipes?page=${page}&limit=15`;
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }
      if (selectedIngredients.length > 0) {
        selectedIngredients.forEach((ing) => {
          url += `&ingredients=${encodeURIComponent(ing)}`;
        });
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
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
            recipe.ingredients!.forEach((ingObj) => {
              const ingName = (ingObj.ingredient?.ingredientName || "")
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
          // Chỉ giữ lại các món ăn có chứa ít nhất 1 nguyên liệu trong tủ lạnh
          processedItems = processedItems.filter(
            (recipe) => (recipe.matchedCount || 0) > 0,
          );

          processedItems.sort(
            (a, b) =>
              (b.matchedCount || 0) - (a.matchedCount || 0) ||
              (b.matchPercentage || 0) - (a.matchPercentage || 0),
          );
        }

        if (append) {
          setRecipes((prev) => [...prev, ...processedItems]);
        } else {
          setRecipes(processedItems);
        }
        setPagination({
          total: meta.total,
          page: meta.page,
          limit: meta.limit,
          totalPages: meta.totalPages,
          hasMore: meta.page < meta.totalPages,
        });
      }
    } catch (err) {
      console.error("Fetch recipes error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved recipes for logged-in user
  const fetchSavedRecipes = async () => {
    if (!currentUser) {
      showToast(
        "⚠️ Vui lòng đăng nhập để xem danh sách công thức đã lưu!",
        "error",
      );
      openModal("login");
      return;
    }

    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/recipes/saved");
      const json = await res.json();
      if (json.success && json.data) {
        setRecipes(json.data);
        setPagination({
          total: json.data.length,
          page: 1,
          limit: 50,
          totalPages: 1,
          hasMore: false,
        });
      }
    } catch (err) {
      console.error("Fetch saved recipes error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: "fridge" | "all" | "saved") => {
    setActiveTab(tab);
    if (tab === "saved") {
      fetchSavedRecipes();
    } else if (tab === "all") {
      setSelectedIngredients([]);
      setSearchQuery("");
      fetchRecipes(1, false);
    } else {
      fetchRecipes(1, false);
    }
  };

  useEffect(() => {
    if (activeTab !== "saved") {
      fetchRecipes(1, false);
    }
  }, [selectedIngredients, searchQuery]);

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
              setSearchQuery={setSearchQuery}
              onAddIngredient={handleAddIngredient}
              onTriggerSearch={() => fetchRecipes(1, false)}
              onSuggestRandom={handleSuggestRandom}
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
              : searchQuery && selectedIngredients.length > 0
                ? `Kết quả cho "${searchQuery}" & Tủ lạnh`
                : searchQuery
                  ? `Kết quả cho "${searchQuery}"`
                  : selectedIngredients.length > 0
                    ? "Gợi ý phù hợp cho tủ lạnh của bạn"
                    : "Thịnh hành hôm nay"}
          </h2>

          <span className="results-count-badge">{pagination.total} món ăn</span>
        </section>

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
              {activeTab === "saved" ? "🔖" : "🥣"}
            </span>
            <h3>
              {activeTab === "saved"
                ? "Bạn chưa lưu công thức món ăn nào!"
                : "Rất tiếc, chưa tìm thấy món ăn phù hợp!"}
            </h3>
            <p>
              {activeTab === "saved"
                ? "Hãy bấm biểu tượng Bookmark trên các món ăn để lưu lại nấu sau nhé."
                : "Thử nhập thêm nguyên liệu khác hoặc đổi tên món ăn để khám phá thêm."}
            </p>
          </div>
        ) : (
          <div className="recipes-grid">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.recipeId}
                recipe={recipe}
                selectedIngredients={selectedIngredients}
                onOpenDetail={handleOpenDetail}
                isSaved={activeTab === "saved"}
                onToggleSaveSuccess={() => {
                  if (activeTab === "saved") fetchSavedRecipes();
                }}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {pagination.hasMore && (
          <div className="load-more-wrapper">
            <button
              className="btn-load-more"
              onClick={() => {
                const nextPage = pagination.page + 1;
                fetchRecipes(nextPage, true);
              }}
              disabled={loading}
            >
              {loading ? "Đang tải..." : "Xem thêm công thức nấu ăn"}
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
