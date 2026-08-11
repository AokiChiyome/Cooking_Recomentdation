import React from "react";
import type { Recipe } from "../../types";
import { X, Clock, Users, Flame, ChefHat, ExternalLink } from "lucide-react";
import "./recipeDetailModal.css";

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
}

function formatStepDescription(desc: string, stepNumber?: number) {
  if (!desc) return "";

  let cleaned = desc.trim();

  if (stepNumber && cleaned.startsWith(stepNumber.toString())) {
    cleaned = cleaned.replace(new RegExp(`^${stepNumber}\\s*`), "");
  } else {
    cleaned = cleaned.replace(/^\d+\s+/, "");
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = cleaned.split(urlRegex);

  return parts.map((part, i) => {
    if (/^https?:\/\//i.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="recipe-reference-link"
          title={part}
        >
          <ExternalLink size={14} />
          Bài viết tham khảo
        </a>
      );
    }

    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
}) => {
  if (!recipe) return null;

  return (
    <div
      className="recipe-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết món ${recipe.recipeName}`}
    >
      <div className="recipe-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button
          type="button"
          className="recipe-modal-close"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X size={22} />
        </button>

        {/* Hero */}
        <div className="recipe-modal-hero">
          {recipe.recipeImage ? (
            <img
              src={recipe.recipeImage}
              alt={recipe.recipeName}
              className="recipe-modal-image"
            />
          ) : (
            <div className="recipe-modal-image-placeholder">
              <ChefHat size={52} />
            </div>
          )}

          <div className="recipe-modal-hero-overlay" />

          <div className="recipe-modal-hero-content">
            <span className="recipe-modal-badge">
              <ChefHat size={15} />
              Công thức món ăn
            </span>

            <h2 className="recipe-modal-title">{recipe.recipeName}</h2>
          </div>
        </div>

        {/* Metrics */}
        <div className="recipe-metrics">
          <div className="recipe-metric">
            <div className="recipe-metric-icon">
              <Clock size={19} />
            </div>

            <div>
              <span className="recipe-metric-label">Thời gian</span>
              <strong>{recipe.cookTime || 15} phút</strong>
            </div>
          </div>

          <div className="recipe-metric">
            <div className="recipe-metric-icon">
              <Users size={19} />
            </div>

            <div>
              <span className="recipe-metric-label">Khẩu phần</span>
              <strong>{recipe.khauPhan || "2 người"}</strong>
            </div>
          </div>

          <div className="recipe-metric">
            <div className="recipe-metric-icon">
              <Flame size={19} />
            </div>

            <div>
              <span className="recipe-metric-label">Độ khó</span>
              <strong>{recipe.difficulty || "Dễ"}</strong>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="recipe-modal-body">
          {/* Description */}
          {(recipe.recipeDescription || (recipe as any).description) && (
            <section className="recipe-description">
              <div className="recipe-section-icon">💡</div>

              <div>
                <h3>Giới thiệu món ăn</h3>
                <p>{recipe.recipeDescription || (recipe as any).description}</p>
              </div>
            </section>
          )}

          {/* Ingredients */}
          <section className="recipe-section">
            <div className="recipe-section-header">
              <div className="recipe-section-title-wrapper">
                <span className="recipe-section-emoji">🥦</span>

                <div>
                  <h3>Nguyên liệu</h3>
                  <p>Chuẩn bị đầy đủ trước khi bắt đầu</p>
                </div>
              </div>

              <span className="recipe-section-count">
                {(recipe.ingredients || []).length} món
              </span>
            </div>

            {(recipe.ingredients || []).length > 0 ? (
              <div className="recipe-ingredients">
                {recipe.ingredients!.map((ingObj, idx) => {
                  const ingName =
                    ingObj.ingredientName ||
                    ingObj.ingredient?.ingredientName ||
                    "Nguyên liệu";

                  const qty = ingObj.quantity
                    ? `${ingObj.quantity}${
                        ingObj.unit?.unitName ? ` ${ingObj.unit.unitName}` : ""
                      }`
                    : ingObj.amount
                      ? ingObj.amount
                      : "";

                  return (
                    <div className="recipe-ingredient" key={idx}>
                      <span className="ingredient-dot" />

                      <span className="ingredient-name">{ingName}</span>

                      {qty && (
                        <span className="ingredient-quantity">{qty}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="recipe-empty">
                Đang cập nhật danh sách nguyên liệu...
              </div>
            )}
          </section>

          {/* Steps */}
          <section className="recipe-section">
            <div className="recipe-section-header">
              <div className="recipe-section-title-wrapper">
                <span className="recipe-section-emoji">🍳</span>

                <div>
                  <h3>Các bước thực hiện</h3>
                  <p>Làm theo từng bước để có món ăn ngon</p>
                </div>
              </div>

              <span className="recipe-section-count">
                {(recipe.steps || []).length} bước
              </span>
            </div>

            {(recipe.steps || []).length > 0 ? (
              <div className="recipe-steps">
                {recipe.steps!.map((step, idx) => {
                  const stepNumber =
                    typeof step.stepNumber === "number"
                      ? step.stepNumber
                      : Number(step.stepNumber) || idx + 1;

                  return (
                    <div className="recipe-step" key={idx}>
                      <div className="recipe-step-number">{stepNumber}</div>

                      {idx < recipe.steps!.length - 1 && (
                        <div className="recipe-step-line" />
                      )}

                      <div className="recipe-step-content">
                        <span className="recipe-step-label">
                          Bước {stepNumber}
                        </span>

                        <p>
                          {formatStepDescription(step.description, stepNumber)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="recipe-empty">
                Sơ chế nguyên liệu và chế biến theo khẩu vị gia đình.
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="recipe-modal-footer">
          <button
            type="button"
            className="recipe-close-button"
            onClick={onClose}
          >
            Đóng công thức
          </button>
        </div>
      </div>
    </div>
  );
};
