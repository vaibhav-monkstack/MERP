import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, ClipboardList, ShoppingCart } from 'lucide-react';

const UnifiedNavbar = () => {
  const location = useLocation();
  
  // Do not show the navbar on the login screen or production worker pages
  const isHidden = 
    location.pathname === '/login' || 
    location.pathname === '/' || 
    location.pathname.startsWith('/worker') || 
    location.pathname.startsWith('/job/');

  if (isHidden) {
    return null;
  }

  const role = localStorage.getItem('role');

  const allNavItems = [
    { name: 'Order Management Dashboard', path: '/inventory/orders', icon: ShoppingCart, allowedRoles: ['Order Manager'] },
    { name: 'Job Management Dashboard', path: '/manager-dashboard', icon: ClipboardList, allowedRoles: ['Job Manager'] },
    { name: 'Inventory Management Dashboard', path: '/inventory', icon: Package, allowedRoles: ['Inventory Manager'] },
  ];

  // Filter items based on the user's role
  const navItems = allNavItems.filter(item => item.allowedRoles.includes(role));

  return (
    <div className="bg-gray-900 text-white shadow-md z-50 sticky top-0 border-b border-gray-700">
      <div className="max-w-screen-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2 font-bold text-lg tracking-wide text-blue-400">
            <span className="bg-blue-600 text-white rounded p-1 text-xs">MOP</span>
            Manufacturing Hub
          </div>
          
          <div className="flex space-x-2">
            {navItems.map((item) => {
              // Highlight the active module
              let isActive = false;
              if (item.path === '/inventory') {
                // For Inventory, only highlight if the path is EXACTLY /inventory or /inventory/ (not /inventory/orders)
                isActive = location.pathname === '/inventory' || location.pathname === '/inventory/';
              } else {
                // For other items, startsWith is fine
                isActive = location.pathname.startsWith(item.path);
              }
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon size={16} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          <div className="text-xs text-gray-400 font-mono">
            v2.0 Unified Setup
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedNavbar;
