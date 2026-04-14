import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * TopHeader Component
 * A consistent header section for all dashboards showing the logged-in user and logout option.
 * Standardized on the Job Management "Master Theme".
 * 
 * @param {string} title - The main title of the page
 * @param {string} subtitle - The subtitle/description
 * @param {React.ReactNode} extraActions - Optional buttons to show before the user badge
 */
import { ROLES } from '../utils/constants';

const TopHeader = ({ title, subtitle, extraActions }) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    if (toast && toast.success) toast.success('Logged out successfully');
  };

  return (
    <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 w-full border-b border-gray-100 pb-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 font-semibold text-xs sm:text-base">{subtitle}</p>}
      </div>
      
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
        {extraActions && (
          <div className="flex items-center gap-3">
            {extraActions}
          </div>
        )}
        
        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
          {/* User Identity Card - Styled to match image */}
          <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <User size={22} className="text-indigo-600 font-bold" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight mb-0.5">
                Logged in as
              </div>
              <div className="text-sm font-black text-slate-800 leading-tight">
                {role === ROLES.ORDER_MANAGER ? 'Workshop Manager' : userName}
              </div>
            </div>
          </div>

          {/* Logout Button - Dark rounded pill */}
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-700 text-white px-6 py-3 rounded-2xl text-sm font-black shadow-lg hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut size={18} className="text-slate-400" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Exit</span>
          </button>
        </div>
      </div>
    </header>
  );
};


export default TopHeader;
