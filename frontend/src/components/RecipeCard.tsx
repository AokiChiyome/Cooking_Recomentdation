import React from "react";
import type { Recipe } from "../types";
import { Clock, Flame, ArrowRight, Bookmark, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { fetchWithAuth } from "../services/api";
import { useQueryClient } from "@tanstack/react-query";

interface RecipeCardProps {
  recipe: Recipe;
  selectedIngredients: string[];
  onOpenDetail: (recipe: Recipe) => void;
  isSaved?: boolean;
  onToggleSaveSuccess?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  selectedIngredients,
  onOpenDetail,
  onToggleSaveSuccess,
}) => {
  const { currentUser, openModal, showToast } = useAuth();
  const queryClient = useQueryClient();

  const [saved, setSaved] = React.useState<boolean>(() => {
    if (!currentUser) return false;
    const savedKey = `saved_recipes_${currentUser.userId}`;
    const savedIds: string[] = JSON.parse(
      localStorage.getItem(savedKey) || "[]",
    );
    return savedIds.includes(recipe.recipeId);
  });

  React.useEffect(() => {
    if (!currentUser) {
      setSaved(false);
    } else {
      const savedKey = `saved_recipes_${currentUser.userId}`;
      const savedIds: string[] = JSON.parse(
        localStorage.getItem(savedKey) || "[]",
      );
      setSaved(savedIds.includes(recipe.recipeId));
    }
  }, [currentUser, recipe.recipeId]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast(
        "⚠️ Vui lòng đăng nhập để lưu công thức món ăn yêu thích.",
        "error",
      );
      openModal("login");
      return;
    }

    const previousSavedState = saved;
    const nextState = !saved;

    // 1. Instant Optimistic UI Update (0ms latency)
    setSaved(nextState);

    // 2. Update localStorage immediately
    const savedKey = `saved_recipes_${currentUser.userId}`;
    const savedIds: string[] = JSON.parse(
      localStorage.getItem(savedKey) || "[]",
    );
    const updatedIds = nextState
      ? Array.from(new Set([...savedIds, recipe.recipeId]))
      : savedIds.filter((id) => id !== recipe.recipeId);
    localStorage.setItem(savedKey, JSON.stringify(updatedIds));

    // 3. Optimistically update React Query cache to fix N-1 count issue immediately
    queryClient.setQueryData(
      ["savedRecipes", currentUser.userId],
      (oldData: any) => {
        const list = Array.isArray(oldData) ? oldData : [];
        if (nextState) {
          if (list.some((r: any) => r.recipeId === recipe.recipeId))
            return list;
          return [recipe, ...list];
        } else {
          return list.filter((r: any) => r.recipeId !== recipe.recipeId);
        }
      },
    );

    // 4. Instant Toast Notification
    showToast(
      nextState
        ? "⭐ Đã lưu món ăn này"
        : "🗑️ Đã xóa món ăn khỏi danh sách đã lưu",
      nextState ? "success" : "info",
    );

    // 5. Background API Sync with CockroachDB & post-write refetch
    const method = nextState ? "POST" : "DELETE";
    try {
      const res = await fetchWithAuth(`/api/recipes/${recipe.recipeId}/save`, {
        method,
      });
      const json = await res.json();
      if (json.success) {
        queryClient.invalidateQueries({
          queryKey: ["savedRecipes", currentUser.userId],
        });
        if (onToggleSaveSuccess) {
          onToggleSaveSuccess();
        }
      } else {
        // Rollback state if server returns error
        setSaved(previousSavedState);
        localStorage.setItem(savedKey, JSON.stringify(savedIds));
        queryClient.invalidateQueries({
          queryKey: ["savedRecipes", currentUser.userId],
        });
        showToast(
          json.message || "Không thể cập nhật trạng thái lưu món ăn",
          "error",
        );
      }
    } catch (err) {
      console.error("Save recipe error:", err);
      // Rollback state on network error
      setSaved(previousSavedState);
      localStorage.setItem(savedKey, JSON.stringify(savedIds));
      queryClient.invalidateQueries({
        queryKey: ["savedRecipes", currentUser.userId],
      });
      showToast("Lỗi mạng khi lưu món ăn", "error");
    }
  };

  // Match badge logic
  let badgeHtml = null;
  if (selectedIngredients.length > 0) {
    if (recipe.isFullyMatched) {
      badgeHtml = (
        <div className="match-badge badge-full">
          <CheckCircle2 size={14} /> Đủ nguyên liệu
        </div>
      );
    } else if (recipe.matchPercentage && recipe.matchPercentage > 0) {
      badgeHtml = (
        <div className="match-badge badge-partial">
          Khớp {recipe.matchPercentage}%
        </div>
      );
    }
  }

  const imgUrl = recipe.recipeImage;

  return (
    <div className="recipe-card">
      <div className="card-img-wrapper">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={recipe.recipeName}
            className="card-img"
            onError={(e) => {
              (e.target as HTMLElement).outerHTML =
                '<div class="card-img-placeholder">🥘</div>';
            }}
          />
        ) : (
          <div className="card-img-placeholder">🥘</div>
        )}
        {badgeHtml}
      </div>

      <div className="card-body">
        <h3 className="recipe-name">{recipe.recipeName}</h3>

        <div className="recipe-metrics">
          <div className="metric-item">
            <Clock size={16} /> {recipe.cookTime || 15} phút
          </div>
          <div className="metric-item">
            <Flame size={16} /> Độ khó: {recipe.difficulty || "Dễ"}
          </div>
        </div>

        {(() => {
          const firstStepDesc =
            recipe.steps && recipe.steps.length > 0
              ? recipe.steps[0].description
              : "";
          const rawDesc =
            recipe.recipeDescription ||
            (recipe as any).description ||
            (firstStepDesc ? `Bước 1: ${firstStepDesc}` : "");
          const cleanDesc = rawDesc.trim();
          return (
            <p className="recipe-description">
              {cleanDesc ||
                "Món ăn thơm ngon, dễ làm, phù hợp bữa cơm gia đình."}
            </p>
          );
        })()}

        <div className="ingredients-section">
          <div className="card-ingredients-title">Thành phần nguyên liệu:</div>
          <div className="card-ingredients-list">
            {(recipe.ingredients || []).length > 0 ? (
              recipe.ingredients!.map((ingObj, idx) => {
                const ingName = ingObj.ingredientName || "Nguyên liệu";
                const cleanIng = ingName.trim().toLowerCase();
                const isMatched =
                  selectedIngredients.length > 0 &&
                  selectedIngredients.some((selected) => {
                    const cleanSel = selected.trim().toLowerCase();
                    return (
                      cleanSel.length > 0 &&
                      (cleanIng.includes(cleanSel) ||
                        cleanSel.includes(cleanIng))
                    );
                  });

                return (
                  <span
                    key={idx}
                    className={`ing-chip ${
                      isMatched
                        ? "matched"
                        : selectedIngredients.length > 0
                          ? "missing"
                          : "matched"
                    }`}
                  >
                    {ingName}
                  </span>
                );
              })
            ) : (
              <span className="ing-chip">Chưa cập nhật</span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
          <button
            className="btn-view-recipe"
            style={{ flex: 1 }}
            onClick={() => onOpenDetail(recipe)}
          >
            Xem công thức <ArrowRight size={16} />
          </button>

          <button
            className={`btn btn-secondary ${saved ? "saved" : ""}`}
            style={{
              padding: "0 0.85rem",
              borderRadius: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.85rem",
            }}
            title={saved ? "Đã lưu công thức" : "Lưu công thức yêu thích"}
            onClick={handleToggleSave}
          >
            <Bookmark size={16} color={saved ? "#22c55e" : "currentColor"} />
          </button>
        </div>
      </div>
    </div>
  );
};
