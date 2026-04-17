import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Package, ClipboardList, ShoppingCart, LayoutDashboard, Box, MessageSquare, Truck, Menu, X, Plus, Users, LogOut, User, Layers, Archive } from 'lucide-react';



import { ROLES } from '../utils/constants';

const UnifiedNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };


  // Do not show the navbar on the login screen or specific worker pages
  const isHidden = 
    location.pathname === '/login' || 
    location.pathname === '/' || 
    location.pathname.startsWith('/worker') || 
    location.pathname.startsWith('/job/');

  if (isHidden) return null;

  // Main high-level modules
  const mainModules = [
    { name: 'Orders', path: '/orders', icon: ShoppingCart, allowedRoles: [ROLES.ORDER_MANAGER] },
    { name: 'Jobs', path: '/jobs', icon: ClipboardList, allowedRoles: [ROLES.JOB_MANAGER] },
    { name: 'Inventory', path: '/inventory', icon: Package, allowedRoles: [ROLES.INVENTORY_MANAGER] },
  ];

  // Sub-links for Inventory Management
  const inventorySubLinks = [
    { name: 'Dashboard', path: '/inventory', icon: LayoutDashboard },
    { name: 'Materials', path: '/inventory/materials', icon: Box },
    { name: 'Requests', path: '/inventory/requests', icon: MessageSquare },
    { name: 'Suppliers', path: '/inventory/suppliers', icon: Truck },
    { name: 'Analytics', path: '/inventory/analytics', icon: Layers },
    { name: 'Stock Log', path: '/inventory/movements', icon: Archive },
  ];

  // Sub-links for Order Management
  const orderSubLinks = [
    { name: 'Dashboard', path: '/orders', icon: LayoutDashboard },
    { name: 'Customers', path: '/orders/customers', icon: Users },
  ];

  // Sub-links for Job Management (Manager Only)
  const jobsSubLinks = [
    { name: 'Dashboard',          path: '/jobs',           icon: LayoutDashboard },
    { name: 'Product Templates',  path: '/jobs/templates', icon: Layers },
    { name: 'Manage Teams',       path: '/jobs/teams',     icon: Users },
  ];

  const isInventoryActive = location.pathname.startsWith('/inventory');
  const isOrdersActive = location.pathname.startsWith('/orders');
  const isJobsActive = location.pathname.startsWith('/jobs') && !location.pathname.startsWith('/jobs/worker');

  const filteredModules = mainModules.filter(m => m.allowedRoles.includes(role));

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const renderSubNav = (links, basePath) => {
    // Find the currently active link name for the mobile header
    const activeLink = links.find(sub => 
      location.pathname === sub.path || (sub.path === basePath && location.pathname === `${basePath}/`)
    );
    const activeName = activeLink ? activeLink.name : 'Menu';
    const ActiveIcon = activeLink ? activeLink.icon : Layers;

    return (
      <div className="bg-white border-b border-gray-100 shadow-sm relative z-40">
        <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row lg:items-center px-4 lg:px-6">
          
          {/* Mobile Toggle Button */}
          <div 
            className="flex items-center justify-between h-12 lg:hidden w-full cursor-pointer" 
            onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
          >
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <ActiveIcon size={16} />
              <span>{activeName}</span>
            </div>
            <button className="text-gray-500 p-1 rounded-md hover:bg-gray-100 transition-colors" aria-label="Toggle Sub Menu">
              {isSubMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          {/* Links Container */}
          <div className={`${isSubMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row w-full lg:w-auto lg:h-12 gap-1 lg:gap-8 pb-3 lg:pb-0`}>
            {links.map((sub) => {
              const isActive = location.pathname === sub.path || (sub.path === basePath && location.pathname === `${basePath}/`);
              return (
                <Link
                  key={sub.name}
                  to={sub.path}
                  onClick={() => setIsSubMenuOpen(false)}
                  className={`flex items-center gap-2 text-sm lg:text-xs font-bold transition-all px-3 py-2 lg:p-0 lg:h-full lg:border-b-2 rounded-lg lg:rounded-none ${
                    isActive
                      ? 'bg-indigo-50 lg:bg-transparent lg:border-indigo-600 text-indigo-600'
                      : 'lg:border-transparent text-gray-500 hover:bg-gray-50 lg:hover:bg-transparent hover:text-gray-900'
                  }`}
                >
                  <sub.icon size={16} className="lg:w-3.5 lg:h-3.5" />
                  {sub.name}
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    );
  };

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
          
          {/* Nav Links */}
          <div className="flex items-center gap-1 md:gap-2">
            {filteredModules.map((item) => {
              const isActive = item.path === '/inventory' 
                ? (location.pathname === '/inventory' || (location.pathname.startsWith('/inventory') && !location.pathname.startsWith('/inventory/orders')))
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-y-[-1px]'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon size={18} className="w-[18px] h-[18px]" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Link>
              );
            })}
          </div>
          
        </div>
      </nav>

      {/* Secondary Sub-Navbar (Only for Jobs) */}
      {isJobsActive && role === ROLES.JOB_MANAGER && renderSubNav(jobsSubLinks, '/jobs')}

      {/* Secondary Sub-Navbar (Only for Inventory) */}
      {isInventoryActive && renderSubNav(inventorySubLinks, '/inventory')}

      {/* Secondary Sub-Navbar (Only for Orders) */}
      {isOrdersActive && renderSubNav(orderSubLinks, '/orders')}

    </div>
  );
};

export default UnifiedNavbar;
