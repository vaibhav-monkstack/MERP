import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';

const UserIdentityHeader = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const userName = localStorage.getItem('userName') || 'User';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-4">
      {/* User Identity Card */}
      <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
          <User size={22} className="text-indigo-600" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="text-[10px] text-gray-400 font-black tracking-widest uppercase leading-tight">
            Logged in as
          </div>
          <div className="text-sm font-black text-slate-800 leading-tight">
            {role === 'Order Manager' ? 'Workshop Manager' : userName}
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-extrabold transition-all shadow-md group"
      >
        <LogOut size={16} className="text-slate-400 group-hover:text-white transition-colors" />
        Logout
      </button>
    </div>
  );
};

export default UserIdentityHeader;
