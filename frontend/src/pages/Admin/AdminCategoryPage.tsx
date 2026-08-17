import React, { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../services/api";
import type { Category } from "../../types";
import { AdminRecipeListModal } from "./AdminRecipeListModal";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export const AdminCategoryPage: React.FC = () => {
  const { showToast } = useAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");

  const [viewingRecipesOf, setViewingRecipesOf] = useState<Category | null>(null);

  const debouncedSearchQ = useDebouncedValue(searchQ, 400);

  useEffect(() => {
    loadCategories(1, debouncedSearchQ);
  }, [debouncedSearchQ]);

  const loadCategories = async (p = 1, q = searchQ) => {
    setLoading(true);
    try {
      const url = `/api/categories?page=${p}&limit=20&search=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setCategories(json.data);
        setPage(json.meta?.page ?? 1);
        setTotalPages(json.meta?.totalPages ?? 1);
      }
    } catch (err) {
      showToast("Lỗi tải danh mục", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setParentCategoryId("");
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.categoryName);
    setParentCategoryId(category.parentCategoryId || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      showToast("Tên danh mục không được để trống", "error");
      return;
    }

    try {
      const isEdit = !!editingCategory;
      const url = isEdit
        ? `/api/categories/${editingCategory!.categoryId}`
        : "/api/categories";

      const res = await fetchWithAuth(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify({
          // Lưu ý: API yêu cầu field "ingredientCategoryName" (không phải categoryName)
          ingredientCategoryName: categoryName.trim(),
          parentCategoryId: parentCategoryId || null,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(
          `✅ ${isEdit ? "Cập nhật" : "Tạo"} danh mục thành công`,
          "success"
        );
        setShowModal(false);
        loadCategories(page, searchQ);
      } else {
        showToast(json.message || "Lỗi không xác định", "error");
      }
    } catch (err) {
      showToast("Lỗi máy chủ", "error");
    }
  };

  const handleDelete = async (categoryId: string, name: string) => {
    if (!window.confirm(`Xoá danh mục "${name}"?`)) return;

    try {
      const res = await fetchWithAuth(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("✅ Xoá danh mục thành công", "success");
        loadCategories(page, searchQ);
      } else {
        showToast(json.message || "Không thể xoá danh mục", "error");
      }
    } catch (err) {
      showToast("Lỗi máy chủ khi xoá danh mục", "error");
    }
  };

  return (
    <section className="admin-panel-card">
      <div className="panel-header">
        <h2 className="panel-title">Danh sách danh mục</h2>
        <div className="admin-table-search">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên danh mục..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <button className="btn-create-recipe" onClick={openCreateModal}>
            <PlusCircle size={16} />
            <span>Thêm Danh Mục</span>
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên danh mục</th>
              <th>Danh mục cha</th>
              <th>Số công thức</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="table-empty-row">
                  Đang tải danh sách danh mục...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-empty-row">
                  Không tìm thấy danh mục nào.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.categoryId}>
                  <td>
                    <strong>{cat.categoryName}</strong>
                  </td>
                  <td>{cat.parent?.categoryName || "—"}</td>
                  <td>
                    <button
                      className="recipe-count-link"
                      disabled={!cat.recipeCount}
                      onClick={() => setViewingRecipesOf(cat)}
                    >
                      {cat.recipeCount ?? 0} công thức
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn-action"
                      onClick={() => openEditModal(cat)}
                    >
                      <Pencil size={14} />
                      Sửa
                    </button>
                    <button
                      className="btn-action btn-action-delete"
                      onClick={() => handleDelete(cat.categoryId, cat.categoryName)}
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
              onClick={() => loadCategories(page - 1, searchQ)}
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
              onClick={() => loadCategories(page + 1, searchQ)}
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
            data-modal-label={editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn-close-modal" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <div className="auth-modal-header">
              <h3 className="auth-modal-title">
                {editingCategory ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
              </h3>
              <p className="auth-modal-subtitle">
                {editingCategory
                  ? "Cập nhật thông tin danh mục trong CSDL SmartCook"
                  : "Điền thông tin danh mục mới vào CSDL SmartCook"}
              </p>
            </div>

            <form className="form-auth" onSubmit={handleSubmit}>
              <div className="auth-field-group">
                <label className="auth-label">Tên danh mục *</label>
                <input
                  type="text"
                  className="input-auth-field"
                  placeholder="Ví dụ: Rau củ"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Danh mục cha (tuỳ chọn)</label>
                <select
                  className="input-auth-field"
                  value={parentCategoryId}
                  onChange={(e) => setParentCategoryId(e.target.value)}
                >
                  <option value="">— Không có —</option>
                  {categories
                    .filter((c) => c.categoryId !== editingCategory?.categoryId)
                    .map((c) => (
                      <option key={c.categoryId} value={c.categoryId}>
                        {c.categoryName}
                      </option>
                    ))}
                </select>
              </div>

              <button type="submit" className="btn-search-main">
                {editingCategory ? "💾 Cập Nhật Danh Mục" : "💾 Lưu Danh Mục"}
              </button>
            </form>
          </div>
        </div>
      )}

      {viewingRecipesOf && (
        <AdminRecipeListModal
          title={`Công thức thuộc "${viewingRecipesOf.categoryName}"`}
          filterParam="categoryId"
          filterValue={viewingRecipesOf.categoryId}
          onClose={() => setViewingRecipesOf(null)}
        />
      )}
    </section>
  );
};
