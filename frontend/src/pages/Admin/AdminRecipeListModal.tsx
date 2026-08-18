import React, { useEffect, useState } from "react";
import { X, Clock } from "lucide-react";
import type { Recipe } from "../../types";

interface AdminRecipeListModalProps {
  title: string;
  filterParam: "categoryId" | "ingredientId";
  filterValue: string;
  onClose: () => void;
}

const FALLBACK_THUMB =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100";

export const AdminRecipeListModal: React.FC<AdminRecipeListModalProps> = ({
  title,
  filterParam,
  filterValue,
  onClose,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/recipes?${filterParam}=${filterValue}&limit=100`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.success && Array.isArray(json.data)) {
          setRecipes(json.data);
          setTotal(json.meta?.total ?? json.data.length);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRecipes([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filterParam, filterValue]);

  return (
    <div
      className="modal-backdrop open"
      style={{ display: "flex" }}
      onClick={onClose}
    >
      <div
        className="modal-card auth-modal-card"
        style={{ maxWidth: "560px" }}
        data-modal-label="Danh sách công thức"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn-close-modal" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="auth-modal-header">
          <h3 className="auth-modal-title">{title}</h3>
          <p className="auth-modal-subtitle">
            {loading
              ? "Đang tải..."
              : `${total} công thức${total > 100 ? " (hiển thị tối đa 100)" : ""}`}
          </p>
        </div>

        <div style={{ maxHeight: "55vh", overflowY: "auto" }}>
          {loading ? (
            <div className="table-empty-row">Đang tải danh sách công thức...</div>
          ) : recipes.length === 0 ? (
            <div className="table-empty-row">Không có công thức nào.</div>
          ) : (
            <table className="admin-table">
              <tbody>
                {recipes.map((r) => (
                  <tr key={r.recipeId}>
                    <td style={{ width: 60 }}>
                      <img
                        src={r.recipeImage || FALLBACK_THUMB}
                        className="recipe-thumb"
                        alt={r.recipeName}
                      />
                    </td>
                    <td>
                      <strong>{r.recipeName}</strong>
                    </td>
                    <td>
                      <span className="table-inline-icon">
                        <Clock size={13} /> {r.cookTime || 15} phút
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
