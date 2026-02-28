import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { UIProvider, useUI } from './context/UIContext';
import MainLayout from './components/layout/MainLayout';
import AuthGate from './modules/auth/AuthGate';
import Login from './modules/auth/Login';
import RoleGate from './modules/auth/RoleGate';
import Dashboard from './modules/dashboard/Dashboard';
import EmployeeList from './modules/employees/EmployeeList';
import Attendance from './modules/attendance/Attendance';
import Departments from './modules/departments/Departments';
import Roles from './modules/roles/Roles';
import Analytics from './modules/analytics/Analytics';
import Users from './modules/users/Users';

const AppContent: React.FC = () => {
    const { isDarkMode, primaryColor } = useUI();

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    colorPrimary: primaryColor,
                    borderRadius: 10,
                    fontFamily: 'Inter, sans-serif',
                },
                components: {
                    Button: {
                        colorPrimaryActive: primaryColor,
                        colorPrimaryHover: primaryColor,
                    }
                }
            }}
        >
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={<AuthGate><MainLayout /></AuthGate>}>
                        <Route index element={<Dashboard />} />
                        <Route path="employees" element={<EmployeeList />} />
                        <Route path="departments" element={<RoleGate roles={['admin', 'owner']}><Departments /></RoleGate>} />
                        <Route path="attendance" element={<Attendance />} />
                        <Route path="roles" element={<RoleGate roles={['admin', 'owner']}><Roles /></RoleGate>} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="users" element={<Users />} />
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>

            <style>{`
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    color: ${isDarkMode ? '#e2e8f0' : '#1a202c'};
                    background: ${isDarkMode ? '#0f172a' : '#f8f9fa'};
                }
                .dark-mode .ant-table-wrapper {
                    background: #1e293b;
                }
                .placeholder {
                    padding: 48px;
                    text-align: center;
                    background: ${isDarkMode ? '#1e293b' : '#fff'};
                    border-radius: 16px;
                    border: 2px dashed ${isDarkMode ? '#334155' : '#e2e8f0'};
                    color: ${isDarkMode ? '#94a3b8' : '#718096'};
                    font-weight: 500;
                }
                .ant-table-wrapper {
                    background: white;
                    border-radius: 16px;
                }
                .ant-modal-content {
                    border-radius: 16px !important;
                    overflow: hidden;
                }
            `}</style>
        </ConfigProvider>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <UIProvider>
                <AppContent />
            </UIProvider>
        </AuthProvider>
    );
};

export default App;
