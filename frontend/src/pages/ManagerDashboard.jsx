// Import React hooks for state management and side effects
import React, { useState, useEffect } from 'react';
// Import navigation hook for page redirects
import { useNavigate } from 'react-router-dom';
// Import the shared job context to access job data and operations
import { useJobs } from '../context/JobContext';
// Import icons from lucide-react for UI elements
import { 
  Briefcase,     // Total jobs stat icon
  Clock,         // In-progress stat icon
  CheckCircle,   // Completed stat icon
  AlertCircle,   // Overdue stat icon
  Search,        // Search bar icon
  Plus,          // Create new job button icon
  Eye,           // View job action icon
  BarChart2,     // Worker tasks action icon
  Edit2,         // Edit job action icon
  Trash2,        // Delete job action icon
  Users          // Manage teams button icon
} from 'lucide-react';
import TopHeader from '../components/TopHeader';

// ============================================================
// MANAGER DASHBOARD — Main control panel for Job Managers
// Shows all manufacturing jobs in a filterable, searchable table
// with status stats, action buttons, and navigation to other pages.
// ============================================================

// Import toast for notifications
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
  // Get jobs data and operations from the shared context
  const { jobs, deleteJob, loading } = useJobs();
  // Local state for the filtered/searched list of jobs shown in the table
  const [filteredJobs, setFilteredJobs] = useState([]);
  // Search input text (filters by product name or team name)
  const [searchTerm, setSearchTerm] = useState('');
  // Dropdown filter for job status (e.g., "Production", "Completed", "Rework")
  const [statusFilter, setStatusFilter] = useState('All Status');
  // Dropdown filter for job priority (e.g., "High", "Urgent")
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  
  const navigate = useNavigate();
  // Get the logged-in user's role and token from localStorage
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  // Redirect to login if the user is not authenticated or not a Job Manager
  useEffect(() => {
    if (!token || role !== 'Job Manager') {
      navigate('/login');
    }
  }, [token, role, navigate]);

  // Handle deletion with confirmation
  const handleDeleteJob = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job permanently? This action cannot be undone.')) {
      try {
        await deleteJob(jobId);
        toast.success('Job deleted successfully');
      } catch (error) {
        toast.error('Failed to delete job');
      }
    }
  };

  // Sorting handler
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter and sort jobs whenever necessary
  useEffect(() => {
    let result = [...jobs]; // Create a copy

    // Apply text search filter — matches product name or team name or Job ID
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.product.toLowerCase().includes(lowerSearch) ||
        job.team.toLowerCase().includes(lowerSearch) ||
        job.id.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply status dropdown filter
    if (statusFilter !== 'All Status') {
      result = result.filter(job => job.status === statusFilter);
    }

    // Apply priority dropdown filter
    if (priorityFilter !== 'All Priorities') {
      result = result.filter(job => job.priority === priorityFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      // Handle numeric/date sorting
      if (sortConfig.key === 'progress' || sortConfig.key === 'quantity') {
        valA = Number(valA);
        valB = Number(valB);
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredJobs(result); // Update the displayed jobs
  }, [searchTerm, statusFilter, priorityFilter, jobs, sortConfig]);

  // Handle logout — clear all stored data and redirect to login
  const handleLogout = () => {
    localStorage.clear();     // Remove token, role, userId, userName
    navigate('/login');        // Redirect to login page
    toast.success('Logged out successfully');
  };

  // Returns color scheme (background + text) for a given job status
  // Used for the colored status badges in the job table
  const getStatusColor = (status) => {
    switch (status) {
      case 'Production': return { bg: '#dbeafe', text: '#1e40af' };  // Blue
      case 'Assembly': return { bg: '#f3e8ff', text: '#6b21a8' };    // Purple
      case 'Created': return { bg: '#f3f4f6', text: '#374151' };     // Gray
      case 'QC': return { bg: '#fef9c3', text: '#854d0e' };          // Yellow
      case 'Completed': return { bg: '#dcfce7', text: '#166534' };   // Green
      case 'Rework': return { bg: '#fee2e2', text: '#991b1b' };      // Red
      default: return { bg: '#f3f4f6', text: '#374151' };            // Default gray
    }
  };

  // Returns color scheme for a given priority level
  // Used for the colored priority badges in the job table
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return { bg: '#fee2e2', text: '#991b1b' };  // Red
      case 'High': return { bg: '#1f2937', text: '#ffffff' };    // Dark (high contrast)
      case 'Medium': return { bg: '#f3f4f6', text: '#4b5563' };  // Gray
      case 'Low': return { bg: '#eff6ff', text: '#3b82f6' };     // Light blue
      default: return { bg: '#f3f4f6', text: '#4b5563' };        // Default gray
    }
  };

  // Show loading state while jobs are being fetched from the backend
  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  // === RENDER — Manager Dashboard UI ===
  return (
    <div style={styles.pageBackground} className="container-custom">
      {/* === HEADER — Title, user info, and navigation buttons === */}
      <TopHeader 
        title="Job Management Dashboard" 
        subtitle="Manage and track all manufacturing jobs"
        extraActions={
          <button onClick={() => navigate('/manage-teams')} style={styles.manageTeamsBtn}>
            <Users size={18} />
            <span>Manage Teams</span>
          </button>
        }
      />

      {/* === STATS ROW — Four cards showing job counts === */}
      <div className="stat-grid mb-8">
        {/* Total jobs count */}
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}><span style={styles.statTitle}>Total Jobs</span><Briefcase size={20} color="#6b7280" /></div>
          <div style={styles.statNumber}>{jobs.length}</div>
          <div style={styles.statDesc}>All jobs in system</div>
        </div>
        {/* In-progress jobs count (not created and not completed) */}
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}><span style={styles.statTitle}>In Progress</span><Clock size={20} color="#2563eb" /></div>
          <div style={styles.statNumber}>{jobs.filter(j => j.status !== 'Completed' && j.status !== 'Created').length}</div>
          <div style={styles.statDesc}>Currently active</div>
        </div>
        {/* Completed jobs count */}
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}><span style={styles.statTitle}>Completed</span><CheckCircle size={20} color="#166534" /></div>
          <div style={styles.statNumber}>{jobs.filter(j => j.status === 'Completed').length}</div>
          <div style={styles.statDesc}>Finished jobs</div>
        </div>
        {/* Overdue jobs count — calculated based on deadline and status */}
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}><span style={styles.statTitle}>Overdue</span><AlertCircle size={20} color="#991b1b" /></div>
          <div style={styles.statNumber}>
            {jobs.filter(j => {
              if (!j.deadline || j.status === 'Completed') return false;
              const deadlineDate = new Date(j.deadline);
              deadlineDate.setHours(23, 59, 59, 999);
              return new Date() > deadlineDate;
            }).length}
          </div>
          <div style={styles.statDesc}>Past deadline</div>
        </div>
      </div>

      {/* === JOB LIST TABLE — Main content area === */}
      <div style={styles.mainCard}>
        <div style={styles.mainCardHeader}>
          <h2 style={styles.mainCardTitle}>Job List</h2>
          {/* Controls: search bar, status/priority filters, and create button */}
          <div className="controls-responsive">
            {/* Search bar with magnifying glass icon */}
            <div className="relative flex-1 min-w-0 md:max-w-md">
              <Search size={18} style={styles.searchIcon} color="#9ca3af" />
              <input 
                type="text" 
                placeholder="Search by product or team..." 
                style={styles.searchInput}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Status filter dropdown — includes all possible statuses plus "Rework" */}
              <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option>All Status</option>
                <option>Production</option>
                <option>Assembly</option>
                <option>Created</option>
                <option>QC</option>
                <option>Rework</option>
                <option>Completed</option>
              </select>
              {/* Priority filter dropdown */}
              <select style={styles.select} value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                <option>All Priorities</option>
                <option>Urgent</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
              {/* Create New Job button — navigates to the job creation form */}
              <button style={styles.createBtn} onClick={() => navigate('/create-job')}>
                <Plus size={18} />
                <span>Create New Job</span>
              </button>
            </div>
          </div>
        </div>

        {/* === JOB TABLE — Sortable table of all filtered jobs === */}
        <div className="table-container">
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('id')}>
                  Job ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('product')}>
                  Product {sortConfig.key === 'product' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('quantity')}>
                  Qty {sortConfig.key === 'quantity' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('team')}>
                  Team {sortConfig.key === 'team' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('status')}>
                  Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('priority')}>
                  Priority {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('progress')}>
                  Progress {sortConfig.key === 'progress' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ ...styles.th, cursor: 'pointer' }} onClick={() => handleSort('deadline')}>
                  Deadline {sortConfig.key === 'deadline' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Render each filtered job as a table row */}
              {filteredJobs.map((job) => (
                <tr key={job.id} style={styles.tr} onClick={() => navigate(`/job/${job.id}`)}>
                  <td style={styles.td}>{job.id}</td>
                  <td style={styles.tdBold}>{job.product}</td>
                  <td style={styles.td}>{job.quantity}</td>
                  <td style={styles.td}>{job.team}</td>
                  {/* Status badge with dynamic color */}
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: getStatusColor(job.status).bg, color: getStatusColor(job.status).text }}>
                      {job.status}
                    </span>
                  </td>
                  {/* Priority badge with dynamic color */}
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, backgroundColor: getPriorityColor(job.priority).bg, color: getPriorityColor(job.priority).text }}>
                      {job.priority}
                    </span>
                  </td>
                  {/* Progress bar with percentage text */}
                  <td style={styles.td}>
                    <div style={styles.progressContainer}>
                      <span style={styles.progressText}>{job.progress}%</span>
                      <div style={styles.progressBarBg}><div style={{ ...styles.progressBarFill, width: `${job.progress}%` }}></div></div>
                    </div>
                  </td>
                  <td style={styles.td}>{job.deadline}</td>
                  {/* Action buttons — stop row click propagation so buttons work independently */}
                  <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                    <div style={styles.actionButtons}>
                      {/* View job details */}
                      <button style={styles.actionBtn} title="View" onClick={() => navigate(`/job/${job.id}`)}><Eye size={16} color="#4b5563" /></button>
                      {/* View worker tasks for this job */}
                      <button style={styles.actionBtn} title="Worker Tasks" onClick={() => navigate(`/job/${job.id}/tasks`)}><BarChart2 size={16} color="#4b5563" /></button>
                      {/* Edit job details */}
                      <button style={styles.actionBtn} title="Edit" onClick={() => navigate(`/jobs/${job.id}/edit`)}><Edit2 size={16} color="#4b5563" /></button>
                      {/* Delete job permanently */}
                      <button style={styles.actionBtn} title="Delete" onClick={() => handleDeleteJob(job.id)}><Trash2 size={16} color="#ef4444" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// STYLES — CSS-in-JS style definitions for the Manager Dashboard
// ============================================================
const styles = {
  pageBackground: { minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: "'Inter', sans-serif" },
  manageTeamsBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  statCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  statCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  statTitle: { fontSize: '14px', fontWeight: '600', color: '#6b7280' },
  statNumber: { fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '4px' },
  statDesc: { fontSize: '12px', color: '#9ca3af' },
  mainCard: { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
  mainCardHeader: { padding: '24px', borderBottom: '1px solid #f3f4f6' },
  mainCardTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', marginBottom: '20px' },
  createBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px 24px', backgroundColor: '#f9fafb', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6' },
  tr: { transition: 'background-color 0.2s', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' },
  td: { padding: '16px 24px', fontSize: '14px', color: '#4b5563', verticalAlign: 'middle' },
  tdBold: { padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#111827', verticalAlign: 'middle' },
  badge: { padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
  progressContainer: { display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' },
  progressText: { fontSize: '12px', fontWeight: '600', color: '#374151' },
  progressBarBg: { width: '100%', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#2563eb', borderRadius: '3px' },
  actionButtons: { display: 'flex', gap: '8px' },
  actionBtn: { padding: '6px', borderRadius: '6px', border: '1px solid #e5e7eb', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};

// Export the ManagerDashboard component as default
export default ManagerDashboard;
