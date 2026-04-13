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
const TopHeader = ({ title, subtitle, extraActions }) => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 w-full">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-400 font-medium text-sm">{subtitle}</p>}
      </div>
      
      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        {extraActions}
        
        {/* User badge */}
        <div className="flex items-center gap-3 bg-white border border-slate-100 pl-2 pr-5 py-2 rounded-2xl shadow-sm">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <User size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Logged in as</span>
            <span className="text-sm font-extrabold text-slate-700 leading-tight">{userName}</span>
          </div>
        </div>

        {/* Logout button */}
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default TopHeader;
