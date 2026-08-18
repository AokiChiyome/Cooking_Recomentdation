import React, { useState, useEffect } from "react";
import { PlusCircle, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchWithAuth } from "../../services/api";
import type { Unit } from "../../types";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";

export const AdminUnitPage: React.FC = () => {
  const { showToast } = useAuth();

  const [units, setUnits] = useState<Unit[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQ, setSearchQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [unitName, setUnitName] = useState("");
  const [symbol, setSymbol] = useState("");

  const debouncedSearchQ = useDebouncedValue(searchQ, 400);

  useEffect(() => {
    loadUnits(1, debouncedSearchQ);
  }, [debouncedSearchQ]);

  const loadUnits = async (p = 1, q = searchQ) => {
    setLoading(true);
    try {
      const url = `/api/units?page=${p}&limit=20&search=${encodeURIComponent(q)}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setUnits(json.data);
        setPage(json.meta?.page ?? 1);
        setTotalPages(json.meta?.totalPages ?? 1);
      }
    } catch (err) {
      showToast("Lỗi tải đơn vị", "error");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingUnit(null);
    setUnitName("");
    setSymbol("");
    setShowModal(true);
  };

  const openEditModal = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitName(unit.unitName);
    setSymbol(unit.symbol);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitName.trim() || !symbol.trim()) {
      showToast("Vui lòng điền đầy đủ tên đơn vị và ký hiệu", "error");
      return;
    }

    try {
      const isEdit = !!editingUnit;
      const url = isEdit ? `/api/units/${editingUnit!.unitId}` : "/api/units";

      const res = await fetchWithAuth(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify({ unitName: unitName.trim(), symbol: symbol.trim() }),
      });

      const json = await res.json();
      if (json.success) {
        showToast(`✅ ${isEdit ? "Cập nhật" : "Tạo"} đơn vị thành công`, "success");
        setShowModal(false);
        loadUnits(page, searchQ);
      } else {
        showToast(json.message || "Lỗi không xác định", "error");
      }
    } catch (err) {
      showToast("Lỗi máy chủ", "error");
    }
  };

  const handleDelete = async (unitId: string, name: string) => {
    if (!window.confirm(`Xoá đơn vị "${name}"?`)) return;

    try {
      const res = await fetchWithAuth(`/api/units/${unitId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        showToast("✅ Xoá đơn vị thành công", "success");
        loadUnits(page, searchQ);
      } else {
        showToast(json.message || "Không thể xoá đơn vị", "error");
      }
    } catch (err) {
      showToast("Lỗi máy chủ khi xoá đơn vị", "error");
    }
  };

  return (
    <section className="admin-panel-card">
      <div className="panel-header">
        <h2 className="panel-title">Danh sách đơn vị</h2>
        <div className="admin-table-search">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên hoặc ký hiệu..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <button className="btn-create-recipe" onClick={openCreateModal}>
            <PlusCircle size={16} />
            <span>Thêm Đơn Vị</span>
          </button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên đơn vị</th>
              <th>Ký hiệu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="table-empty-row">
                  Đang tải danh sách đơn vị...
                </td>
              </tr>
            ) : units.length === 0 ? (
              <tr>
                <td colSpan={3} className="table-empty-row">
                  Không tìm thấy đơn vị nào.
                </td>
              </tr>
            ) : (
              units.map((unit) => (
                <tr key={unit.unitId}>
                  <td>
                    <strong>{unit.unitName}</strong>
                  </td>
                  <td>
                    <span className="table-inline-icon">{unit.symbol}</span>
                  </td>
                  <td>
                    <button
                      className="btn-action"
                      onClick={() => openEditModal(unit)}
                    >
                      <Pencil size={14} />
                      Sửa
                    </button>
                    <button
                      className="btn-action btn-action-delete"
                      onClick={() => handleDelete(unit.unitId, unit.unitName)}
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
              onClick={() => loadUnits(page - 1, searchQ)}
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
              onClick={() => loadUnits(page + 1, searchQ)}
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
            data-modal-label={editingUnit ? "Sửa đơn vị" : "Thêm đơn vị"}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn-close-modal" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>

            <div className="auth-modal-header">
              <h3 className="auth-modal-title">
                {editingUnit ? "Chỉnh Sửa Đơn Vị" : "Thêm Đơn Vị Mới"}
              </h3>
              <p className="auth-modal-subtitle">
                {editingUnit
                  ? "Cập nhật thông tin đơn vị trong CSDL SmartCook"
                  : "Điền thông tin đơn vị mới vào CSDL SmartCook"}
              </p>
            </div>

            <form className="form-auth" onSubmit={handleSubmit}>
              <div className="form-auth-row">
                <div className="auth-field-group">
                  <label className="auth-label">Tên đơn vị *</label>
                  <input
                    type="text"
                    className="input-auth-field"
                    placeholder="Ví dụ: Kilogram"
                    value={unitName}
                    onChange={(e) => setUnitName(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-field-group">
                  <label className="auth-label">Ký hiệu *</label>
                  <input
                    type="text"
                    className="input-auth-field"
                    placeholder="Ví dụ: kg"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-search-main">
                {editingUnit ? "💾 Cập Nhật Đơn Vị" : "💾 Lưu Đơn Vị"}
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
