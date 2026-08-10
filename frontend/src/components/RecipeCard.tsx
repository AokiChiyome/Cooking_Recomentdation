import React, { useState } from 'react';
import type { Recipe } from '../types';
import { Clock, Flame, ArrowRight, Bookmark, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../services/api';


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
  isSaved: initialIsSaved = false,
  onToggleSaveSuccess,
}) => {
  const { currentUser, openModal, showToast } = useAuth();
  const [saved, setSaved] = React.useState<boolean>(() => {
    if (!currentUser) return false;
    const savedKey = `saved_recipes_${currentUser.userId}`;
    const savedIds: string[] = JSON.parse(localStorage.getItem(savedKey) || '[]');
    return savedIds.includes(recipe.recipeId);
  });

  React.useEffect(() => {
    if (!currentUser) {
      setSaved(false);
    } else {
      const savedKey = `saved_recipes_${currentUser.userId}`;
      const savedIds: string[] = JSON.parse(localStorage.getItem(savedKey) || '[]');
      setSaved(savedIds.includes(recipe.recipeId));
    }
  }, [currentUser, recipe.recipeId]);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      showToast('⚠️ Vui lòng đăng nhập để lưu công thức món ăn yêu thích.', 'error');
      openModal('login');
      return;
    }

    const savedKey = `saved_recipes_${currentUser.userId}`;
    const savedIds: string[] = JSON.parse(localStorage.getItem(savedKey) || '[]');

    let newSavedIds: string[] = [];
    let isNowSaved = false;

    if (savedIds.includes(recipe.recipeId)) {
      newSavedIds = savedIds.filter((id) => id !== recipe.recipeId);
      isNowSaved = false;
    } else {
      newSavedIds = [...savedIds, recipe.recipeId];
      isNowSaved = true;
    }

    localStorage.setItem(savedKey, JSON.stringify(newSavedIds));
    setSaved(isNowSaved);

    showToast(
      isNowSaved ? '⭐ Đã lưu món ăn vào danh sách yêu thích!' : '🗑️ Đã xóa món ăn khỏi danh sách đã lưu.',
      isNowSaved ? 'success' : 'info'
    );

    if (onToggleSaveSuccess) {
      onToggleSaveSuccess();
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

  const imgUrl = recipe.recipeImage || recipe.hinh_anh;

  return (
    <div className="recipe-card">
      <div className="card-img-wrapper">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={recipe.recipeName}
            className="card-img"
            onError={(e) => {
              (e.target as HTMLElement).outerHTML = '<div class="card-img-placeholder">🥘</div>';
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
            <Flame size={16} /> Độ khó: {recipe.difficulty || 'Dễ'}
          </div>
        </div>

        <p className="recipe-description">
          {recipe.recipeDescription || 'Chưa có mô tả chi tiết cho món ăn này.'}
        </p>

        <div className="ingredients-section">
          <div className="card-ingredients-title">Thành phần nguyên liệu:</div>
          <div className="card-ingredients-list">
            {(recipe.ingredients || []).length > 0 ? (
              recipe.ingredients!.map((ingObj, idx) => {
                const ingName = ingObj.ingredientName || ingObj.ingredient?.ingredientName || 'Nguyên liệu';
                const isMatched =
                  selectedIngredients.length > 0 &&
                  selectedIngredients.some(
                    (selected) =>
                      ingName.toLowerCase().includes(selected) ||
                      selected.includes(ingName.toLowerCase())
                  );

                return (
                  <span
                    key={idx}
                    className={`ing-chip ${
                      isMatched
                        ? 'matched'
                        : selectedIngredients.length > 0
                        ? 'missing'
                        : 'matched'
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

        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          <button
            className="btn-view-recipe"
            style={{ flex: 1 }}
            onClick={() => onOpenDetail(recipe)}
          >
            Xem công thức <ArrowRight size={16} />
          </button>

          <button
            className={`btn btn-secondary ${saved ? 'saved' : ''}`}
            style={{
              padding: '0 0.85rem',
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.85rem',
            }}
            title={saved ? 'Đã lưu công thức' : 'Lưu công thức yêu thích'}
            onClick={handleToggleSave}
          >
            <Bookmark size={16} color={saved ? '#22c55e' : 'currentColor'} />
          </button>
        </div>
      </div>
    </div>
  );
};
