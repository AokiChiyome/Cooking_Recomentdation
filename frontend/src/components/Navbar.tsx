import React, { useState } from 'react';
import { ChefHat, ChevronDown, User as UserIcon, Bookmark, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface NavbarProps {
  activeTab: 'fridge' | 'all' | 'saved';
  onTabChange: (tab: 'fridge' | 'all' | 'saved') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onTabChange }) => {
  const { currentUser, openModal, handleLogout, showToast } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <div className="brand-icon">
            <ChefHat size={32} />
          </div>
          <div className="brand-text">Smart<span>Cook</span></div>
        </Link>

        <ul className="nav-links">
          <li>
            <button
              className={`nav-link ${activeTab === 'fridge' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => onTabChange('fridge')}
            >
              Tủ lạnh của tôi
            </button>
          </li>
          <li>
            <button
              className="nav-link"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => {
                showToast('🚀 Chức năng đang phát triển, vui lòng quay lại sau nhé!', 'info');
              }}
            >
              Công thức mới
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeTab === 'saved' ? 'active' : ''}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => onTabChange('saved')}
            >
              Đã lưu
            </button>
          </li>
        </ul>

        {/* User Auth Section */}
        {!currentUser ? (
          <div className="nav-auth-guest">
            <button className="btn-nav-login" onClick={() => openModal('login')}>
              Đăng nhập
            </button>
            <button className="btn-nav-register" onClick={() => openModal('register')}>
              Đăng ký
            </button>
          </div>
        ) : (
          <div className="nav-auth-user" style={{ position: 'relative' }}>
            <button
              className="user-badge-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <div className="user-avatar" style={{ width: '1.8rem', height: '1.8rem' }}>
                <img
                  src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(currentUser.email)}`}
                  alt="User Avatar"
                />
              </div>
              <span className="nav-user-name">Xin chào, {currentUser.firstName}</span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="user-dropdown open" style={{ display: 'flex' }}>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    openModal('profile');
                  }}
                >
                  <UserIcon size={16} /> Hồ sơ cá nhân
                </button>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    onTabChange('saved');
                  }}
                >
                  <Bookmark size={16} /> Công thức đã lưu
                </button>

                {currentUser.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="dropdown-item"
                    style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Shield size={16} /> Trang Quản Trị Admin
                  </Link>
                )}

                <div className="dropdown-divider" />
                <button
                  className="dropdown-item danger"
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
