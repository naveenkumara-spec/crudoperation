import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  BarChart2,
  UserCircle
} from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'employees', label: 'Employees', icon: Users, path: '/employees' },
  { id: 'departments', label: 'Departments', icon: Building2, path: '/departments' },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck, path: '/attendance' },
  { id: 'roles', label: 'Roles', icon: ShieldCheck, path: '/roles' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, path: '/analytics' },
  { id: 'users', label: 'User Profiles', icon: UserCircle, path: '/users' },
];

const Sidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar } = useUI();
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleNav = (path: string) => {
    navigate(path);
  };

  return (
    <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!isSidebarCollapsed && <span className="logo-text">EMS PRO</span>}
        <button className="toggle-btn" onClick={toggleSidebar}>
          {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {(menuItems.filter(item => {
          // Restrict admin-only pages from menu for non-admin/owner
          const adminOnly = item.id === 'roles' || item.id === 'departments';
          if (adminOnly && user?.role !== 'admin' && user?.role !== 'owner') return false;
          return true;
        })).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(item.path)}
              title={item.label}
            >
              <Icon size={22} />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <style>{`
        .sidebar {
          width: 260px;
          background: #1a1c23;
          color: #fff;
          height: 100vh;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 4px 0 10px rgba(0,0,0,0.1);
        }
        .sidebar.collapsed {
          width: 80px;
        }
        .sidebar-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          height: 80px;
        }
        .logo-text {
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--primary);
          letter-spacing: 1px;
        }
        .toggle-btn {
          background: rgba(255,255,255,0.05);
          border: none;
          color: #fff;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .toggle-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .sidebar-nav {
          flex: 1;
          padding: 20px 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: #9ea3b0;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.2s;
          text-decoration: none;
          width: 100%;
          font-size: 0.95rem;
          font-weight: 500;
        }
        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
        }
        .nav-item.active {
          background: var(--primary);
          color: #000;
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: ${isSidebarCollapsed ? '-100%' : '0'};
            width: 260px !important;
          }
        }
      `}</style>
    </aside >
  );
};

export default Sidebar;
