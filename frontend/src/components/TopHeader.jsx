import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * TopHeader Component
 * A consistent header section for all dashboards showing the logged-in user and logout option.
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
    <header style={styles.header} className="header-responsive">
      <div>
        <h1 style={styles.headerTitle}>{title}</h1>
        {subtitle && <p style={styles.headerSubtitle}>{subtitle}</p>}
      </div>
      
      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
        {extraActions}
        
        {/* User badge showing the logged-in user's avatar and name */}
        <div style={styles.userBadge}>
          <div style={styles.avatar}>
            <User size={18} color="#2563eb" />
          </div>
          <span style={styles.userName}>{userName}</span>
        </div>

        {/* Logout button */}
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    width: '100%',
    flexWrap: 'wrap',
    gap: '20px'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#111827',
    margin: 0
  },
  headerSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px'
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: 'white',
    padding: '6px 16px 6px 6px',
    borderRadius: '50px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  avatar: {
    width: '32px',
    height: '32px',
    backgroundColor: '#eff6ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    whiteSpace: 'nowrap'
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b5563',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default TopHeader;
