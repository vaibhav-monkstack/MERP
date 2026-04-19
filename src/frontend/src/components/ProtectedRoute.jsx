import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROLES } from '../utils/constants';

/**
 * ProtectedRoute Component
 * Enforces Role-Based Access Control (RBAC) on the frontend.
 * 
 * @param {Array} allowedRoles - List of roles permitted to access the route
 * @param {React.ReactNode} children - The component to render if authorized
 */
const ProtectedRoute = ({ allowedRoles, children }) => {
  // Temporarily bypass all login and role checks for accessing any section
  return children;
  /*
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // 1. If not authenticated, redirect to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Define the "Home" dashboard for each role (fallback redirection)
  const roleHomeMap = {
    [ROLES.JOB_MANAGER]: '/jobs',
    [ROLES.ORDER_MANAGER]: '/orders',
    [ROLES.INVENTORY_MANAGER]: '/inventory',
    [ROLES.PRODUCTION_STAFF]: '/jobs/worker'
  };

  // 3. If authenticated but role is not allowed, redirect to their respective home dashboard
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    const fallbackPath = roleHomeMap[userRole] || '/login';
    return <Navigate to={fallbackPath} replace />;
  }

  // 4. If authorized, render the protected component
  return children;
  */
};

export default ProtectedRoute;
