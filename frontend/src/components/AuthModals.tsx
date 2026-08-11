import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Eye, EyeOff, LogOut, User as UserIcon, Mail } from "lucide-react";

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
          className="modal-backdrop open"
          style={{ display: "flex" }}
          onClick={closeModal}
        >
          <div
            className="modal-card auth-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "2.25rem 2rem 2rem",
              maxWidth: 440,
              width: "100%",
              borderRadius: 24,
              border: "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
              background: "#ffffff",
            }}
          >
            <button
              className="btn-close-modal"
              onClick={closeModal}
              style={{ top: "1.25rem", right: "1.25rem" }}
            >
              <X size={20} />
            </button>

            <div
              className="profile-header"
              style={{ marginBottom: "1.5rem", textAlign: "center" }}
            >
              <div
                className="profile-avatar-lg"
                style={{
                  margin: "0 auto 1rem",
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  border: "3px solid #ea580c",
                  padding: 3,
                  boxShadow: "0 8px 20px rgba(234, 88, 12, 0.2)",
                  background: "#fff",
                }}
              >
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(currentUser.email)}`}
                  alt="Avatar"
                  style={{ width: "100%", height: "100%", borderRadius: "50%" }}
                />
              </div>
              <h3
                style={{
                  fontSize: "1.45rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                {currentUser.lastName ? `${currentUser.lastName} ` : ""}
                {currentUser.firstName}
              </h3>
              <p
                className="profile-email"
                style={{
                  color: "#475569",
                  fontSize: "0.92rem",
                  marginTop: "0.25rem",
                  fontWeight: 500,
                }}
              >
                {currentUser.email}
              </p>

              {/* Role badge */}
              <div style={{ marginTop: "0.6rem" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 12px",
                    borderRadius: 50,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    background:
                      typeof currentUser.role === "string" &&
                      currentUser.role.toUpperCase() === "ADMIN"
                        ? "linear-gradient(135deg, #ea580c, #c2410c)"
                        : "linear-gradient(135deg, #10b981, #059669)",
                    color: "#ffffff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                >
                  {typeof currentUser.role === "string"
                    ? currentUser.role.toUpperCase()
                    : "USER"}
                </span>
              </div>
            </div>

            <div
              className="profile-details"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.85rem",
                marginBottom: "1.75rem",
              }}
            >
              <div
                className="profile-detail-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.85rem 1.1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "0.9rem",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span
                  className="detail-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    color: "#475569",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  <UserIcon size={17} style={{ color: "#ea580c" }} /> Họ và tên:
                </span>
                <span
                  className="detail-value"
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: "0.95rem",
                  }}
                >
                  {currentUser.lastName ? `${currentUser.lastName} ` : ""}
                  {currentUser.firstName}
                </span>
              </div>

              <div
                className="profile-detail-item"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.85rem 1.1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "0.9rem",
                  border: "1px solid #e2e8f0",
                }}
              >
                <span
                  className="detail-label"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.55rem",
                    color: "#475569",
                    fontSize: "0.9rem",
                    fontWeight: 600,
                  }}
                >
                  <Mail size={17} style={{ color: "#ea580c" }} /> Email:
                </span>
                <span
                  className="detail-value"
                  style={{
                    fontWeight: 700,
                    color: "#0f172a",
                    fontSize: "0.95rem",
                  }}
                >
                  {currentUser.email}
                </span>
              </div>
            </div>

            <div
              className="profile-actions"
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="btn-profile-close"
                onClick={closeModal}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.7rem 1.4rem",
                  borderRadius: "0.8rem",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  color: "#334155",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Đóng
              </button>

              <button
                type="button"
                className="btn-profile-logout"
                onClick={handleLogout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  padding: "0.7rem 1.4rem",
                  borderRadius: "0.8rem",
                  border: "1px solid #fecaca",
                  backgroundColor: "#fef2f2",
                  color: "#dc2626",
                  fontWeight: 700,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(220, 38, 38, 0.1)",
                }}
              >
                <LogOut size={17} /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
