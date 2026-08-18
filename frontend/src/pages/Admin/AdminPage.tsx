import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../services/api";
import { isAdminUser } from "../../types";
import type { AdminStats, Recipe } from "../../types";
import { AdminCategoryPage } from "./AdminCategoryPage";
import { AdminIngredientPage } from "./AdminIngredientPage";
import { AdminUnitPage } from "./AdminUnitPage";
import { RecipeDetailModal } from "../../components/recipeDetailModal/RecipeDetailModal";
import { DIFFICULTY_OPTIONS } from "../../constants/difficulty";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import type { Category } from "../../types";

import {
  ChefHat,
  Clock,
  Globe,
  Leaf,
  LogOut,
  PlusCircle,
  ShieldCheck,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
  Pencil,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./admin.css";

type AdminTab = "recipes" | "categories" | "ingredients" | "units";

export const AdminPage: React.FC = () => {
  const { currentUser, authLoading, handleLogout, showToast } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>("recipes");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [apiLoadingCount, setApiLoadingCount] = useState(0);

  const startApiLoading = () => {
    setApiLoadingCount((count) => count + 1);
  };

  const stopApiLoading = () => {
    setApiLoadingCount((count) => Math.max(0, count - 1));
  };

  const isApiLoading = apiLoadingCount > 0;

  // Modal Thêm món ăn state
  // const [showAddModal, setShowAddModal] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [cookTime, setCookTime] = useState(30);
  const [khauPhan, setKhauPhan] = useState("2 người");
  const [recipeImage, setRecipeImage] = useState("");
  const [recipeDesc, setRecipeDesc] = useState("");
  const [rawIngredients, setRawIngredients] = useState("");
  const [rawSteps, setRawSteps] = useState("");
  const [difficulty, setDifficulty] = useState("0");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);

  // Security check: Redirect if not ADMIN
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAdminUser(currentUser)) {
      showToast("🔒 Bạn không có quyền Admin để truy cập trang này!", "error");
      navigate("/");
      return;
    }

    loadStats();
    loadCategories();
  }, [currentUser, authLoading]);

  // Refetch mỗi khi mở dialog tạo/sửa công thức, để danh mục vừa tạo ở tab
  // "Danh Mục" (nếu có) luôn xuất hiện thay vì dùng danh sách cũ lúc mount.
  useEffect(() => {
    if (showRecipeModal) {
      loadCategories();
    }
  }, [showRecipeModal]);

  const debouncedSearchQ = useDebouncedValue(searchQ, 400);

  useEffect(() => {
    if (authLoading || !isAdminUser(currentUser)) return;
    loadAdminRecipes(1, debouncedSearchQ);
  }, [debouncedSearchQ, authLoading, currentUser]);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/categories?limit=100");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAllCategories(json.data);
      }
    } catch (err) {
      console.error("Load categories error:", err);
    }
  };

  const loadStats = async () => {
    startApiLoading();

    try {
      const res = await fetchWithAuth("/api/admin/stats");
      const json = await res.json();

      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Load admin stats error:", err);
    } finally {
      stopApiLoading();
    }
  };

  const loadAdminRecipes = async (p = 1, q = "") => {
    setLoading(true);
    startApiLoading();

    try {
      const url = `/api/admin/recipes?page=${p}&limit=10&q=${encodeURIComponent(q)}`;
      const res = await fetchWithAuth(url);
      const json = await res.json();

      if (json.success && json.data) {
        setRecipes(json.data.items || []);
        setPage(json.data.pagination.page);
        setTotalPages(json.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Load admin recipes error:", err);
    } finally {
      setLoading(false);
      stopApiLoading();
    }
  };

  const handleDeleteRecipe = async (recipeId: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa món "${name}" khỏi CSDL?`))
      return;

    startApiLoading();

    try {
      const res = await fetchWithAuth(`/api/admin/recipes/${recipeId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (json.success) {
        showToast(`🗑️ Đã xóa thành công món "${name}".`, "success");
        loadStats();
        loadAdminRecipes(page, searchQ);
      } else {
        showToast(json.message || "Không thể xóa món ăn", "error");
      }
    } catch (err) {
      showToast("Lỗi máy chủ khi xóa món ăn", "error");
    } finally {
      stopApiLoading();
    }
  };

  // const handleCreateRecipeSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   const ingredients = rawIngredients
  //     ? rawIngredients
  //         .split("\n")
  //         .filter((l) => l.trim())
  //         .map((l) => {
  //           const parts = l.split(":");
  //           return {
  //             ingredientName: parts[0].trim(),
  //             amount: parts[1] ? parts[1].trim() : "Vừa đủ",
  //           };
  //         })
  //     : [];

  //   const steps = rawSteps ? rawSteps.split("\n").filter((l) => l.trim()) : [];

  //   const bodyData = {
  //     recipeName,
  //     cookTime,
  //     khauPhan,
  //     recipeImage,
  //     recipeDescription: recipeDesc,
  //     ingredients,
  //     steps,
  //   };

  //   try {
  //     const res = await fetchWithAuth("/api/admin/recipes", {
  //       method: "POST",
  //       body: JSON.stringify(bodyData),
  //     });

  //     const json = await res.json();
  //     if (json.success) {
  //       showToast(
  //         `🎉 Thêm thành công món "${recipeName}" vào CSDL!`,
  //         "success",
  //       );
  //       setShowAddModal(false);
  //       setRecipeName("");
  //       setRecipeImage("");
  //       setRecipeDesc("");
  //       setRawIngredients("");
  //       setRawSteps("");
  //       loadStats();
  //       loadAdminRecipes(1, searchQ);
  //     } else {
  //       showToast(json.message || "Không thể thêm món ăn", "error");
  //     }
  //   } catch (err) {
  //     showToast("Lỗi máy chủ khi thêm món ăn", "error");
  //   }
  // };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();

    const ingredients = rawIngredients
      ? rawIngredients
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => {
            const [name, ...amountParts] = line.split(":");

            return {
              ingredientName: name.trim(),
              quantity: amountParts.join(":").trim() || "Vừa đủ",
            };
          })
      : [];

    const steps = rawSteps
      ? rawSteps
          .split("\n")
          .filter((line) => line.trim())
          .map((description, index) => ({
            stepNumber: index + 1,
            description: description.trim(),
          }))
      : [];

    const bodyData = {
      recipeName,
      cookTime,
      khauPhan,
      recipeImage,
      recipeDescription: recipeDesc,
      difficulty,
      categoryIds,
      ingredients,
      steps,
    };

    startApiLoading();

    try {
      const isEdit = !!editingRecipe;

      const url = isEdit
        ? `/api/admin/recipes/${editingRecipe.recipeId}`
        : "/api/admin/recipes";

      const res = await fetchWithAuth(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(bodyData),
      });

      const json = await res.json();

      if (json.success) {
        showToast(
          isEdit
            ? `✅ Đã cập nhật "${recipeName}"!`
            : `🎉 Đã thêm "${recipeName}" vào CSDL!`,
          "success",
        );

        setShowRecipeModal(false);
        setEditingRecipe(null);

        setRecipeName("");
        setCookTime(30);
        setKhauPhan("2 người");
        setRecipeImage("");
        setRecipeDesc("");
        setRawIngredients("");
        setRawSteps("");
        setDifficulty("0");
        setCategoryIds([]);

        loadStats();
        loadAdminRecipes(isEdit ? page : 1, searchQ);
      } else {
        showToast(json.message || "Không thể lưu công thức", "error");
      }
    } catch (err) {
      console.error("Save recipe error:", err);

      showToast("Lỗi máy chủ khi lưu công thức", "error");
    } finally {
      stopApiLoading();
    }
  };

  if (authLoading) {
    return (
      <div
        className="admin-page-react"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#faf6ee",
        }}
      >
        <p className="dash-loading" style={{ fontSize: 18, color: "#795548" }}>
          ⏳ Đang kiểm tra quyền Admin...
        </p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div
        className="admin-page-react"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: 24,
          textAlign: "center",
          background: "#faf6ee",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "36px 44px",
            borderRadius: 24,
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            maxWidth: 460,
            width: "100%",
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔒</div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1e293b",
              marginBottom: 12,
            }}
          >
            Yêu cầu đăng nhập Quản trị
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: 14,
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Vui lòng đăng nhập bằng tài khoản Admin (
            <strong style={{ color: "#ea580c" }}>thientu0900@gmail.com</strong>)
            để xem trang Quản lý Admin này.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link
              to="/"
              style={{
                padding: "11px 22px",
                borderRadius: 12,
                background: "#f1f5f9",
                color: "#475569",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Về Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdminUser(currentUser)) {
    return (
      <div
        className="admin-page-react"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: 24,
          textAlign: "center",
          background: "#faf6ee",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            padding: "36px 44px",
            borderRadius: 24,
            boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            maxWidth: 460,
            width: "100%",
          }}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>🚫</div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#1e293b",
              marginBottom: 12,
            }}
          >
            Không có quyền truy cập
          </h2>
          <p
            style={{
              color: "#64748b",
              fontSize: 14,
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            Tài khoản{" "}
            <strong style={{ color: "#0f172a" }}>{currentUser.email}</strong>{" "}
            hiện tại chỉ có quyền Người dùng, không có quyền Quản trị Admin.
          </p>
          <Link
            to="/"
            style={{
              padding: "11px 24px",
              borderRadius: 12,
              background: "#ea580c",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: 14,
              display: "inline-block",
            }}
          >
            Quay lại Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  const handleEditRecipe = (recipe: any) => {
    setEditingRecipe(recipe);

    setRecipeName(recipe.recipeName || "");
    setCookTime(recipe.cookTime || 30);
    setKhauPhan(recipe.khauPhan || "2 người");
    setRecipeImage(recipe.recipeImage || recipe.hinh_anh || "");
    setRecipeDesc(recipe.recipeDescription || "");
    setDifficulty(recipe.difficulty || "0");
    setCategoryIds(
      (recipe.categories || []).map((c: Category) => c.categoryId),
    );

    const ingredientsText = (recipe.ingredients || [])
      .map((ingredient: any) => {
        return `${ingredient.ingredientName}: ${ingredient.quantity || "Vừa đủ"}`;
      })
      .join("\n");

    setRawIngredients(ingredientsText);

    const stepsText = (recipe.steps || [])
      .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
      .map((step: any) => step.description)
      .join("\n");

    setRawSteps(stepsText);

    setShowRecipeModal(true);
  };

  return (
    <>
      {isApiLoading && (
        <div className="admin-loading-overlay">
          <div className="admin-loading-box">
            <div className="admin-loading-spinner" />
            <span>Đang xử lý...</span>
          </div>
        </div>
      )}
      <div className="admin-page-react">
        {/* Admin Navbar */}
        <header className="admin-navbar">
          <Link to="/admin" className="admin-brand">
            <ChefHat size={26} />
            <span>SmartCook</span>
            <span className="admin-badge">Admin Panel</span>
          </Link>
          <nav className="admin-nav-tabs">
            <Link to="/admin" className="admin-nav-tab active">
              Quản lý
            </Link>
            <Link to="/admin/dashboard" className="admin-nav-tab">
              Thống kê
            </Link>
          </nav>
          <div className="admin-nav-actions">
            <Link to="/" className="btn-back-home">
              <Globe size={16} />
              <span>Về Trang Chủ</span>
            </Link>
            <button className="btn" onClick={handleLogout}>
              <LogOut size={15} /> Đăng xuất
            </button>
          </div>
        </header>

        {/* Main Container */}
        <main className="admin-container">
          {/* Stats Grid */}
          <div className="admin-stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-bg-orange">
                <ChefHat size={20} />
              </div>
              <div className="stat-info">
                <h4>Tổng Công Thức</h4>
                <div className="stat-number">
                  {stats ? stats.totalRecipes.toLocaleString("vi-VN") : "..."}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-bg-blue">
                <Users size={20} />
              </div>
              <div className="stat-info">
                <h4>Tổng Người Dùng</h4>
                <div className="stat-number">
                  {stats ? stats.totalUsers.toLocaleString("vi-VN") : "..."}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-bg-green">
                <Leaf size={20} />
              </div>
              <div className="stat-info">
                <h4>Tổng Nguyên Liệu</h4>
                <div className="stat-number">
                  {stats
                    ? stats.totalIngredients.toLocaleString("vi-VN")
                    : "..."}
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-bg-purple">
                <ShieldCheck size={20} />
              </div>
              <div className="stat-info">
                <h4>Bảo Mật Hệ Thống</h4>
                <div className="stat-number" style={{ fontSize: "13px" }}>
                  RBAC Admin Active
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="admin-subtabs">
            <button
              className={`admin-subtab${activeTab === "recipes" ? " active" : ""}`}
              onClick={() => setActiveTab("recipes")}
            >
              Công Thức
            </button>
            <button
              className={`admin-subtab${activeTab === "categories" ? " active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              Danh Mục
            </button>
            <button
              className={`admin-subtab${activeTab === "ingredients" ? " active" : ""}`}
              onClick={() => setActiveTab("ingredients")}
            >
              Nguyên Liệu
            </button>
            <button
              className={`admin-subtab${activeTab === "units" ? " active" : ""}`}
              onClick={() => setActiveTab("units")}
            >
              Đơn Vị
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "categories" && <AdminCategoryPage />}
          {activeTab === "ingredients" && <AdminIngredientPage />}
          {activeTab === "units" && <AdminUnitPage />}

          {/* Recipe Management Panel */}
          {activeTab === "recipes" && (
          <section className="admin-panel-card">
            <div className="panel-header">
              <h2 className="panel-title">Danh sách công thức món ăn</h2>
              <div className="admin-table-search">
                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="Tìm theo tên món ăn..."
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                />
                <button
                  className="btn-create-recipe"
                  onClick={() => {
                    setEditingRecipe(null);

                    setRecipeName("");
                    setCookTime(30);
                    setKhauPhan("2 người");
                    setRecipeImage("");
                    setRecipeDesc("");
                    setRawIngredients("");
                    setRawSteps("");
                    setDifficulty("0");
                    setCategoryIds([]);

                    setShowRecipeModal(true);
                  }}
                >
                  <PlusCircle size={16} />
                  <span>Thêm Món Mới</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Hình ảnh</th>
                    <th>Tên Món Ăn</th>
                    <th>Thời gian</th>
                    <th>Khẩu phần</th>
                    <th>Số nguyên liệu</th>
                    <th>Người tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="table-empty-row">
                        Đang tải danh sách công thức...
                      </td>
                    </tr>
                  ) : recipes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty-row">
                        Không tìm thấy công thức món ăn nào.
                      </td>
                    </tr>
                  ) : (
                    recipes.map((recipe: any) => (
                      <tr key={recipe.recipeId}>
                        <td
                          style={{ cursor: "pointer" }}
                          onClick={() => setViewingRecipe(recipe)}
                          title="Xem chi tiết công thức"
                        >
                          <img
                            src={
                              recipe.recipeImage ||
                              "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100"
                            }
                            className="recipe-thumb"
                            alt={recipe.recipeName}
                          />
                        </td>
                        <td
                          style={{ cursor: "pointer" }}
                          onClick={() => setViewingRecipe(recipe)}
                          title="Xem chi tiết công thức"
                        >
                          <strong>{recipe.recipeName}</strong>
                          <div className="recipe-id-caption">
                            ID: {recipe.recipeId}
                          </div>
                        </td>
                        <td>
                          <span className="table-inline-icon">
                            <Clock size={13} /> {recipe.cookTime || 15} phút
                          </span>
                        </td>
                        <td>
                          <span className="table-inline-icon">
                            <UtensilsCrossed size={13} />{" "}
                            {recipe.khauPhan || "2 người"}
                          </span>
                        </td>
                        <td>
                          <span className="table-inline-icon">
                            <Leaf size={13} />{" "}
                            {(recipe.ingredients || []).length} nguyên liệu
                          </span>
                        </td>
                        <td>
                          <span className="table-inline-icon">
                            <Users size={13} />{" "}
                            {recipe.createdByUser || "Hệ thống"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-action"
                            onClick={() => handleEditRecipe(recipe)}
                          >
                            <Pencil size={14} />
                            Sửa
                          </button>
                          <button
                            className="btn-action btn-action-delete"
                            onClick={() =>
                              handleDeleteRecipe(
                                recipe.recipeId,
                                recipe.recipeName,
                              )
                            }
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="admin-pagination">
                {page > 1 && (
                  <button
                    className="btn-secondary"
                    onClick={() => loadAdminRecipes(page - 1, searchQ)}
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
                    onClick={() => loadAdminRecipes(page + 1, searchQ)}
                  >
                    Trang sau ▶
                  </button>
                )}
              </div>
            )}
          </section>
          )}
        </main>

        {/* Modal Thêm món ăn mới */}
        {showRecipeModal && (
          <div
            className="modal-backdrop open"
            style={{ display: "flex" }}
            onClick={() => setShowRecipeModal(false)}
          >
            <div
              className="modal-card auth-modal-card"
              style={{ maxWidth: "600px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn-close-modal"
                onClick={() => setShowRecipeModal(false)}
              >
                <X size={20} />
              </button>

              <div className="auth-modal-header">
                <h3 className="auth-modal-title">
                  {editingRecipe ? "Chỉnh Sửa Công Thức" : "Thêm Món Ăn Mới"}
                </h3>
                <p className="auth-modal-subtitle">
                  {editingRecipe
                    ? "Cập nhật thông tin công thức trong CSDL SmartCook"
                    : "Điền thông tin công thức mới vào CSDL SmartCook"}
                </p>
              </div>

              <form className="form-auth" onSubmit={handleSaveRecipe}>
                <div className="auth-field-group">
                  <label className="auth-label">Tên món ăn *</label>
                  <input
                    type="text"
                    className="input-auth-field"
                    placeholder="Ví dụ: Phở Bò Bắp Hoa"
                    value={recipeName}
                    onChange={(e) => setRecipeName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-auth-row">
                  <div className="auth-field-group">
                    <label className="auth-label">Thời gian nấu (Phút)</label>
                    <input
                      type="number"
                      className="input-auth-field"
                      value={cookTime}
                      onChange={(e) => setCookTime(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="auth-field-group">
                    <label className="auth-label">Khẩu phần ăn</label>
                    <input
                      type="text"
                      className="input-auth-field"
                      value={khauPhan}
                      onChange={(e) => setKhauPhan(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">URL Hình ảnh món ăn</label>
                  <input
                    type="url"
                    className="input-auth-field"
                    placeholder="https://images.unsplash.com/..."
                    value={recipeImage}
                    onChange={(e) => setRecipeImage(e.target.value)}
                  />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Mô tả tóm tắt món ăn</label>
                  <textarea
                    className="input-auth-field"
                    rows={2}
                    value={recipeDesc}
                    onChange={(e) => setRecipeDesc(e.target.value)}
                  />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Độ khó</label>
                  <select
                    className="input-auth-field"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                  >
                    {DIFFICULTY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">Danh mục</label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      padding: "10px 12px",
                      background: "var(--paper)",
                      border: "1px solid var(--rule)",
                      borderRadius: "3px",
                      maxHeight: "140px",
                      overflowY: "auto",
                    }}
                  >
                    {allCategories.length === 0 ? (
                      <span
                        style={{ fontSize: "12.5px", color: "var(--ink-soft)" }}
                      >
                        Chưa có danh mục nào — tạo ở tab "Danh Mục" trước.
                      </span>
                    ) : (
                      allCategories.map((cat) => (
                        <label
                          key={cat.categoryId}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={categoryIds.includes(cat.categoryId)}
                            onChange={(e) => {
                              setCategoryIds((prev) =>
                                e.target.checked
                                  ? [...prev, cat.categoryId]
                                  : prev.filter((id) => id !== cat.categoryId),
                              );
                            }}
                          />
                          {cat.categoryName}
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">
                    Nguyên liệu (Mỗi dòng một nguyên liệu, VD: Thịt bò: 300g)
                  </label>
                  <textarea
                    className="input-auth-field"
                    rows={3}
                    value={rawIngredients}
                    onChange={(e) => setRawIngredients(e.target.value)}
                  />
                </div>

                <div className="auth-field-group">
                  <label className="auth-label">
                    Các bước thực hiện (Mỗi dòng một bước)
                  </label>
                  <textarea
                    className="input-auth-field"
                    rows={3}
                    value={rawSteps}
                    onChange={(e) => setRawSteps(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn-search-main">
                  {editingRecipe
                    ? "💾 Cập Nhật Công Thức"
                    : "💾 Lưu Công Thức Món Ăn"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Xem chi tiết công thức (chỉ xem, không sửa) */}
        <RecipeDetailModal
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
        />
      </div>
    </>
  );
};
