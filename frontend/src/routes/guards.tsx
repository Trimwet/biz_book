import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

export const RequireVendor: React.FC = () => {
  const { user, isVendor, loading } = useUser();
  const location = useLocation();
  if (loading) return null; // wait until auth initializes to avoid flicker
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isVendor()) return <Navigate to="/" replace />;
  return <Outlet />;
};

export const RequireShopper: React.FC = () => {
  const { user, isShopper, loading } = useUser();
  const location = useLocation();
  if (loading) return null; // wait until auth initializes to avoid flicker
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isShopper()) return <Navigate to="/" replace />;
  return <Outlet />;
};

export const GuestOnly: React.FC = () => {
  const { user, loading } = useUser();
  if (loading) return null;
  if (user) {
    const target = user.user_type === 'vendor' ? '/vendor/dashboard' : '/shopper/dashboard';
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
};

// Allow homepage for logged-in users if ?landing=1 is present
export const GuestOrAllowLanding: React.FC = () => {
  const { user, loading } = useUser();
  const location = useLocation();
  if (loading) return null;
  const params = new URLSearchParams(location.search);
  const allow = params.get('landing') === '1';
  if (allow) return <Outlet />;
  if (user) {
    const target = user.user_type === 'vendor' ? '/vendor/dashboard' : '/shopper/dashboard';
    return <Navigate to={target} replace />;
  }
  return <Outlet />;
};
