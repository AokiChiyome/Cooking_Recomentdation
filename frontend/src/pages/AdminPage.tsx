import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../services/api';
import type { AdminStats, Recipe } from '../types';


import { ChefHat, Globe, LogOut, PlusCircle, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AdminPage: React.FC = () => {
  const { currentUser, handleLogout, showToast } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal Thêm món ăn state
  const [showAddModal, setShowAddModal] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [cookTime, setCookTime] = useState(30);
  const [khauPhan, setKhauPhan] = useState('2 người');
  const [recipeImage, setRecipeImage] = useState('');
  const [recipeDesc, setRecipeDesc] = useState('');
  const [rawIngredients, setRawIngredients] = useState('');
  const [rawSteps, setRawSteps] = useState('');

  // Security check: Redirect if not ADMIN
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      showToast('🔒 Bạn không có quyền Admin để truy cập trang này!', 'error');
      navigate('/');
    } else {
      loadStats();
      loadAdminRecipes(1, searchQ);
    }
  }, [currentUser]);

  const loadStats = async () => {
    try {
      const res = await fetchWithAuth('/api/admin/stats');
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error('Load admin stats error:', err);
    }
  };

  const loadAdminRecipes = async (p = 1, q = '') => {
    setLoading(true);
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
      console.error('Load admin recipes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa món "${name}" khỏi CSDL?`)) return;

    try {
      const res = await fetchWithAuth(`/api/admin/recipes/${recipeId}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        showToast(`🗑️ Đã xóa thành công món "${name}".`, 'success');
        loadStats();
        loadAdminRecipes(page, searchQ);
      } else {
        showToast(json.message || 'Không thể xóa món ăn', 'error');
      }
    } catch (err) {
      showToast('Lỗi máy chủ khi xóa món ăn', 'error');
    }
  };

  const handleCreateRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const ingredients = rawIngredients
      ? rawIngredients.split('\n').filter((l) => l.trim()).map((l) => {
          const parts = l.split(':');
          return { ingredientName: parts[0].trim(), amount: parts[1] ? parts[1].trim() : 'Vừa đủ' };
        })
      : [];

    const steps = rawSteps ? rawSteps.split('\n').filter((l) => l.trim()) : [];

    const bodyData = {
      recipeName,
      cookTime,
      khauPhan,
      recipeImage,
      recipeDescription: recipeDesc,
      ingredients,
      steps,
    };

    try {
      const res = await fetchWithAuth('/api/admin/recipes', {
        method: 'POST',
        body: JSON.stringify(bodyData),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`🎉 Thêm thành công món "${recipeName}" vào CSDL!`, 'success');
        setShowAddModal(false);
        setRecipeName('');
        setRecipeImage('');
        setRecipeDesc('');
        setRawIngredients('');
        setRawSteps('');
        loadStats();
        loadAdminRecipes(1, searchQ);
      } else {
        showToast(json.message || 'Không thể thêm món ăn', 'error');
      }
    } catch (err) {
      showToast('Lỗi máy chủ khi thêm món ăn', 'error');
    }
  };

  return (
    <div className="admin-page-react">
      {/* Admin Navbar */}
      <header className="admin-navbar">
        <Link to="/admin" className="admin-brand">
          <ChefHat size={28} />
          <span>SmartCook</span>
          <span className="admin-badge">Admin Panel</span>
        </Link>
        <div className="admin-nav-actions">
          <Link to="/" className="btn-back-home">
            <Globe size={18} />
            <span>Về Trang Chủ</span>
          </Link>
          <button
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
            onClick={handleLogout}
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-container">
        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-bg-orange">🍲</div>
            <div className="stat-info">
              <h4>Tổng Công Thức</h4>
              <div className="stat-number">{stats ? stats.totalRecipes.toLocaleString('vi-VN') : '...'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-bg-blue">👥</div>
            <div className="stat-info">
              <h4>Tổng Người Dùng</h4>
              <div className="stat-number">{stats ? stats.totalUsers.toLocaleString('vi-VN') : '...'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-bg-green">🥦</div>
            <div className="stat-info">
              <h4>Tổng Nguyên Liệu</h4>
              <div className="stat-number">{stats ? stats.totalIngredients.toLocaleString('vi-VN') : '...'}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon-wrapper stat-bg-purple">🔒</div>
            <div className="stat-info">
              <h4>Bảo Mật Hệ Thống</h4>
              <div className="stat-number" style={{ fontSize: '1.1rem', color: '#22c55e' }}>RBAC Admin Active</div>
            </div>
          </div>
        </div>

        {/* Recipe Management Panel */}
        <section className="admin-panel-card">
          <div className="panel-header">
            <h2 className="panel-title">Quản Lý Công Thức Món Ăn (Recipe List)</h2>
            <div className="admin-table-search">
              <input
                type="text"
                className="admin-search-input"
                placeholder="Tìm theo tên món ăn..."
                value={searchQ}
                onChange={(e) => {
                  setSearchQ(e.target.value);
                  loadAdminRecipes(1, e.target.value);
                }}
              />
              <button className="btn-create-recipe" onClick={() => setShowAddModal(true)}>
                <PlusCircle size={18} />
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
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                      ⏳ Đang tải danh sách công thức...
                    </td>
                  </tr>
                ) : recipes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                      Không tìm thấy công thức món ăn nào.
                    </td>
                  </tr>
                ) : (
                  recipes.map((recipe) => (
                    <tr key={recipe.recipeId}>
                      <td>
                        <img
                          src={recipe.recipeImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'}
                          className="recipe-thumb"
                          alt={recipe.recipeName}
                        />
                      </td>
                      <td>
                        <strong>{recipe.recipeName}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ID: {recipe.recipeId}</div>
                      </td>
                      <td>⏱️ {recipe.cookTime || 15} phút</td>
                      <td>🍽️ {recipe.khauPhan || '2 người'}</td>
                      <td>🥦 {(recipe.ingredients || []).length} nguyên liệu</td>
                      <td>
                        <button
                          className="btn-action btn-action-delete"
                          onClick={() => handleDeleteRecipe(recipe.recipeId, recipe.recipeName)}
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              {page > 1 && (
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem' }} onClick={() => loadAdminRecipes(page - 1, searchQ)}>
                  ◀ Trang trước
                </button>
              )}
              <span style={{ alignSelf: 'center', fontSize: '0.88rem', fontWeight: 700, color: '#475569' }}>
                Trang {page} / {totalPages}
              </span>
              {page < totalPages && (
                <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem' }} onClick={() => loadAdminRecipes(page + 1, searchQ)}>
                  Trang sau ▶
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Modal Thêm món ăn mới */}
      {showAddModal && (
        <div className="modal-backdrop open" style={{ display: 'flex' }} onClick={() => setShowAddModal(false)}>
          <div className="modal-card auth-modal-card" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setShowAddModal(false)}>
              <X size={20} />
            </button>

            <div className="auth-modal-header">
              <h3 className="auth-modal-title">Thêm Món Ăn Mới</h3>
              <p className="auth-modal-subtitle">Điền thông tin công thức mới vào CSDL SmartCook</p>
            </div>

            <form className="form-auth" onSubmit={handleCreateRecipeSubmit}>
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
                <label className="auth-label">Nguyên liệu (Mỗi dòng một nguyên liệu, VD: Thịt bò: 300g)</label>
                <textarea
                  className="input-auth-field"
                  rows={3}
                  value={rawIngredients}
                  onChange={(e) => setRawIngredients(e.target.value)}
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Các bước thực hiện (Mỗi dòng một bước)</label>
                <textarea
                  className="input-auth-field"
                  rows={3}
                  value={rawSteps}
                  onChange={(e) => setRawSteps(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-search-main" style={{ width: '100%', marginTop: '0.5rem' }}>
                💾 Lưu Công Thức Món Ăn
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
