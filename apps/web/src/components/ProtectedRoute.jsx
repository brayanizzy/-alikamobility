
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser?.role)) {
    // Redirect to their appropriate dashboard if they try to access a page they shouldn't
    if (currentUser?.role === 'super-admin') return <Navigate to="/super-admin" replace />;
    if (currentUser?.role === 'admin') return <Navigate to="/dashboard" replace />;
    if (currentUser?.role === 'agent') return <Navigate to="/agent" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
