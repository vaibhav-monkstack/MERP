import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, ClipboardList, ShoppingCart, LayoutDashboard, Box, MessageSquare, Truck } from 'lucide-react';

const UnifiedNavbar = () => {
  const location = useLocation();
  const role = localStorage.getItem('role');

  // Do not show the navbar on the login screen or specific worker pages
  const isHidden = 
    location.pathname === '/login' || 
    location.pathname === '/' || 
    location.pathname.startsWith('/worker') || 
    location.pathname.startsWith('/job/');

  if (isHidden) return null;

  // Main high-level modules
  const mainModules = [
    { name: 'Orders', path: '/orders', icon: ShoppingCart, allowedRoles: ['Order Manager'] },
    { name: 'Jobs', path: '/manager-dashboard', icon: ClipboardList, allowedRoles: ['Job Manager'] },
    { name: 'Inventory', path: '/inventory', icon: Package, allowedRoles: ['Inventory Manager'] },
  ];

  // Sub-links for Inventory Management
  const inventorySubLinks = [
    { name: 'Dashboard', path: '/inventory', icon: LayoutDashboard },
    { name: 'Materials', path: '/inventory/materials', icon: Box },
    { name: 'Requests', path: '/inventory/requests', icon: MessageSquare },
    { name: 'Suppliers', path: '/inventory/suppliers', icon: Truck },
  ];

  const isInventoryActive = location.pathname.startsWith('/inventory');

  const filteredModules = mainModules.filter(m => m.allowedRoles.includes(role));

  return (
    <div className="z-50 sticky top-0 flex flex-col w-full">
      {/* Primary Navbar */}
      <nav className="bg-slate-900 text-white shadow-xl border-b border-slate-800">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-extrabold text-xl tracking-tight text-white">
            <div className="bg-indigo-600 rounded-lg p-1.5 flex items-center justify-center">
              <span className="text-sm font-black italic">MOP</span>
            </div>
            <span>Manufacturing <span className="text-indigo-400">Hub</span></span>
          </div>
          
          <div className="flex items-center gap-2">
            {filteredModules.map((item) => {
              const isActive = item.path === '/inventory' 
                ? (location.pathname === '/inventory' || (location.pathname.startsWith('/inventory') && !location.pathname.startsWith('/inventory/orders')))
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-y-[-1px]'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </div>
          
          <div className="hidden md:block text-[10px] text-slate-500 font-black tracking-widest uppercase">
            v3.0 Master Theme
          </div>
        </div>
      </nav>

      {/* Secondary Sub-Navbar (Only for Inventory) */}
      {isInventoryActive && (
        <div className="bg-white border-b border-gray-100 shadow-sm overflow-x-auto no-scrollbar">
          <div className="max-w-screen-2xl mx-auto px-6 flex items-center h-12 gap-8">
            {inventorySubLinks.map((sub) => {
              const isActive = location.pathname === sub.path || (sub.path === '/inventory' && location.pathname === '/inventory/');
              return (
                <Link
                  key={sub.name}
                  to={sub.path}
                  className={`flex items-center gap-2 text-xs font-bold transition-colors whitespace-nowrap h-full border-b-2 px-1 ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <sub.icon size={14} />
                  {sub.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedNavbar;
