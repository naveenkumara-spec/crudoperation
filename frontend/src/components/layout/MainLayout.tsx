import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import NavBar from './NavBar';

const MainLayout: React.FC = () => {
  return (
    <div className="layout-root">
      <Sidebar />
      <div className="content-wrapper">
        <NavBar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        .layout-root {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #f1f5f9;
        }
        .content-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          position: relative;
        }
        .main-content {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          background: #f1f5f9;
        }
        @media (max-width: 1440px) {
          .main-content {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
