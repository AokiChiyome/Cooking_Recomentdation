import React, { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../services/api";
import type { Ingredient } from "../../types";
import { AdminRecipeListModal } from "./AdminRecipeListModal";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export const AdminIngredientPage: React.FC = () => {
  const { showToast } = useAuth();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingredientName, setIngredientName] = useState("");

  const [viewingRecipesOf, setViewingRecipesOf] = useState<Ingredient | null>(null);

  const debouncedSearchQ = useDebouncedValue(searchQ, 400);

  useEffect(() => {
    loadIngredients(1, debouncedSearchQ);
  }, [debouncedSearchQ]);

  const loadIngredients = async (p = 1, q = searchQ) => {
    setLoading(true);
    try {
      const url = `/api/ingredients?page=${p}&limit=20&search=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setIngredients(json.data);
        setPage(json.meta?.page ?? 1);
        setTotalPages(json.meta?.totalPages ?? 1);
      }
    } catch (err) {
      showToast("Lỗi tải nguyên liệu", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingIngredient(null);
    setIngredientName("");
    setShowModal(true);
  };

  const openEditModal = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIngredientName(ingredient.ingredientName);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingredientName.trim()) {
      showToast("Tên nguyên liệu không được để trống", "error");
      return;
    }

    try {
      const isEdit = !!editingIngredient;
      const url = isEdit
        ? `/api/ingredients/${editingIngredient!.ingredientId}`
        : "/api/ingredients";

      const res = await fetchWithAuth(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify({ ingredientName: ingredientName.trim() }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          `✅ ${isEdit ? "Cập nhật" : "Tạo"} nguyên liệu thành công`,
          "success"
        );
        setShowModal(false);
        loadIngredients(page, searchQ);
      } else {
        showToast(json.message || "Lỗi không xác định", "error");
      }
    } catch (err) {
      showToast("Lỗi máy chủ", "error");
    }
  };

  const handleDelete = async (ingredientId: string, name: string) => {
    if (!window.confirm(`Xoá nguyên liệu "${name}"?`)) return;

    try {
      const res = await fetchWithAuth(`/api/ingredients/${ingredientId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("✅ Xoá nguyên liệu thành công", "success");
        loadIngredients(page, searchQ);
      } else {
        showToast(json.message || "Không thể xoá nguyên liệu", "error");
      }
    } catch (err) {
      showToast("Lỗi máy chủ khi xoá nguyên liệu", "error");
    }
  };

  return (
    <section className="admin-panel-card">
      <div className="panel-header">
        <h2 className="panel-title">Danh sách nguyên liệu</h2>
        <div className="admin-table-search">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên nguyên liệu..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <button className="btn-create-recipe" onClick={openCreateModal}>
            <PlusCircle size={16} />
            <span>Thêm Nguyên Liệu</span>
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên nguyên liệu</th>
              <th>Số công thức</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="table-empty-row">
                  Đang tải danh sách nguyên liệu...
                </td>
              </tr>
            ) : ingredients.length === 0 ? (
              <tr>
                <td colSpan={3} className="table-empty-row">
                  Không tìm thấy nguyên liệu nào.
                </td>
              </tr>
            ) : (
              ingredients.map((ing) => (
                <tr key={ing.ingredientId}>
                  <td>
                    <strong>{ing.ingredientName}</strong>
                  </td>
                  <td>
                    <button
                      className="recipe-count-link"
                      disabled={!ing.recipeCount}
                      onClick={() => setViewingRecipesOf(ing)}
                    >
                      {ing.recipeCount ?? 0} công thức
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn-action"
                      onClick={() => openEditModal(ing)}
                    >
                      <Pencil size={14} />
                      Sửa
                    </button>
                    <button
                      className="btn-action btn-action-delete"
                      onClick={() => handleDelete(ing.ingredientId, ing.ingredientName)}
                    >
                      <Trash2 size={14} /> Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          {page > 1 && (
            <button
              className="btn-secondary"
              onClick={() => loadIngredients(page - 1, searchQ)}
            >
              ◀ Trang trước
            </button>
          )}
          <span className="admin-pagination-label">
            Trang {page} / {totalPages}
          </span>
          {page < totalPages && (
            <button
              className="btn-secondary"
              onClick={() => loadIngredients(page + 1, searchQ)}
            >
              Trang sau ▶
            </button>
          )}
        </div>
      )}

      {showModal && (
        <div
          className="modal-backdrop open"
          style={{ display: "flex" }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="modal-card auth-modal-card"
            style={{ maxWidth: "480px" }}
            data-modal-label={editingIngredient ? "Sửa nguyên liệu" : "Thêm nguyên liệu"}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn-close-modal" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <div className="auth-modal-header">
              <h3 className="auth-modal-title">
                {editingIngredient ? "Chỉnh Sửa Nguyên Liệu" : "Thêm Nguyên Liệu Mới"}
              </h3>
              <p className="auth-modal-subtitle">
                {editingIngredient
                  ? "Cập nhật thông tin nguyên liệu trong CSDL SmartCook"
                  : "Điền thông tin nguyên liệu mới vào CSDL SmartCook"}
              </p>
            </div>

            <form className="form-auth" onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <label className="auth-label">Tên nguyên liệu *</label>
                <input
                  type="text"
                  className="input-auth-field"
                  placeholder="Ví dụ: Thịt bò"
                  value={ingredientName}
                  onChange={(e) => setIngredientName(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-search-main">
                {editingIngredient ? "💾 Cập Nhật Nguyên Liệu" : "💾 Lưu Nguyên Liệu"}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewingRecipesOf && (
        <AdminRecipeListModal
          title={`Công thức dùng "${viewingRecipesOf.ingredientName}"`}
          filterParam="ingredientId"
          filterValue={viewingRecipesOf.ingredientId}
          onClose={() => setViewingRecipesOf(null)}
        />
      )}
    </section>
  );
};
