// Import React hooks for state management and lifecycle
import React, { useState, useEffect } from 'react';
// Import navigation and URL parameter hooks
import { useNavigate, useParams } from 'react-router-dom';
// Import the shared job context for job data
import { useJobs } from '../../context/JobContext';
// Import axios for making HTTP API requests
import axios from 'axios';
// Import icons used in the task panel UI
import {
  LogOut,         // Logout button
  Clock,          // Time/duration icon
  CheckCircle,    // Completed icon
  ClipboardList,  // Task list icon
  Play,           // Start button icon
  Check,          // Complete button icon
  User,           // Worker avatar icon
  Info,           // Info icon
  ChevronLeft,    // Back button
  Users,          // Team icon
  Layout,         // Dashboard icon
  Calendar,       // Deadline icon
  Plus,           // Add task button
  X               // Close modal button
} from 'lucide-react';

// Base URL for all API requests (uses environment variable if available)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ============================================================
// WORKER TASK PANEL — Detailed task management view for a specific job
// Shows all tasks assigned to workers for a job, with stats,
// filtering by worker, and the ability to assign new tasks.
// Both Managers and Workers can view this; Managers can also create tasks.
// ============================================================

const WorkerTaskPanel = () => {
  const { id } = useParams();    // Job ID from the URL (optional — if absent, shows all tasks)
  const navigate = useNavigate(); // Hook for page navigation
  const { jobs } = useJobs();     // Get all jobs from context
  const role = localStorage.getItem('role');   // User role
  const token = localStorage.getItem('token'); // JWT auth token

  // Find the specific job, or use a generic placeholder if viewing all tasks
  const currentJob = jobs.find(j => j.id === id) || { product: 'All Jobs', team: '' };

  // Component state
  const [tasks, setTasks] = useState([]);                // Array of tasks for this job
  const [workerFilter, setWorkerFilter] = useState('All Workers'); // Filter dropdown value
  const [teamWorkers, setTeamWorkers] = useState([]);    // Names of workers in the job's team

  // Assign Task modal state
  const [showAssignTask, setShowAssignTask] = useState(false);   // Toggle modal visibility
  const [newTask, setNewTask] = useState({ partName: '', worker: '', deadline: '' }); // New task form data
  const [allWorkers, setAllWorkers] = useState([]);              // All available workers

  // Auth check and initial data fetch on mount
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchTasks();   // Load tasks for this job
    fetchWorkers(); // Load available workers
  }, [id, navigate, token]);

  // Fetch tasks from the backend (filtered by job ID if one is provided)
  const fetchTasks = async () => {
    try {
      // Build URL: if we have a job ID, filter tasks for that job; otherwise get all tasks
      const url = id
        ? `${API_BASE}/tasks?jobId=${id}`
        : `${API_BASE}/tasks`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(response.data); // Store the fetched tasks
    } catch (error) {
      console.error('Error fetching tasks', error);
    }
  };

  // Fetch workers available for task assignment
  // Prioritizes team members for the job's team, falls back to all workers
  const fetchWorkers = async () => {
    try {
      // If viewing a specific job with an assigned team, get that team's members
      if (id && currentJob.team) {
        const teamRes = await axios.get(`${API_BASE}/teams`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Find the team matching this job's assigned team
        const jobTeam = teamRes.data.find(t => t.name === currentJob.team);
        if (jobTeam && jobTeam.members.length > 0) {
          // Use team members as the worker list
          setTeamWorkers(jobTeam.members.map(m => m.name));
        } else {
          // Fallback: if team has no members, show all workers
          const workerRes = await axios.get(`${API_BASE}/teams/workers`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTeamWorkers(workerRes.data.map(w => w.name));
        }
      } else {
        // No specific job — show all workers
        const workerRes = await axios.get(`${API_BASE}/teams/workers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTeamWorkers(workerRes.data.map(w => w.name));
      }

      // Also fetch all workers for the assign task dropdown
      const workerRes = await axios.get(`${API_BASE}/teams/workers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllWorkers(workerRes.data);
    } catch (error) {
      console.error('Error fetching workers', error);
    }
  };

  // Handle logout — clear stored data and redirect to login
  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Handle task status change (Pending → In Progress → Completed)
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Send PUT request to update the task status
      const response = await axios.put(`${API_BASE}/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedTask = response.data.task;
      // Update the task in local state immediately
      setTasks(prev => prev.map(task =>
        task.taskId === taskId ? { ...task, ...updatedTask } : task
      ));
    } catch (error) {
      console.error('Error updating task status', error);
    }
  };

  // Handle assigning a new task to a worker (Manager only)
  const handleAssignTask = async () => {
    if (!newTask.partName || !newTask.worker) return; // Validate required fields

    try {
      // Send POST request to create the new task
      const response = await axios.post(`${API_BASE}/tasks`, {
        jobId: id,                          // Parent job ID
        partName: newTask.partName,          // Task name
        worker: newTask.worker,              // Assigned worker name
        deadline: newTask.deadline || null   // Optional deadline
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Add the new task to local state
      setTasks(prev => [...prev, response.data]);
      setNewTask({ partName: '', worker: '', deadline: '' }); // Reset the form
      setShowAssignTask(false);                                // Close the modal
    } catch (error) {
      console.error('Error creating task', error);
    }
  };

  // Task count statistics for the stat cards
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;       // Not started
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length; // Being worked on
  const completedCount = tasks.filter(t => t.status === 'Completed').length;    // Finished
  const totalTasks = tasks.length;                                                // Total tasks

  // Filter tasks by the selected worker (or show all)
  const filteredTasks = workerFilter === 'All Workers'
    ? tasks
    : tasks.filter(t => t.worker === workerFilter);

  // Returns color scheme for a given task status (used for badges)
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return { bg: '#f3f4f6', text: '#6b7280' };        // Gray
      case 'In Progress': return { bg: '#dbeafe', text: '#3b82f6' };   // Blue
      case 'Completed': return { bg: '#dcfce7', text: '#22c55e' };     // Green
      default: return { bg: '#f3f4f6', text: '#6b7280' };               // Gray
    }
  };
  // Navigate back to the appropriate dashboard based on the user's role
  const goBack = () => {
    if (role === 'Production Staff') {
      navigate('/jobs/worker');    // Workers go to their dashboard
    } else {
      navigate('/jobs');   // Managers go to the manager dashboard
    }
  };

  // === RENDER — Task Management Interface ===
  return (
    <div style={styles.pageBackground} className="container">
      {/* Top Header with Back button and User Info */}
      <div style={styles.headerRow} className="flex flex-col sm:flex-row justify-between mb-5">
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ChevronLeft size={18} />
          <span>Go Back</span>
        </button>
      </div>

      <header style={styles.header} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 style={styles.headerTitle}>Worker Task Panel: {currentJob.product}</h1>
          <p style={styles.headerSubtitle}>Manage production tasks and monitor progress</p>
        </div>

        <div style={styles.headerRight} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <div style={styles.userBadge}>
            <div style={styles.avatar}>
              <User size={18} color="#3b82f6" />
            </div>
            <span style={styles.userName}>Worker Mode</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Task Statistics Summary Cards */}
      <div style={styles.statsRow} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <ClipboardList size={18} color="#6366f1" />
            <span style={styles.statTitle}>Total Tasks</span>
          </div>
          <span style={styles.statNumber}>{totalTasks}</span>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <Clock size={18} color="#f59e0b" />
            <span style={styles.statTitle}>In Progress</span>
          </div>
          <span style={styles.statNumber}>{inProgressCount}</span>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <CheckCircle size={18} color="#22c55e" />
            <span style={styles.statTitle}>Completed</span>
          </div>
          <span style={styles.statNumber}>{completedCount}</span>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statCardHeader}>
            <Calendar size={18} color="#ec4899" />
            <span style={styles.statTitle}>Pending</span>
          </div>
          <span style={styles.statNumber}>{pendingCount}</span>
        </div>
      </div>

      {/* MAIN TASK TABLE SECTION */}
      <div style={styles.mainCard}>
        <div style={styles.mainCardHeader} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 style={styles.mainCardTitle}>Work Queue</h2>
          <div style={styles.headerControls} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
            <div style={styles.workerFilter}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Filter:</span>
              <select
                style={styles.select}
                value={workerFilter}
                onChange={(e) => setWorkerFilter(e.target.value)}
              >
                <option>All Workers</option>
                {teamWorkers.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            {role === 'Job Manager' && id && (
              <button style={styles.assignTaskBtn} onClick={() => setShowAssignTask(true)}>
                <Plus size={16} />
                <span>Assign Task</span>
              </button>
            )}
          </div>
        </div>

        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Part Name</th>
                <th style={styles.th}>Assigned To</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Deadline</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.taskId} style={styles.tr}>
                  <td style={styles.tdBold}>{task.partName}</td>
                  <td style={styles.td}>{task.worker}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: getStatusStyle(task.status).bg,
                      color: getStatusStyle(task.status).text
                    }}>
                      {task.status}
                    </span>
                  </td>
                  <td style={styles.td}>{task.deadline}</td>
                  <td style={styles.td}>
                    <div style={styles.actionCell}>
                      <select
                        style={styles.statusDropdown}
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.taskId, e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>

                      {task.status === 'Pending' && (
                        <button
                          style={styles.startBtn}
                          onClick={() => handleStatusChange(task.taskId, 'In Progress')}
                        >
                          <Play size={14} fill="currentColor" />
                          <span>Start Task</span>
                        </button>
                      )}
                      {task.status === 'In Progress' && (
                        <button
                          style={styles.finishBtn}
                          onClick={() => handleStatusChange(task.taskId, 'Completed')}
                        >
                          <Check size={16} />
                          <span>Finish Task</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Summary Table */}
      <div style={{ ...styles.mainCard, marginTop: '32px' }}>
        <div style={styles.mainCardHeader}>
          <h2 style={styles.mainCardTitle}>Task Summary</h2>
        </div>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Task ID</th>
                <th style={styles.th}>Part Name</th>
                <th style={styles.th}>Worker</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Deadline</th>
                <th style={styles.th}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.taskId} style={styles.tr}>
                  <td style={styles.td}>{task.taskId}</td>
                  <td style={styles.td}>{task.partName}</td>
                  <td style={styles.td}>{task.worker}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge,
                      backgroundColor: getStatusStyle(task.status).bg,
                      color: getStatusStyle(task.status).text
                    }}>
                      {task.status}
                    </span>
                  </td>
                  <td style={styles.td}>{task.deadline}</td>
                  <td style={styles.td}>{task.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instruction Box */}
      <div style={styles.instructionCard}>
        <div style={styles.instructionHeader}>
          <Info size={18} color="#3b82f6" />
          <h3 style={styles.instructionTitle}>Operations Guide</h3>
        </div>
        <ul style={styles.instructionList}>
          <li>• Click <strong>Start</strong> to begin working on a task. Status will change to <strong>In Progress</strong>.</li>
          <li>• Click <strong>Finish</strong> when task is completed. Status will change to <strong>Completed</strong>.</li>
          <li>• Completed tasks are recorded automatically for the shift report.</li>
          {role === 'Job Manager' && <li>• As Job Manager, use <strong>Assign Task</strong> to create and assign new tasks to team members.</li>}
        </ul>
      </div>

      {/* Assign Task Modal */}
      {showAssignTask && (
        <div style={styles.modalOverlay} onClick={() => setShowAssignTask(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Assign New Task</h3>
              <button style={styles.modalCloseBtn} onClick={() => setShowAssignTask(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={styles.modalBody}>
              <label style={styles.modalLabel}>Part / Task Name</label>
              <input
                type="text"
                placeholder="e.g. Motor Housing Assembly"
                value={newTask.partName}
                onChange={(e) => setNewTask({ ...newTask, partName: e.target.value })}
                style={styles.modalInput}
                autoFocus
              />
              <label style={styles.modalLabel}>Assign To</label>
              <select
                value={newTask.worker}
                onChange={(e) => setNewTask({ ...newTask, worker: e.target.value })}
                style={styles.modalInput}
              >
                <option value="">Select Worker</option>
                {allWorkers.map((w) => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
              <label style={styles.modalLabel}>Deadline (optional)</label>
              <input
                type="date"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                style={styles.modalInput}
              />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowAssignTask(false)}>Cancel</button>
              <button style={styles.submitBtn} onClick={handleAssignTask}>Assign Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  pageBackground: { minHeight: '100vh', backgroundColor: '#f5f6fa', padding: '32px', fontFamily: "'Inter', sans-serif" },
  headerRow: { marginBottom: '20px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#6b7280', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
  headerTitle: { fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 },
  headerSubtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  userBadge: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'white', padding: '6px 16px 6px 6px', borderRadius: '50px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  avatar: { width: '32px', height: '32px', backgroundColor: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#4b5563', cursor: 'pointer' },
  statsRow: { display: 'grid', gap: '20px', marginBottom: '32px' },
  statCard: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  statCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  statTitle: { fontSize: '14px', fontWeight: '600', color: '#6b7280' },
  statNumber: { fontSize: '28px', fontWeight: '700', color: '#111827' },
  mainCard: { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', overflow: 'hidden' },
  mainCardHeader: { padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mainCardTitle: { fontSize: '18px', fontWeight: '700', color: '#111827' },
  headerControls: { display: 'flex', alignItems: 'center', gap: '12px' },
  workerFilter: { display: 'flex', alignItems: 'center', gap: '8px' },
  select: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', color: '#4b5563', backgroundColor: 'white', outline: 'none', cursor: 'pointer' },
  assignTaskBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  tableContainer: { width: '100%', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '16px 24px', backgroundColor: '#f9fafb', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f3f4f6' },
  tr: { borderBottom: '1px solid #f3f4f6', transition: 'background-color 0.2s' },
  td: { padding: '16px 24px', fontSize: '14px', color: '#4b5563', verticalAlign: 'middle' },
  tdBold: { padding: '16px 24px', fontSize: '14px', fontWeight: '600', color: '#111827', verticalAlign: 'middle' },
  badge: { padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '600', display: 'inline-block' },
  actionCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  statusDropdown: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#4b5563', backgroundColor: '#f9fafb', outline: 'none', cursor: 'pointer' },
  startBtn: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  finishBtn: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#22c55e', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  instructionCard: { marginTop: '32px', backgroundColor: 'white', borderRadius: '12px', padding: '24px', borderLeft: '4px solid #3b82f6', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  instructionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  instructionTitle: { fontSize: '16px', fontWeight: '700', color: '#111827' },
  instructionList: { listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0, margin: 0 },

  // Modal Styles
  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' },
  modal: { backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '480px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0 24px' },
  modalTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 },
  modalCloseBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', border: 'none', backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'pointer' },
  modalBody: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  modalLabel: { fontSize: '13px', fontWeight: '600', color: '#374151' },
  modalInput: { padding: '10px 14px', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px 24px 24px' },
  cancelBtn: { padding: '10px 20px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#4b5563', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
  submitBtn: { padding: '10px 20px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' },
};

export default WorkerTaskPanel;
