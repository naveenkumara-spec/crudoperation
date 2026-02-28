import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface RoleGateProps {
  roles: User['role'][];
  children: React.ReactNode;
  redirectTo?: string;
}

const RoleGate: React.FC<RoleGateProps> = ({ roles, children, redirectTo = '/' }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={redirectTo} replace />;
  return <>{children}</>;
};

export default RoleGate;
