import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Enforces Role-Based Access Control (RBAC) on the frontend.
 * 
 * @param {Array} allowedRoles - List of roles permitted to access the route
 * @param {React.ReactNode} children - The component to render if authorized
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // 1. If not authenticated, redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Define the "Home" dashboard for each role (fallback redirection)
  const roleHomeMap = {
    'Job Manager': '/manager-dashboard',
    'Order Manager': '/inventory/orders',
    'Inventory Manager': '/inventory',
    'Production Staff': '/worker-dashboard'
  };

  // 3. If authenticated but role is not allowed, redirect to their respective home dashboard
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const fallbackPath = roleHomeMap[userRole] || '/login';
    return <Navigate to={fallbackPath} replace />;
  }

  // 4. If authorized, render the protected component
  return children;
};

export default ProtectedRoute;
