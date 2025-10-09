import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

export const RequireVendor: React.FC = () => {
  const { user, isVendor } = useUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isVendor()) return <Navigate to="/" replace />;
  return <Outlet />;
};

export const RequireShopper: React.FC = () => {
  const { user, isShopper } = useUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isShopper()) return <Navigate to="/" replace />;
  return <Outlet />;
};