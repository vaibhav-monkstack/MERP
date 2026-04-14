// Import React hooks for component state and lifecycle
import React, { useState, useEffect } from 'react';
// Import navigation hook for page redirects
import { useNavigate } from 'react-router-dom';
// Import axios for making HTTP API requests to the backend
import axios from 'axios';
// Import icons from lucide-react for UI elements
import {
  ChevronLeft,   // Back button chevron
  Users,         // Teams icon
  Plus,          // Add/create icon
  Trash2,        // Delete icon
  UserPlus,      // Add member icon
  UserMinus,     // Remove member icon
  Edit2,         // Edit icon
  X,             // Close/cancel icon
  Check,         // Confirm icon
  Shield,        // Assignments icon
  Mail,          // Email icon
  User,          // Single user icon
  Search         // Search icon
} from 'lucide-react';

// Base URL for all API requests (backend server)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ============================================================
// MANAGE TEAMS PAGE — Team and worker management for Job Managers
// Features:
// - Create, rename, and delete teams
// - Add and remove team members
// - Create new Production Staff accounts
// - Search and filter teams/members
// ============================================================

const ManageTeams = () => {
  const navigate = useNavigate();                // Hook for page navigation
  const token = localStorage.getItem('token');    // JWT auth token from localStorage
  const role = localStorage.getItem('role');      // User role (should be "Job Manager")

  // === APPLICATION STATE ===
  const [teams, setTeams] = useState([]);          // Array of all teams (each with members array)
  const [workers, setWorkers] = useState([]);      // Array of all Production Staff users
  const [loading, setLoading] = useState(true);    // Loading indicator while fetching data

  // Create Team modal state
  const [showCreateTeam, setShowCreateTeam] = useState(false);   // Toggle modal visibility
  const [newTeamName, setNewTeamName] = useState('');             // New team name input

  // Create Worker modal state
  const [showCreateWorker, setShowCreateWorker] = useState(false);                   // Toggle modal visibility
  const [newWorker, setNewWorker] = useState({ name: '', email: '', password: '' }); // New worker form data

  // Add Member modal state
  const [showAddMember, setShowAddMember] = useState(false);   // Toggle modal visibility
  const [addMemberTeamId, setAddMemberTeamId] = useState(null); // Which team to add a member to

  // Edit Team inline editing state
  const [editingTeam, setEditingTeam] = useState(null);  // ID of the team being edited (null = none)
  const [editTeamName, setEditTeamName] = useState('');   // New name for the team being edited

  // Toast feedback notification state
  const [feedback, setFeedback] = useState({ message: '', type: '' }); // {message, type: 'success'|'error'}

  // Search/filter state
  const [searchTerm, setSearchTerm] = useState('');  // Search input for filtering teams/members

  // === AUTH CHECK — Redirect to login if not authenticated as Job Manager ===
  useEffect(() => {
    if (!token || role !== 'Job Manager') {
      navigate('/login');
      return;
    }
    fetchAll(); // Fetch teams and workers data on initial load
  }, [token, role, navigate]);

  // === FETCH ALL DATA — Load teams (with members) and all workers from the backend ===
  const fetchAll = async () => {
    try {
      // Fetch both endpoints simultaneously for better performance
      const [teamRes, workerRes] = await Promise.all([
        axios.get(`${API_BASE}/teams`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/teams/workers`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setTeams(teamRes.data);    // Store teams data
      setWorkers(workerRes.data); // Store workers data
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false); // Mark loading as complete
    }
  };

  // Show a temporary toast notification (auto-dismisses after 3 seconds)
  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback({ message: '', type: '' }), 3000);
  };

  // === TEAM CRUD OPERATIONS ===

  // CREATE TEAM — Creates a new team via the API
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    try {
      await axios.post(`${API_BASE}/teams`, { name: newTeamName },
        { headers: { Authorization: `Bearer ${token}` } });
      setNewTeamName('');
      setShowCreateTeam(false);
      showFeedback(`Team "${newTeamName}" created successfully!`);
      fetchAll();
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Error creating team', 'error');
    }
  };

  const handleUpdateTeam = async () => {
    if (!editTeamName.trim() || !editingTeam) return;
    try {
      await axios.put(`${API_BASE}/teams/${editingTeam}`, { name: editTeamName },
        { headers: { Authorization: `Bearer ${token}` } });
      setEditingTeam(null);
      setEditTeamName('');
      showFeedback('Team name updated!');
      fetchAll();
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Error updating team', 'error');
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    try {
      await axios.delete(`${API_BASE}/teams/${teamId}`,
        { headers: { Authorization: `Bearer ${token}` } });
      showFeedback(`Team "${teamName}" deleted.`);
      fetchAll();
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Error deleting team', 'error');
    }
  };

  // === Member Operations ===
  const handleAddMember = async (userId) => {
    try {
      await axios.post(`${API_BASE}/teams/${addMemberTeamId}/members`, { userId },
        { headers: { Authorization: `Bearer ${token}` } });
      showFeedback('Member added successfully!');
      fetchAll();                       // Refresh to show updated member list
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Error adding member', 'error');
    }
  };

  // REMOVE MEMBER — Removes a worker from a team (does NOT delete the worker account)
  const handleRemoveMember = async (teamId, userId, name) => {
    try {
      await axios.delete(`${API_BASE}/teams/${teamId}/members/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } });
      showFeedback(`${name} removed from team.`);
      fetchAll();                       // Refresh to show updated member list
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Error removing member', 'error');
    }
  };

  // === WORKER OPERATIONS ===

  // CREATE WORKER — Creates a new Production Staff user account
  const handleCreateWorker = async () => {
    if (!newWorker.name.trim() || !newWorker.email.trim() || !newWorker.password.trim()) return;
    try {
      await axios.post(`${API_BASE}/teams/workers`, newWorker,
        { headers: { Authorization: `Bearer ${token}` } });
      setNewWorker({ name: '', email: '', password: '' });
      setShowCreateWorker(false);
      showFeedback(`Worker "${newWorker.name}" created successfully!`);
      fetchAll();
    } catch (error) {
      showFeedback(error.response?.data?.message || 'Error creating worker', 'error');
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  };

  // Get available workers for a team (not already members)
  const getAvailableWorkers = (teamId) => {
    const team = teams.find(t => t.id === teamId);
    if (!team) return workers;
    const memberIds = team.members.map(m => m.id);
    return workers.filter(w => !memberIds.includes(w.id));
  };

  const filteredTeams = teams.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.members.some(m => m.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading team data...</p>
      </div>
    );
  }

  return (
    <div style={styles.pageBackground}>
      {/* Feedback Toast */}
      {feedback.message && (
        <div style={{
          ...styles.feedbackToast,
          backgroundColor: feedback.type === 'error' ? '#fef2f2' : '#f0fdf4',
          borderColor: feedback.type === 'error' ? '#fca5a5' : '#86efac',
          color: feedback.type === 'error' ? '#991b1b' : '#166534'
        }}>
          {feedback.type === 'error' ? '❌' : '✅'} {feedback.message}
        </div>
      )}

      {/* Back Link */}
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/jobs')}
          style={styles.backBtn}
        >
          <ChevronLeft size={18} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      {/* Header */}
      <header style={styles.header} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-8">
        <div>
          <h1 style={styles.headerTitle}>Manage Teams</h1>
          <p style={styles.headerSubtitle}>Create teams, assign workers, and manage production staff</p>
        </div>
        <div style={styles.headerActions} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button style={styles.createWorkerBtn} onClick={() => setShowCreateWorker(true)}>
            <UserPlus size={18} />
            <span>New Worker Account</span>
          </button>
          <button style={styles.createTeamBtn} onClick={() => setShowCreateTeam(true)}>
            <Plus size={18} />
            <span>New Team</span>
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div style={styles.statsRow} className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div style={styles.miniStat}>
          <div style={{ ...styles.miniStatIcon, backgroundColor: '#eef2ff' }}>
            <Users size={20} color="#6366f1" />
          </div>
          <div>
            <div style={styles.miniStatNumber}>{teams.length}</div>
            <div style={styles.miniStatLabel}>Teams</div>
          </div>
        </div>
        <div style={styles.miniStat}>
          <div style={{ ...styles.miniStatIcon, backgroundColor: '#f0fdf4' }}>
            <User size={20} color="#22c55e" />
          </div>
          <div>
            <div style={styles.miniStatNumber}>{workers.length}</div>
            <div style={styles.miniStatLabel}>Workers</div>
          </div>
        </div>
        <div style={styles.miniStat}>
          <div style={{ ...styles.miniStatIcon, backgroundColor: '#eff6ff' }}>
            <Shield size={20} color="#3b82f6" />
          </div>
          <div>
            <div style={styles.miniStatNumber}>
              {teams.reduce((acc, t) => acc + t.members.length, 0)}
            </div>
            <div style={styles.miniStatLabel}>Assignments</div>
          </div>
        </div>
      </div>

      {/* Search Wrapper */}
      <div style={styles.searchWrapper} className="w-full md:w-auto">
        <Search size={20} color="#9ca3af" style={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search teams or members..." 
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Teams Grid */}
      <div style={styles.teamsGrid} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {filteredTeams.map((team) => (
          <div key={team.id} style={styles.teamCard}>
            <div style={styles.teamCardHeader}>
              <div style={styles.teamNameRow}>
                {editingTeam === team.id ? (
                  <div style={styles.editNameRow}>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      style={styles.editInput}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateTeam()}
                    />
                    <button style={styles.iconBtnGreen} onClick={handleUpdateTeam}>
                      <Check size={16} />
                    </button>
                    <button style={styles.iconBtnGray} onClick={() => setEditingTeam(null)}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 style={styles.teamName}>{team.name}</h3>
                    <div style={styles.teamActions}>
                      <button style={styles.iconBtnGray} title="Edit" onClick={() => {
                        setEditingTeam(team.id);
                        setEditTeamName(team.name);
                      }}>
                        <Edit2 size={14} />
                      </button>
                      <button style={styles.iconBtnRed} title="Delete" onClick={() => handleDeleteTeam(team.id, team.name)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
              <span style={styles.memberCountBadge}>{team.members.length} members</span>
            </div>

            <div style={styles.membersList}>
              {team.members.length === 0 ? (
                <p style={styles.noMembers}>No members yet. Add workers below.</p>
              ) : (
                team.members.map((member) => (
                  <div key={member.id} style={styles.memberRow}>
                    <div style={styles.memberInfo}>
                      <div style={styles.memberAvatar}>
                        {getInitials(member.name)}
                      </div>
                      <div>
                        <div style={styles.memberName}>{member.name || member.email}</div>
                        <div style={styles.memberEmail}>{member.email}</div>
                      </div>
                    </div>
                    <button
                      style={styles.removeMemberBtn}
                      onClick={() => handleRemoveMember(team.id, member.id, member.name || member.email)}
                      title="Remove from team"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              style={styles.addMemberBtn}
              onClick={() => {
                setAddMemberTeamId(team.id);
                setShowAddMember(true);
              }}
            >
              <UserPlus size={16} />
              <span>Add Member</span>
            </button>
          </div>
        ))}
      </div>

      {/* Workers List Section */}
      <div style={styles.workersSection}>
        <div style={styles.workersSectionHeader} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 style={styles.sectionTitle}>All Production Staff</h2>
          <span style={styles.workerCountBadge}>{workers.length} Workers</span>
        </div>
        <div style={styles.workersGrid} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {workers.map((worker) => (
            <div key={worker.id} style={styles.workerCard}>
              <div style={styles.workerAvatar}>
                {getInitials(worker.name)}
              </div>
              <div style={styles.workerDetails}>
                <div style={styles.workerName}>{worker.name || 'Unnamed'}</div>
                <div style={styles.workerEmail}>{worker.email}</div>
              </div>
              <div style={styles.workerTeams}>
                {teams.filter(t => t.members.some(m => m.id === worker.id)).map(t => (
                  <span key={t.id} style={styles.teamTagSmall}>{t.name}</span>
                ))}
                {teams.filter(t => t.members.some(m => m.id === worker.id)).length === 0 && (
                  <span style={styles.unassignedTag}>Unassigned</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === MODALS === */}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateTeam(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create New Team</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowCreateTeam(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <label style={styles.modalLabel}>Team Name</label>
              <input
                type="text"
                placeholder="e.g. Team Epsilon"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                style={styles.modalInput}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
              />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowCreateTeam(false)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleCreateTeam}>Create Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Worker Modal */}
      {showCreateWorker && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateWorker(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create Worker Account</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowCreateWorker(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <label style={styles.modalLabel}>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Kumar"
                value={newWorker.name}
                onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                style={styles.modalInput}
                autoFocus
              />
              <label style={styles.modalLabel}>Email Address</label>
              <input
                type="email"
                placeholder="e.g. alex@factory.com"
                value={newWorker.email}
                onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                style={styles.modalInput}
              />
              <label style={styles.modalLabel}>Password</label>
              <input
                type="password"
                placeholder="At least 6 characters"
                value={newWorker.password}
                onChange={(e) => setNewWorker({ ...newWorker, password: e.target.value })}
                style={styles.modalInput}
              />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowCreateWorker(false)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleCreateWorker}>Create Worker</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div style={styles.modalOverlay} onClick={() => setShowAddMember(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Member to Team</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowAddMember(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              {getAvailableWorkers(addMemberTeamId).length === 0 ? (
                <p style={styles.noWorkersText}>All workers are already assigned to this team.</p>
              ) : (
                <div style={styles.availableWorkersList}>
                  {getAvailableWorkers(addMemberTeamId).map((worker) => (
                    <div key={worker.id} style={styles.availableWorkerRow}>
                      <div style={styles.memberInfo}>
                        <div style={styles.memberAvatar}>{getInitials(worker.name)}</div>
                        <div>
                          <div style={styles.memberName}>{worker.name}</div>
                          <div style={styles.memberEmail}>{worker.email}</div>
                        </div>
                      </div>
                      <button
                        style={styles.addBtn}
                        onClick={() => handleAddMember(worker.id)}
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowAddMember(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f6fa',
    gap: '16px'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTopColor: '#6366f1',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  loadingText: {
    color: '#6b7280',
    fontSize: '16px',
    fontWeight: '500'
  },
  pageBackground: {
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
    padding: '32px',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    position: 'relative'
  },
  feedbackToast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    padding: '14px 24px',
    borderRadius: '12px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: 1000,
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    animation: 'slideIn 0.3s ease-out'
  },
  headerRow: {
    marginBottom: '20px'
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#6b7280',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.02em'
  },
  headerSubtitle: {
    fontSize: '15px',
    color: '#6b7280',
    marginTop: '4px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px'
  },
  createWorkerBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  createTeamBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  statsRow: {
    display: 'grid',
    gap: '20px',
    marginBottom: '28px'
  },
  miniStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: 'white',
    borderRadius: '14px',
    padding: '18px 24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    flex: 1
  },
  miniStatIcon: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  miniStatNumber: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#111827'
  },
  miniStatLabel: {
    fontSize: '12px',
    color: '#9ca3af',
    fontWeight: '500'
  },
  searchWrapper: {
    position: 'relative',
    maxWidth: '480px',
    marginBottom: '28px'
  },
  searchIcon: {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)'
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 44px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: 'white',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  teamsGrid: {
    display: 'grid',
    gap: '24px',
    marginBottom: '40px'
  },
  teamCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column'
  },
  teamCardHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  teamNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1
  },
  teamName: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  teamActions: {
    display: 'flex',
    gap: '6px'
  },
  editNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1
  },
  editInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #6366f1',
    fontSize: '14px',
    outline: 'none',
    flex: 1
  },
  memberCountBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#eef2ff',
    padding: '4px 12px',
    borderRadius: '20px'
  },
  membersList: {
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    minHeight: '60px'
  },
  noMembers: {
    color: '#9ca3af',
    fontSize: '13px',
    textAlign: 'center',
    padding: '12px 0',
    margin: 0
  },
  memberRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#fafbfc',
    borderRadius: '10px',
    transition: 'background-color 0.2s'
  },
  memberInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  memberAvatar: {
    width: '34px',
    height: '34px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: '700',
    flexShrink: 0
  },
  memberName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827'
  },
  memberEmail: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  removeMemberBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  addMemberBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    margin: '0 24px 20px 24px',
    padding: '10px',
    borderRadius: '10px',
    border: '2px dashed #d1d5db',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  iconBtnGray: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    color: '#6b7280',
    cursor: 'pointer'
  },
  iconBtnGreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    cursor: 'pointer'
  },
  iconBtnRed: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '30px',
    height: '30px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    cursor: 'pointer'
  },

  // Workers Section
  workersSection: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 6px -1px rgba(0,0,0,0.05)'
  },
  workersSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  workerCountBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#22c55e',
    backgroundColor: '#f0fdf4',
    padding: '4px 12px',
    borderRadius: '20px'
  },
  workersGrid: {
    display: 'grid',
    gap: '14px'
  },
  workerCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '14px 18px',
    borderRadius: '12px',
    backgroundColor: '#fafbfc',
    border: '1px solid #f3f4f6'
  },
  workerAvatar: {
    width: '40px',
    height: '40px',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '13px',
    fontWeight: '700',
    flexShrink: 0
  },
  workerDetails: {
    flex: 1,
    minWidth: 0
  },
  workerName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827'
  },
  workerEmail: {
    fontSize: '12px',
    color: '#9ca3af',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  workerTeams: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap'
  },
  teamTagSmall: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#eef2ff',
    padding: '2px 8px',
    borderRadius: '12px'
  },
  unassignedTag: {
    fontSize: '10px',
    fontWeight: '600',
    color: '#9ca3af',
    backgroundColor: '#f3f4f6',
    padding: '2px 8px',
    borderRadius: '12px'
  },

  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    backdropFilter: 'blur(4px)'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '20px',
    width: '90%',
    maxWidth: '480px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 24px 0 24px'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
    margin: 0
  },
  modalCloseBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer'
  },
  modalBody: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  modalLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151'
  },
  modalInput: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px 24px 24px'
  },
  cancelBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    backgroundColor: 'white',
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '10px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  noWorkersText: {
    color: '#9ca3af',
    fontSize: '14px',
    textAlign: 'center',
    padding: '12px 0'
  },
  availableWorkersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  availableWorkerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    backgroundColor: '#fafbfc',
    borderRadius: '10px',
    border: '1px solid #f3f4f6'
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: 'white',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default ManageTeams;
