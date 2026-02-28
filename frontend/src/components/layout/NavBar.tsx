import React, { useState } from 'react';
import { Bell, User, ChevronDown, UserCircle, Settings, Key, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { Dropdown, MenuProps } from 'antd';
import ProfileModal from '../modals/ProfileModal';
import SettingsModal from '../modals/SettingsModal';
import ForgotPasswordModal from '../modals/ForgotPasswordModal';

const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard Overview';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: <span style={{ fontWeight: 600 }}>My Profile</span>,
      icon: <UserCircle size={16} />,
      onClick: () => setIsProfileOpen(true),
    },
    {
      key: 'settings',
      label: <span style={{ fontWeight: 600 }}>System Settings</span>,
      icon: <Settings size={16} />,
      onClick: () => setIsSettingsOpen(true),
    },
    {
      key: 'forgot',
      label: <span style={{ fontWeight: 600 }}>Update Password</span>,
      icon: <Key size={16} />,
      onClick: () => setIsForgotOpen(true),
    },
    { type: 'divider' },
    {
      key: 'logout',
      label: <span style={{ fontWeight: 600, color: '#ff4d4f' }}>Sign Out</span>,
      icon: <LogOut size={16} color="#ff4d4f" />,
      onClick: logout,
    },
  ];

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h1 className="page-title">{getPageTitle()}</h1>
      </div>

      <div className="navbar-right">
        <button className="icon-btn">
          <Bell size={20} />
          <span className="badge"></span>
        </button>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow trigger={['click']}>
          <div className="user-profile">
            <div className="avatar">
              {user?.avatar ? <img src={user.avatar} alt="User" /> : <User size={20} />}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.name || 'Guest'}</span>
              <span className="user-role">{user?.role || 'User'}</span>
            </div>
            <ChevronDown size={16} className="dropdown-icon" />
          </div>
        </Dropdown>
      </div>

      {/* Modals */}
      <ProfileModal visible={isProfileOpen} onCancel={() => setIsProfileOpen(false)} />
      <SettingsModal visible={isSettingsOpen} onCancel={() => setIsSettingsOpen(false)} />
      <ForgotPasswordModal visible={isForgotOpen} onCancel={() => setIsForgotOpen(false)} />

      <style>{`
        .navbar {
          height: 80px;
          background: #fff;
          padding: 0 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #edf2f7;
          position: sticky;
          top: 0;
          z-index: 90;
          transition: background 0.3s, border-color 0.3s;
        }
        .dark-mode .navbar {
          background: #1e293b;
          border-color: #334155;
        }
        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }
        .dark-mode .page-title {
          color: #f1f5f9;
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .icon-btn {
          background: transparent;
          border: none;
          color: #4a5568;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .dark-mode .icon-btn {
          color: #94a3b8;
        }
        .icon-btn:hover {
          background: #f7fafc;
        }
        .dark-mode .icon-btn:hover {
          background: #334155;
          color: #f1f5f9;
        }
        .badge {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          border: 2px solid #fff;
        }
        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 6px 12px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .user-profile:hover {
          background: #f7fafc;
        }
        .dark-mode .user-profile:hover {
          background: #334155;
        }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #edf2f7;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .dark-mode .avatar {
          background: #334155;
        }
        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #2d3748;
        }
        .dark-mode .user-name {
          color: #f1f5f9;
        }
        .user-role {
          font-size: 0.75rem;
          color: #718096;
          text-transform: capitalize;
        }
        .dark-mode .user-role {
          color: #94a3b8;
        }
        .dropdown-icon {
          color: #a0aec0;
        }
        @media (max-width: 640px) {
          .user-info { display: none; }
        }
      `}</style>
    </header>
  );
};

export default NavBar;
