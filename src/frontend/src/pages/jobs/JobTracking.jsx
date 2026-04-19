// Import React and useState hook for state management
import React, { useState, useEffect } from 'react';
// Import URL parameter and navigation hooks
import { useParams, useNavigate } from 'react-router-dom';
// Import the shared job context for job data
import { useJobs } from '../../context/JobContext';
// Import the centralized API instance
import API from '../../api/api';
// Import icons used in the tracking page UI
import { 
  ArrowLeft,       // Back button
  Clock,           // Deadline/time icon
  CheckCircle,     // Completed stage indicator
  AlertTriangle,   // Alert/warning icon
  ChevronDown,     // Dropdown arrow
  Info,            // Info note icon
  Calendar,        // Date icon
  Hash,            // Job ID icon
  Zap,             // Auto-schedule icon
  Trash2,          // Clear schedule icon
  Package,         // Material request icon
  User,            // Worker icon
  Lock,            // Blocked step icon
  ListChecks,      // Schedule tab icon
  LayoutDashboard  // Overview tab icon
} from 'lucide-react';

// removed manual API_BASE — now using centralized API utility

// Process step color map
const STEP_COLORS = {
  'Cutting':   { bg: '#ede9fe', text: '#7c3aed', border: '#c4b5fd' },
  'Shaping':   { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  'Drilling':  { bg: '#fef3c7', text: '#d97706', border: '#fcd34d' },
  'Finishing': { bg: '#dcfce7', text: '#16a34a', border: '#86efac' },
};

const STATUS_COLORS = {
  'Pending':     { bg: '#f3f4f6', text: '#6b7280' },
  'In Progress': { bg: '#dbeafe', text: '#1d4ed8' },
  'Completed':   { bg: '#dcfce7', text: '#16a34a' },
};

// ============================================================
// JOB TRACKING PAGE — Detailed view of a single job's progress
// Tab 1: Overview — Process flow, parts progress, alerts
// Tab 2: Schedule — Gantt-style auto-schedule with material gate
// ============================================================

const JobTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getJobById, updateJob, loading } = useJobs();
  const job = getJobById(id);
  
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const isManager = role === 'Job Manager';

  // Active tab: 'overview' | 'schedule'
  const [activeTab, setActiveTab] = useState('overview');

  // Schedule state
  const [schedule, setSchedule]         = useState([]);      // flat task list
  const [groupedSchedule, setGrouped]   = useState({});      // grouped by part
  const [materialRequests, setMatReqs]  = useState([]);      // [{status, count}]
  const [scheduleLoading, setSchedLoad] = useState(false);
  const [scheduleError, setSchedError]  = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing]     = useState(false);

  // Assembly state
  const [assemblyChecks, setAssemblyChecks] = useState({
    partsVerified: false,
    hardwareSecure: false,
    safetyCheck: false,
    cosmeticInspection: false
  });
  const [completingAssembly, setCompletingAssembly] = useState(false);

  // ── Fetch schedule data whenever the schedule tab is opened ──────────────
  const fetchSchedule = async () => {
    setSchedLoad(true);
    setSchedError('');
    try {
      const res = await API.get(`/schedule/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule(res.data.tasks || []);
      setGrouped(res.data.groupedByPart || {});
      setMatReqs(res.data.materialRequests || []);
    } catch (err) {
      setSchedError('Failed to load schedule data.');
    } finally {
      setSchedLoad(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'schedule' && job) fetchSchedule();
  }, [activeTab, id, job]);

  if (loading) return <div style={{ padding: '40px', color: '#6b7280', textAlign: 'center' }}>Loading job tracking...</div>;
  if (!job) return <div style={{ padding: '40px', color: '#6b7280', textAlign: 'center' }}>Job not found.</div>;

  const stages = ['Created', 'Materials Ready', 'Production', 'Assembly', 'Quality Check', 'Completed'];
  const jobParts = job.parts || [];

  // ── Auto-schedule ────────────────────────────────────────────────────────
  const handleAutoSchedule = async () => {
    setIsGenerating(true);
    setSchedError('');
    try {
      await API.post(`/schedule/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchSchedule();
      updateJob(id, { status: 'Production' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate schedule.';
      setSchedError(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Clear schedule ───────────────────────────────────────────────────────
  const handleClearSchedule = async () => {
    if (!window.confirm('This will delete all auto-generated tasks. Are you sure?')) return;
    setIsClearing(true);
    try {
      await API.delete(`/schedule/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedule([]);
      setGrouped({});
      updateJob(id, { status: 'Materials Ready' });
    } catch (err) {
      setSchedError('Failed to clear schedule.');
    } finally {
      setIsClearing(false);
    }
  };

  // ── Stage change ─────────────────────────────────────────────────────────
  const handleStageChange = async (newStage) => {
    if (!isManager) return;
    const stageProgress = {
      'Created': 0, 'Materials Ready': 5, 'Production': 30,
      'Assembly': 60, 'Quality Check': 90, 'Completed': 100,
      'Material Shortage': job.progress, 'Rework': job.progress
    };
    try {
      await updateJob(job.id, { status: newStage, progress: stageProgress[newStage] ?? job.progress });
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  const handleAssemblyComplete = async () => {
    setCompletingAssembly(true);
    try {
      await updateJob(id, { status: 'Quality Check', progress: 90 });
      // Reload or update local if needed, JobContext should handle it
    } catch (err) {
      console.error('Assembly completion failed:', err);
    } finally {
      setCompletingAssembly(false);
    }
  };

  const isOverdue = () => {
    if (!job.deadline || job.status === 'Completed') return false;
    const d = new Date(job.deadline);
    d.setHours(23, 59, 59, 999);
    return new Date() > d;
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':   case 'Urgent': return { bg: '#fee2e2', text: '#ef4444' };
      case 'Medium': return { bg: '#ffedd5', text: '#f59e0b' };
      case 'Low':    return { bg: '#dcfce7', text: '#22c55e' };
      default:       return { bg: '#f3f4f6', text: '#6b7280' };
    }
  };

  const isQCActive = job.status === 'Quality Check';

  // ── Material request summary helpers ─────────────────────────────────────
  const matTotal    = materialRequests.reduce((s, r) => s + Number(r.count), 0);
  const matApproved = materialRequests.find(r => r.status === 'Approved')?.count || 0;
  const matPending  = materialRequests.find(r => r.status === 'Pending')?.count  || 0;
  const matRejected = materialRequests.find(r => r.status === 'Rejected')?.count || 0;
  const allApproved = matTotal > 0 && matPending === 0 && matRejected === 0;
  const hasRejected = matRejected > 0;
  
  // Can schedule if job is 'Materials Ready' or 'Production' (regeneration case)
  const canSchedule = isManager && (job.status === 'Materials Ready' || allApproved);
  const hasSchedule = schedule.length > 0;

  // ── Gantt bar width helper ────────────────────────────────────────────────
  const getBarStyle = (task) => {
    if (!job.deadline || !task.scheduledStart || !task.scheduledEnd) return {};
    const start    = new Date(task.scheduledStart);
    const end      = new Date(task.scheduledEnd);
    const deadline = new Date(job.deadline);
    const jobStart = new Date();
    jobStart.setHours(0,0,0,0);
    const totalMs  = deadline - jobStart;
    const barLeft  = ((start - jobStart) / totalMs) * 100;
    const barWidth = ((end - start)      / totalMs) * 100;
    const colors   = STATUS_COLORS[task.status] || STATUS_COLORS['Pending'];
    return {
      left:  `${Math.max(0, barLeft)}%`,
      width: `${Math.max(2, barWidth)}%`,
      backgroundColor: colors.bg,
      border: `1.5px solid ${colors.text}`,
      color: colors.text,
    };
  };

  // ================================================================
  // RENDER
  // ================================================================
  return (
    <div style={styles.container} className="container">
      {/* HEADER */}
      <header style={styles.header} className="stack-on-mobile">
        <div style={styles.headerLeft}>
          <button onClick={() => navigate('/jobs')} style={styles.backBtn}>
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
          <div style={styles.headerTitleGroup}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={styles.title}>Job Tracking: {job.id}</h1>
              {isOverdue() && (
                <span style={styles.overdueBadge}>
                  <AlertTriangle size={14} /> OVERDUE
                </span>
              )}
              {job.status === 'Material Shortage' && (
                <span style={{ ...styles.overdueBadge, backgroundColor: '#fef3c7', color: '#d97706' }}>
                  <Package size={14} /> MATERIAL SHORTAGE
                </span>
              )}
            </div>
            <p style={styles.subtitle}>Monitor job progress and production schedule</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button onClick={() => navigate(`/jobs/${job.id}/tasks`)} style={styles.outlineBtn}>
            Worker Tasks
          </button>
          <button 
            onClick={() => isQCActive && navigate(`/jobs/${job.id}/qc`)} 
            disabled={!isQCActive}
            style={{ ...styles.solidGreenBtn, ...(isQCActive ? {} : styles.disabledBtn) }}
            title={!isQCActive ? 'Available only during Quality Check stage' : ''}
          >
            Quality Check
          </button>
        </div>
      </header>

      {/* TAB BAR */}
      <div style={styles.tabBar}>
        <button
          style={{ ...styles.tab, ...(activeTab === 'overview' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={16} />
          Overview
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === 'schedule' ? styles.tabActive : {}) }}
          onClick={() => setActiveTab('schedule')}
        >
          <ListChecks size={16} />
          Schedule
          {schedule.length > 0 && (
            <span style={styles.tabBadge}>{schedule.length} tasks</span>
          )}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TAB 1: OVERVIEW
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={styles.contentLayout} className="stack-on-mobile">
          <div style={styles.mainContent}>
            {/* Job Summary Card */}
            <div style={styles.card}>
              <div style={styles.summaryTop}>
                <h2 style={styles.productName}>{job.product}</h2>
                <span style={{ ...styles.priorityBadge, backgroundColor: getPriorityStyle(job.priority).bg, color: getPriorityStyle(job.priority).text }}>
                  {job.priority} Priority
                </span>
              </div>
              <div style={styles.progressSection}>
                <div style={styles.progressHeader}>
                  <span style={styles.progressLabel}>Overall Completion</span>
                  <span style={styles.progressValue}>{job.progress}%</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: `${job.progress}%` }}></div>
                </div>
              </div>
              <div style={styles.summaryGrid} className="responsive-grid-2">
                <div style={styles.gridItem}>
                  <span style={styles.label}>Quantity</span>
                  <span style={styles.value}>{job.quantity} Units</span>
                </div>
                <div style={styles.gridItem}>
                  <span style={styles.label}>Assigned Team</span>
                  <span style={styles.value}>{job.team}</span>
                </div>
              </div>
              <div style={styles.notesSection}>
                <Info size={14} color="#3b82f6" />
                <p style={styles.notesText}>{job.notes || 'No special handling notes provided for this job.'}</p>
              </div>
            </div>

            {/* Process Flow Card */}
            <div style={styles.card}>
              <div style={styles.flowHeader} className="stack-on-mobile">
                <h3 style={styles.cardTitle}>Process Flow</h3>
                <div style={styles.stageControl}>
                  <span style={styles.stageLabel}>Current Stage:</span>
                  <div style={styles.dropdownWrapper}>
                    <select 
                      style={{ ...styles.stageSelect, cursor: isManager ? 'pointer' : 'not-allowed' }}
                      value={job.status}
                      onChange={(e) => handleStageChange(e.target.value)}
                      disabled={!isManager}
                    >
                      {stages.map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="Material Shortage">Material Shortage</option>
                      <option value="Rework">Rework</option>
                    </select>
                    <ChevronDown size={14} style={styles.dropdownIcon} />
                  </div>
                </div>
              </div>
              <div style={styles.trackerContainer} className="table-responsive">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: '600px', width: '100%', padding: '20px 0' }}>
                  {['Created', 'Materials Ready', 'Production', 'Assembly', 'Quality Check', 'Completed'].map((step, index) => {
                    const allStages = ['Created', 'Materials Ready', 'Production', 'Assembly', 'Quality Check', 'Completed'];
                    const currentIndex = allStages.indexOf(job.status);
                    const isCompleted = index < currentIndex;
                    const isCurrent   = index === currentIndex;
                    return (
                      <React.Fragment key={step}>
                        <div style={styles.stepBox}>
                          <div style={{
                            ...styles.stepCircle,
                            backgroundColor: isCompleted ? '#22c55e' : (isCurrent ? '#3b82f6' : '#e5e7eb'),
                            border: isCurrent ? '4px solid #dbeafe' : 'none'
                          }}>
                            {isCompleted ? <CheckCircle size={16} color="white" /> : 
                             <div style={{ ...styles.innerCircle, backgroundColor: isCurrent ? 'white' : 'transparent' }}></div>}
                          </div>
                          <span style={{ ...styles.stepName, color: isCurrent ? '#111827' : '#6b7280', fontWeight: isCurrent ? '700' : '500' }}>
                            {step}
                          </span>
                        </div>
                        {index < allStages.length - 1 && (
                          <div style={{ ...styles.stepLine, backgroundColor: isCompleted ? '#22c55e' : '#e5e7eb' }}></div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Final Assembly Card — Only visible during Assembly stage */}
            {job.status === 'Assembly' && (
              <div style={{ ...styles.card, border: '2px solid #6366f1', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: '#6366f1' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h2 style={styles.cardTitle}>Final Assembly Workflow</h2>
                    <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>Verify all parts are correctly assembled before moving to QC.</p>
                  </div>
                  <Package size={24} color="#6366f1" />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  {Object.keys(assemblyChecks).map(key => (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                      <input 
                        type="checkbox" 
                        checked={assemblyChecks[key]} 
                        onChange={() => setAssemblyChecks(prev => ({ ...prev, [key]: !prev[key] }))}
                        style={{ width: '18px', height: '18px', accentColor: '#6366f1' }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151', textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    style={{ 
                      ...styles.solidGreenBtn, 
                      backgroundColor: Object.values(assemblyChecks).every(v => v) ? '#6366f1' : '#e5e7eb',
                      cursor: Object.values(assemblyChecks).every(v => v) ? 'pointer' : 'not-allowed'
                    }}
                    disabled={!Object.values(assemblyChecks).every(v => v) || completingAssembly}
                    onClick={handleAssemblyComplete}
                  >
                    {completingAssembly ? 'Processing...' : 'Complete Assembly & Move to QC'}
                  </button>
                </div>
              </div>
            )}

            {/* Parts Progress Card */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Part-wise Progress</h2>
              <div style={styles.tableContainer} className="table-responsive">
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Part Name</th>
                      <th style={styles.th}>Required</th>
                      <th style={styles.th}>Completed</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobParts.length > 0 ? jobParts.map((part) => (
                      <tr key={part.id || part.name} style={styles.tr}>
                        <td style={styles.tdBold}>{part.name}</td>
                        <td style={styles.td}>{part.requiredQty}</td>
                        <td style={styles.td}>{part.completedQty || 0}</td>
                        <td style={styles.td}>
                          <span style={{
                            ...styles.tableBadge,
                            backgroundColor: (part.completedQty >= part.requiredQty) ? '#dcfce7' : (part.completedQty > 0 ? '#dbeafe' : '#f3f4f6'),
                            color: (part.completedQty >= part.requiredQty) ? '#166534' : (part.completedQty > 0 ? '#1e40af' : '#4b5563')
                          }}>
                            {part.completedQty >= part.requiredQty ? 'Completed' : (part.completedQty > 0 ? 'In Progress' : 'Pending')}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.tableProgressWrapper}>
                            <div style={styles.tableProgressBg}>
                              <div style={{ ...styles.tableProgressFill, width: `${Math.min((part.completedQty / part.requiredQty) * 100, 100)}%`, backgroundColor: (part.completedQty >= part.requiredQty) ? '#22c55e' : '#3b82f6' }}></div>
                            </div>
                            <span style={styles.tableProgressText}>{Math.round(Math.min((part.completedQty / part.requiredQty) * 100, 100))}%</span>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ ...styles.td, textAlign: 'center', padding: '40px' }}>
                          No components defined for this job.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={styles.sidebar}>
            <div style={styles.sideCard}>
              <h3 style={styles.sideTitle}>Job Details</h3>
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <Hash size={16} color="#9ca3af" />
                  <div>
                    <span style={styles.infoLabel}>Job ID</span>
                    <span style={styles.infoValue}>{job.id}</span>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <Calendar size={16} color="#9ca3af" />
                  <div>
                    <span style={styles.infoLabel}>Created Date</span>
                    <span style={styles.infoValue}>{new Date(job.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={styles.infoItem}>
                  <Clock size={16} color="#9ca3af" />
                  <div>
                    <span style={styles.infoLabel}>Deadline</span>
                    <span style={styles.infoValue}>{job.deadline}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ ...styles.alertCard, backgroundColor: isOverdue() ? '#fee2e2' : '#fef3c7', borderColor: isOverdue() ? '#ef4444' : '#f59e0b' }}>
              <div style={styles.alertHeader}>
                <AlertTriangle size={18} color={isOverdue() ? '#ef4444' : '#f59e0b'} />
                <span style={{ ...styles.alertTitle, color: isOverdue() ? '#991b1b' : '#92400e' }}>
                  {isOverdue() ? 'Critical Alert' : 'Job Alerts'}
                </span>
              </div>
              <p style={{ ...styles.alertText, color: isOverdue() ? '#b91c1c' : '#b45309' }}>
                {isOverdue()
                  ? 'This job has passed its deadline. Immediate attention required.'
                  : (job.alert || 'No active issues reported.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          TAB 2: SCHEDULE
      ══════════════════════════════════════════════════════════ */}
      {activeTab === 'schedule' && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Material Requests Status Panel */}
          <div style={styles.matPanel}>
            <div style={styles.matPanelHeader}>
              <Package size={18} color="#6366f1" />
              <h3 style={styles.matPanelTitle}>Material Requests Status</h3>
            </div>
            {matTotal === 0 ? (
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                No material requests found for this job. Requests are auto-created when the job is first saved.
              </p>
            ) : (
              <div style={styles.matStats}>
                <div style={{ ...styles.matStat, backgroundColor: '#dcfce7', color: '#16a34a' }}>
                  <span style={styles.matStatNum}>{matApproved}</span>
                  <span style={styles.matStatLabel}>Approved</span>
                </div>
                <div style={{ ...styles.matStat, backgroundColor: '#fef3c7', color: '#d97706' }}>
                  <span style={styles.matStatNum}>{matPending}</span>
                  <span style={styles.matStatLabel}>Pending</span>
                </div>
                <div style={{ ...styles.matStat, backgroundColor: '#fee2e2', color: '#dc2626' }}>
                  <span style={styles.matStatNum}>{matRejected}</span>
                  <span style={styles.matStatLabel}>Rejected</span>
                </div>
                <div style={{ ...styles.matStat, backgroundColor: '#f3f4f6', color: '#374151' }}>
                  <span style={styles.matStatNum}>{matTotal}</span>
                  <span style={styles.matStatLabel}>Total</span>
                </div>
              </div>
            )}

            {/* Gate message */}
            {hasRejected && (
              <div style={styles.gateAlert}>
                <AlertTriangle size={16} color="#dc2626" />
                <span>Scheduling blocked: {matRejected} material request(s) rejected. Contact Inventory to resolve.</span>
              </div>
            )}
            {!hasRejected && matPending > 0 && (
              <div style={{ ...styles.gateAlert, backgroundColor: '#fef3c7', borderColor: '#fcd34d', color: '#92400e' }}>
                <Clock size={16} color="#d97706" />
                <span>Waiting for Inventory to approve {matPending} pending request(s) before scheduling can begin.</span>
              </div>
            )}
            {allApproved && (
              <div style={{ ...styles.gateAlert, backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#166534' }}>
                <CheckCircle size={16} color="#16a34a" />
                <span>All materials approved — job is ready for scheduling.</span>
              </div>
            )}
          </div>

          {/* Schedule Actions */}
          {isManager && (
            <div style={styles.scheduleActionBar}>
              {!hasSchedule ? (
                <button
                  style={{ ...styles.scheduleBtn, opacity: (canSchedule && !isGenerating) ? 1 : 0.5, cursor: canSchedule ? 'pointer' : 'not-allowed' }}
                  onClick={canSchedule ? handleAutoSchedule : undefined}
                  disabled={!canSchedule || isGenerating}
                  title={!canSchedule ? 'All material requests must be approved first' : 'Generate production schedule'}
                >
                  <Zap size={18} />
                  {isGenerating ? 'Generating Schedule...' : 'Auto-Schedule Tasks'}
                </button>
              ) : (
                <button
                  style={styles.clearBtn}
                  onClick={handleClearSchedule}
                  disabled={isClearing}
                >
                  <Trash2 size={16} />
                  {isClearing ? 'Clearing...' : 'Clear Schedule'}
                </button>
              )}
              {scheduleError && (
                <div style={styles.scheduleError}>
                  <AlertTriangle size={15} />
                  <span>{scheduleError}</span>
                </div>
              )}
            </div>
          )}

          {/* Schedule Loading */}
          {scheduleLoading && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <div style={styles.spinner}></div>
              <p style={{ marginTop: '16px' }}>Loading schedule...</p>
            </div>
          )}

          {/* Empty State */}
          {!scheduleLoading && !hasSchedule && (
            <div style={styles.emptyState}>
              <ListChecks size={48} color="#d1d5db" />
              <h3 style={styles.emptyTitle}>No Schedule Generated Yet</h3>
              <p style={styles.emptyText}>
                {canSchedule
                  ? 'All materials are approved. Click "Auto-Schedule Tasks" above to generate a production schedule.'
                  : 'A schedule will be available once all material requests are approved by Inventory.'}
              </p>
            </div>
          )}

          {/* Gantt-style Schedule Table */}
          {!scheduleLoading && hasSchedule && (
            <div style={styles.ganttWrapper}>
              <div style={styles.ganttHeader}>
                <h3 style={styles.ganttTitle}>Production Schedule — {Object.keys(groupedSchedule).length} Part(s)</h3>
                <div style={styles.ganttLegend}>
                  {Object.entries(STEP_COLORS).map(([step, color]) => (
                    <span key={step} style={{ ...styles.legendItem, backgroundColor: color.bg, color: color.text, border: `1px solid ${color.border}` }}>
                      {step}
                    </span>
                  ))}
                </div>
              </div>

              {/* Deadline ruler */}
              <div style={styles.ruler}>
                <span style={styles.rulerStart}>Today</span>
                <span style={styles.rulerEnd}>Deadline: {job.deadline}</span>
              </div>

              {/* Part rows */}
              {Object.entries(groupedSchedule).map(([partName, tasks]) => (
                <div key={partName} style={styles.partBlock}>
                  <div style={styles.partLabel}>
                    <Package size={14} color="#6366f1" />
                    <span>{partName}</span>
                    <span style={styles.partStepCount}>{tasks.length} steps</span>
                  </div>

                  {/* Step rows */}
                  {tasks.map((task, idx) => {
                    const stepColor  = STEP_COLORS[task.processStep] || STEP_COLORS['Cutting'];
                    const barStyle   = getBarStyle(task);
                    // Check if previous step is completed (for blocked indicator)
                    const prevTask   = idx > 0 ? tasks[idx - 1] : null;
                    const isBlocked  = prevTask && prevTask.status !== 'Completed' && task.status === 'Pending';

                    return (
                      <div key={task.taskId} style={styles.stepRow}>
                        {/* Left: Step info */}
                        <div style={styles.stepMeta}>
                          <span style={{ ...styles.stepBadge, backgroundColor: stepColor.bg, color: stepColor.text, border: `1px solid ${stepColor.border}` }}>
                            {task.sequenceOrder}. {task.processStep}
                          </span>
                          <div style={styles.workerTag}>
                            <User size={11} />
                            <span>{task.worker || 'Unassigned'}</span>
                          </div>
                          {isBlocked && (
                            <div style={styles.blockedTag}>
                              <Lock size={11} />
                              <span>Blocked</span>
                            </div>
                          )}
                        </div>

                        {/* Right: Gantt bar track */}
                        <div style={styles.ganttTrack}>
                          <div style={{ ...styles.ganttBar, ...barStyle }}>
                            <span style={styles.ganttBarText}>
                              {task.scheduledStart} – {task.scheduledEnd}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div style={{ ...styles.statusBadge, backgroundColor: STATUS_COLORS[task.status]?.bg, color: STATUS_COLORS[task.status]?.text }}>
                          {task.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container:       { minHeight: '100vh', backgroundColor: '#f5f6fa', padding: '32px', fontFamily: "'Inter', sans-serif" },
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: '1200px', margin: '0 auto 24px auto' },
  headerLeft:      { display: 'flex', flexDirection: 'column', gap: '8px' },
  backBtn:         { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontWeight: '600', padding: 0 },
  headerTitleGroup:{ marginTop: '8px' },
  title:           { fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 },
  subtitle:        { fontSize: '14px', color: '#6b7280', margin: 0 },
  overdueBadge:    { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#fee2e2', color: '#ef4444', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
  headerRight:     { display: 'flex', gap: '12px' },
  outlineBtn:      { padding: '10px 20px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#374151', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  solidGreenBtn:   { padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: 'white', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  disabledBtn:     { backgroundColor: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' },

  // Tabs
  tabBar:          { display: 'flex', gap: '4px', maxWidth: '1200px', margin: '0 auto 24px auto', backgroundColor: 'white', borderRadius: '12px', padding: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  tab:             { display: 'flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'none', fontSize: '14px', fontWeight: '600', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive:       { backgroundColor: '#6366f1', color: 'white', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
  tabBadge:        { backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' },

  // Overview layout
  contentLayout:   { display: 'grid', gap: '24px', maxWidth: '1200px', margin: '0 auto' },
  mainContent:     { display: 'flex', flexDirection: 'column', gap: '24px' },
  card:            { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  summaryTop:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  productName:     { fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 },
  priorityBadge:   { padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
  progressSection: { marginBottom: '24px' },
  progressHeader:  { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  progressLabel:   { fontSize: '13px', fontWeight: '600', color: '#6b7280' },
  progressValue:   { fontSize: '13px', fontWeight: '700', color: '#3b82f6' },
  progressBarBg:   { height: '10px', backgroundColor: '#f3f4f6', borderRadius: '5px', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: '5px' },
  summaryGrid:     { display: 'grid', gap: '24px', padding: '20px 0', borderTop: '1px solid #f3f4f6' },
  gridItem:        { display: 'flex', flexDirection: 'column', gap: '4px' },
  label:           { fontSize: '12px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' },
  value:           { fontSize: '15px', fontWeight: '600', color: '#111827' },
  notesSection:    { display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#eff6ff', padding: '12px', borderRadius: '8px' },
  notesText:       { fontSize: '13px', color: '#1e40af', margin: 0 },
  flowHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  cardTitle:       { fontSize: '17px', fontWeight: '700', color: '#111827', margin: 0 },
  stageControl:    { display: 'flex', alignItems: 'center', gap: '12px' },
  stageLabel:      { fontSize: '14px', color: '#6b7280', fontWeight: '500' },
  dropdownWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  stageSelect:     { padding: '8px 32px 8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', fontSize: '14px', fontWeight: '600', color: '#111827', appearance: 'none', outline: 'none' },
  dropdownIcon:    { position: 'absolute', right: '12px', pointerEvents: 'none', color: '#6b7280' },
  trackerContainer:{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', overflowX: 'auto' },
  stepBox:         { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1, flex: '0 0 auto' },
  stepCircle:      { width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  innerCircle:     { width: '8px', height: '8px', borderRadius: '50%' },
  stepName:        { fontSize: '10px', textAlign: 'center', maxWidth: '70px', lineHeight: '1.3' },
  stepLine:        { flex: 1, height: '3px', margin: '0 -15px', marginTop: '-24px', minWidth: '12px' },
  table:           { width: '100%', borderCollapse: 'collapse' },
  th:              { padding: '12px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', borderBottom: '1px solid #f3f4f6', fontWeight: '600' },
  tr:              { borderBottom: '1px solid #f3f4f6' },
  td:              { padding: '16px 12px', fontSize: '14px', color: '#4b5563' },
  tdBold:          { padding: '16px 12px', fontSize: '14px', fontWeight: '600', color: '#111827' },
  tableBadge:      { padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' },
  tableProgressWrapper: { display: 'flex', alignItems: 'center', gap: '10px', width: '120px' },
  tableProgressBg: { flex: 1, height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' },
  tableProgressFill:{ height: '100%', borderRadius: '3px' },
  tableProgressText:{ fontSize: '12px', fontWeight: '700', color: '#111827' },
  tableContainer:  { width: '100%', overflowX: 'auto' },
  sidebar:         { display: 'flex', flexDirection: 'column', gap: '24px' },
  sideCard:        { backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  sideTitle:       { fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '20px' },
  infoList:        { display: 'flex', flexDirection: 'column', gap: '20px' },
  infoItem:        { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  infoLabel:       { display: 'block', fontSize: '11px', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase' },
  infoValue:       { display: 'block', fontSize: '14px', fontWeight: '600', color: '#111827' },
  alertCard:       { borderRadius: '16px', padding: '20px', border: '1px solid' },
  alertHeader:     { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  alertTitle:      { fontSize: '14px', fontWeight: '700' },
  alertText:       { fontSize: '13px', margin: '0 0 8px 0', lineHeight: '1.5' },

  // Schedule tab
  matPanel:        { backgroundColor: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  matPanelHeader:  { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  matPanelTitle:   { fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 },
  matStats:        { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' },
  matStat:         { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 20px', borderRadius: '12px', minWidth: '80px' },
  matStatNum:      { fontSize: '28px', fontWeight: '800' },
  matStatLabel:    { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginTop: '2px' },
  gateAlert:       { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '500' },

  scheduleActionBar:{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  scheduleBtn:     { display: 'flex', alignItems: 'center', gap: '8px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' },
  clearBtn:        { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', color: '#ef4444', border: '1.5px solid #fca5a5', padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  scheduleError:   { display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '13px', fontWeight: '500', backgroundColor: '#fee2e2', padding: '10px 16px', borderRadius: '8px', border: '1px solid #fca5a5' },

  spinner:         { width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' },
  emptyState:      { textAlign: 'center', padding: '80px 24px', backgroundColor: 'white', borderRadius: '16px' },
  emptyTitle:      { fontSize: '20px', fontWeight: '700', color: '#374151', margin: '16px 0 8px' },
  emptyText:       { fontSize: '14px', color: '#6b7280', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' },

  // Gantt
  ganttWrapper:    { backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  ganttHeader:     { padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  ganttTitle:      { fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 },
  ganttLegend:     { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  legendItem:      { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  ruler:           { display: 'flex', justifyContent: 'space-between', padding: '8px 24px 8px 260px', backgroundColor: '#f9fafb', fontSize: '11px', fontWeight: '600', color: '#9ca3af', borderBottom: '1px solid #f3f4f6' },
  rulerStart:      {},
  rulerEnd:        {},
  partBlock:       { borderBottom: '2px solid #f3f4f6', padding: '8px 0' },
  partLabel:       { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', backgroundColor: '#f9fafb', fontSize: '13px', fontWeight: '700', color: '#374151' },
  partStepCount:   { marginLeft: 'auto', fontSize: '11px', fontWeight: '600', color: '#9ca3af' },
  stepRow:         { display: 'flex', alignItems: 'center', padding: '8px 24px', borderBottom: '1px solid #f9fafb', minHeight: '52px' },
  stepMeta:        { width: '240px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
  stepBadge:       { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' },
  workerTag:       { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6b7280', fontWeight: '500' },
  blockedTag:      { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#dc2626', fontWeight: '700', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '20px' },
  ganttTrack:      { flex: 1, height: '30px', position: 'relative', backgroundColor: '#f9fafb', borderRadius: '6px', margin: '0 16px', overflow: 'hidden' },
  ganttBar:        { position: 'absolute', top: '4px', height: '22px', borderRadius: '4px', display: 'flex', alignItems: 'center', paddingLeft: '8px', whiteSpace: 'nowrap', overflow: 'hidden', fontSize: '11px', fontWeight: '600', minWidth: '20px' },
  ganttBarText:    { overflow: 'hidden', textOverflow: 'ellipsis' },
  statusBadge:     { width: '90px', flexShrink: 0, padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '700', textAlign: 'center' },
};

export default JobTracking;
