import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Eye, EyeOff } from "lucide-react";

export const AuthModals: React.FC = () => {
  const {
    activeModal,
    closeModal,
    handleLogin,
    handleRegister,
    currentUser,
    handleLogout,
  } = useAuth();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [regEmail, setRegEmail] = useState("");
  const [regPass, setRegPass] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");

  if (!activeModal) return null;

  return (
    <>
      {/* Login Modal */}
      {activeModal === "login" && (
        <div
          className="modal-backdrop-home open"
          style={{ display: "flex" }}
          onClick={closeModal}
        >
          <div
            className="modal-card-home auth-modal-card-home"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn-close-modal" onClick={closeModal}>
              <X size={20} />
            </button>

            <div className="auth-modal-header">
              <h3 className="auth-modal-title">Đăng Nhập SmartCook</h3>
              <p className="auth-modal-subtitle">
                Truy cập tài khoản để lưu công thức & quản lý tủ lạnh
              </p>
            </div>

            <form
              className="form-auth"
              onSubmit={async (e) => {
                e.preventDefault();
                await handleLogin(loginEmail, loginPass);
              }}
            >
              <div className="auth-field-group">
                <label className="auth-label">Địa chỉ Email</label>
                <input
                  type="email"
                  className="input-auth-field"
                  placeholder="vi-du@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Mật khẩu</label>
                <div className="password-input-wrapper">
                  <input
                    type={showLoginPass ? "text" : "password"}
                    className="input-auth-field"
                    placeholder="••••••••"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowLoginPass(!showLoginPass)}
                  >
                    {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-search-main-home"
                style={{ width: "100%", marginTop: "0.5rem" }}
              >
                Đăng Nhập
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {activeModal === "register" && (
        <div
          className="modal-backdrop-home open"
          style={{ display: "flex" }}
          onClick={closeModal}
        >
          <div
            className="modal-card-home auth-modal-card-home"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn-close-modal" onClick={closeModal}>
              <X size={20} />
            </button>

            <div className="auth-modal-header">
              <h3 className="auth-modal-title">Tạo Tài Khoản Mới</h3>
              <p className="auth-modal-subtitle">
                Tham gia cộng đồng SmartCook để lưu giữ hàng nghìn món ngon
              </p>
            </div>

            <form
              className="form-auth"
              onSubmit={async (e) => {
                e.preventDefault();
                await handleRegister(
                  regEmail,
                  regPass,
                  regFirstName,
                  regLastName,
                );
              }}
            >
              <div className="form-auth-row">
                <div className="auth-field-group">
                  <label className="auth-label">Họ</label>
                  <input
                    type="text"
                    className="input-auth-field"
                    placeholder="Nguyễn"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                  />
                </div>
                <div className="auth-field-group">
                  <label className="auth-label">Tên</label>
                  <input
                    type="text"
                    className="input-auth-field"
                    placeholder="Văn A"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Địa chỉ Email</label>
                <input
                  type="email"
                  className="input-auth-field"
                  placeholder="name@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div className="auth-field-group">
                <label className="auth-label">Mật khẩu</label>
                <div className="password-input-wrapper">
                  <input
                    type={showRegPass ? "text" : "password"}
                    className="input-auth-field"
                    placeholder="Tối thiểu 6 ký tự"
                    value={regPass}
                    onChange={(e) => setRegPass(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() => setShowRegPass(!showRegPass)}
                  >
                    {showRegPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-search-main-home"
                style={{ width: "100%", marginTop: "0.5rem" }}
              >
                Đăng Ký Tài Khoản
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {activeModal === "profile" && currentUser && (
        <div
          className="modal-backdrop-home open"
          style={{ display: "flex" }}
          onClick={closeModal}
        >
          <div
            className="modal-card-home auth-modal-card-home"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="btn-close-modal" onClick={closeModal}>
              <X size={20} />
            </button>

            <div className="profile-header">
              <div className="profile-avatar-lg">
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(currentUser.email)}`}
                  alt="Avatar"
                />
              </div>
              <h3>
                {currentUser.firstName} {currentUser.lastName || ""}
              </h3>
              <p className="profile-email">{currentUser.email}</p>
            </div>

            <div className="profile-details">
              <div className="profile-detail-item">
                <span className="detail-label">Mã tài khoản (User ID):</span>
                <span className="detail-value code">{currentUser.userId}</span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Quyền hạn (Role):</span>
                <span
                  className="detail-value"
                  style={{
                    fontWeight: 800,
                    color: currentUser.role
                      .map((r) => r.roleName)
                      .includes("admin")
                      ? "#f97316"
                      : "#22c55e",
                  }}
                >
                  {currentUser.role.map((r) => r.roleName).includes("admin")
                    ? "👑 ADMIN"
                    : "👤 USER"}
                </span>
              </div>
              <div className="profile-detail-item">
                <span className="detail-label">Trạng thái bảo mật:</span>
                <span className="detail-value badge-secure">
                  🔒 JWT Auth Protected
                </span>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn btn-secondary" onClick={closeModal}>
                Đóng
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                🚪 Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
