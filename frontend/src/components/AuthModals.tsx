import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Eye, EyeOff, LogOut, User as UserIcon, Mail } from 'lucide-react';

export const AuthModals: React.FC = () => {
  const { activeModal, closeModal, handleLogin, handleRegister, currentUser, handleLogout } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);

  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');

  if (!activeModal) return null;

  return (
    <>
      {/* Login Modal */}
      {activeModal === 'login' && (
        <div className="modal-backdrop open" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={closeModal}>
              <X size={20} />
            </button>

            <div className="auth-modal-header">
              <h3 className="auth-modal-title">Đăng Nhập SmartCook</h3>
              <p className="auth-modal-subtitle">Truy cập tài khoản để lưu công thức & quản lý tủ lạnh</p>
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
                    type={showLoginPass ? 'text' : 'password'}
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

              <button type="submit" className="btn btn-search-main" style={{ width: '100%', marginTop: '0.5rem' }}>
                Đăng Nhập
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {activeModal === 'register' && (
        <div className="modal-backdrop open" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={closeModal}>
              <X size={20} />
            </button>

            <div className="auth-modal-header">
              <h3 className="auth-modal-title">Tạo Tài Khoản Mới</h3>
              <p className="auth-modal-subtitle">Tham gia cộng đồng SmartCook để lưu giữ hàng nghìn món ngon</p>
            </div>

            <form
              className="form-auth"
              onSubmit={async (e) => {
                e.preventDefault();
                await handleRegister(regEmail, regPass, regFirstName, regLastName);
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
                    type={showRegPass ? 'text' : 'password'}
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

              <button type="submit" className="btn btn-search-main" style={{ width: '100%', marginTop: '0.5rem' }}>
                Đăng Ký Tài Khoản
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {activeModal === 'profile' && currentUser && (
        <div className="modal-backdrop open" style={{ display: 'flex' }} onClick={closeModal}>
          <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '2rem' }}>
            <button className="btn-close-modal" onClick={closeModal} style={{ top: '1.25rem', right: '1.25rem' }}>
              <X size={20} />
            </button>

            <div className="profile-header" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <div className="profile-avatar-lg" style={{ margin: '0 auto 1rem' }}>
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(currentUser.email)}`}
                  alt="Avatar"
                />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {currentUser.lastName ? `${currentUser.lastName} ` : ''}{currentUser.firstName}
              </h3>
              <p className="profile-email" style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '0.25rem' }}>
                {currentUser.email}
              </p>
            </div>

            <div className="profile-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
              <div className="profile-detail-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                <span className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                  <UserIcon size={16} /> Họ và tên:
                </span>
                <span className="detail-value" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>
                  {currentUser.lastName ? `${currentUser.lastName} ` : ''}{currentUser.firstName}
                </span>
              </div>

              <div className="profile-detail-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
                <span className="detail-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: 500 }}>
                  <Mail size={16} /> Email:
                </span>
                <span className="detail-value" style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.92rem' }}>
                  {currentUser.email}
                </span>
              </div>
            </div>

            <div className="profile-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-profile-close"
                onClick={closeModal}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f8fafc',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Đóng
              </button>

              <button
                type="button"
                className="btn-profile-logout"
                onClick={handleLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.4rem',
                  borderRadius: '0.75rem',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)',
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

