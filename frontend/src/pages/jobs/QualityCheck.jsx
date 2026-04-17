// Import React hooks for state management
import React, { useState, useEffect } from 'react';
// Import URL param extraction and navigation hooks
import { useParams, useNavigate } from 'react-router-dom';
// Import the shared job context for job data and QC record operations
import { useJobs } from '../../context/JobContext';
// Import various icons used throughout the QC page UI
import { 
  ArrowLeft,        // Back button icon
  CheckCircle,      // Pass indicator
  XCircle,          // Fail indicator
  AlertCircle,      // Warning icon
  User,             // Inspector icon
  Clock,            // Time icon
  ClipboardCheck,   // Checklist icon
  AlertTriangle,    // Rework warning icon
  History,          // QC history icon
  Activity,         // Parts progress icon
  Check,            // Checkmark icon
  X                 // Close icon
} from 'lucide-react';

// ============================================================
// QUALITY CHECK PAGE — Inspect a job's quality and approve or send for rework
// Inspectors check each item in a checklist. If all items pass, the job is
// marked as "Completed". If any items fail, rework details must be provided
// and the job status changes to "Rework".
// ============================================================

const QualityCheck = () => {
  const { id } = useParams();           // Get the job ID from the URL (e.g., /job/JOB-001/qc)
  const navigate = useNavigate();        // Hook for page navigation
  // Get job data and QC functions from the shared context
  const { getJobById, updateJob, addQCRecord, getQCRecordsByJobId } = useJobs();
  const job = getJobById(id);            // Find the job by ID
  const history = getQCRecordsByJobId(id); // Get previous QC records for this job

  // Inspector information state
  const [inspector, setInspector] = useState('John Inspector');              // Inspector's name
  const [inspectionDate, setInspectionDate] = useState(new Date().toLocaleString()); // Current date/time
  
  // Quality checklist state — each item can be checked (passed) or unchecked (failed)
  // All items start as unchecked (passed: false)
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Dimensional accuracy within tolerance', passed: false, notes: '' },
    { id: 2, label: 'Surface finish quality meets specifications', passed: false, notes: '' },
    { id: 3, label: 'Material certification verified', passed: false, notes: '' },
    { id: 4, label: 'Functional testing completed', passed: false, notes: '' },
    { id: 5, label: 'Visual inspection passed', passed: false, notes: '' },
    { id: 6, label: 'Assembly integrity verified', passed: false, notes: '' },
  ]);

  // Rework form state — only needed when checklist items fail
  const [reworkReason, setReworkReason] = useState('');       // Why rework is needed
  const [assignedTeam, setAssignReworkTo] = useState('');     // Which team handles the rework
  const [validationError, setValidationError] = useState(''); // Form validation error message
  const [availableTeams, setAvailableTeams] = useState([]);   // Real teams from API

  // Fetch real teams for the rework dropdown
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await API.get('/teams', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAvailableTeams(res.data || []);
      } catch (err) {
        console.error('Failed to fetch teams:', err);
      }
    };
    fetchTeams();
  }, []);

  // If the job doesn't exist, show an error message
  if (!job) return <div style={{ padding: '40px' }}>Job not found.</div>;

  // Calculate how many checklist items passed vs failed
  const passedCount = checklist.filter(item => item.passed).length;
  const failedCount = checklist.length - passedCount; // Unchecked items count as failed

  // Toggle a checklist item between passed and not passed
  const toggleCheck = (id) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, passed: !item.passed } : item
    ));
  };

  // Update notes for a specific checklist item
  const handleNoteChange = (id, note) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, notes: note } : item
    ));
  };

  // Handle the QC form submission — two possible outcomes:
  // 1. If ANY items failed → Submit for Rework (status becomes "Rework")
  // 2. If ALL items passed → Approve & Complete (status becomes "Completed")
  const handleSubmit = () => {
    setValidationError(''); // Clear any previous validation errors

    if (failedCount > 0) {
      // === REWORK PATH — some checklist items failed ===
      // Validate that rework details are provided
      if (!reworkReason || !assignedTeam) {
        setValidationError('Please provide rework reason and assign a team.');
        return; // Stop submission until validation passes
      }

      // Save a QC Record with "Fail" result to the database
      addQCRecord({
        jobId: job.id,
        inspector,
        date: inspectionDate,
        result: 'Fail',             // Record that QC failed
        passed: passedCount,         // How many items passed (e.g., 4 out of 6)
        total: checklist.length,     // Total checklist items
        notes: reworkReason          // Why rework is needed
      });

      // Update the job status to "Rework" and reduce progress by 20%
      // Math.max ensures progress doesn't drop below 10%
      updateJob(job.id, { status: 'Rework', progress: Math.max(job.progress - 20, 10) });
      navigate('/jobs'); // Go back to the dashboard
    } else {
      // === APPROVAL PATH — all checklist items passed ===
      // Save a QC Record with "Pass" result to the database
      addQCRecord({
        jobId: job.id,
        inspector,
        date: inspectionDate,
        result: 'Pass',              // Record that QC passed
        passed: passedCount,          // All items passed
        total: checklist.length,
        notes: 'All quality checks passed successfully.'
      });

      // Update the job status to "Completed" with 100% progress
      updateJob(job.id, { status: 'Completed', progress: 100 });
      navigate('/jobs'); // Go back to the dashboard
    }
  };

  return (
    <div style={styles.container} className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* HEADER */}
      <header style={styles.header} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div style={styles.headerLeft} className="flex flex-col gap-3">
          <button onClick={() => navigate(`/manager-dashboard`)} style={styles.backBtn} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium transition-colors">
            <ArrowLeft size={18} />
            <span>← Back to Job Tracking</span>
          </button>
          <div style={styles.headerTitleGroup} className="mt-2">
            <h1 style={styles.title} className="text-2xl md:text-3xl">Quality Check</h1>
            <p style={styles.subtitle}>{job.product}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDE (MAIN) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Job Information Card */}
          <div style={styles.card} className="w-full">
            <div style={styles.cardHeader} className="flex items-center gap-2 mb-4">
              <ClipboardCheck size={20} color="#3b82f6" />
              <h3 style={styles.cardTitle}>Job Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div style={styles.infoItem} className="flex flex-col gap-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span style={styles.label} className="text-gray-500">Job ID</span>
                <span style={styles.value} className="text-gray-900">{job.id}</span>
              </div>
              <div style={styles.infoItem} className="flex flex-col gap-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span style={styles.label} className="text-gray-500">Quantity</span>
                <span style={styles.value} className="text-gray-900">{job.quantity} Units</span>
              </div>
              <div style={styles.infoItem} className="flex flex-col gap-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span style={styles.label} className="text-gray-500">Team</span>
                <span style={styles.value} className="text-gray-900">{job.team}</span>
              </div>
              <div style={styles.infoItem} className="flex flex-col gap-1 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
                <span style={styles.label} className="text-gray-500">Status</span>
                <span style={{...styles.badge, backgroundColor: '#fef3c7', color: '#f59e0b'}} className="w-fit">{job.status}</span>
              </div>
            </div>
          </div>

          {/* Inspector Information Section */}
          <div style={styles.card} className="w-full">
            <div style={styles.cardHeader} className="flex items-center gap-2 mb-4">
              <User size={20} color="#3b82f6" />
              <h3 style={styles.cardTitle}>Inspector Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div style={styles.inputGroup} className="flex flex-col gap-1 w-full">
                <label style={styles.inputLabel} className="text-sm font-medium text-gray-700">Inspector Name</label>
                <input 
                  type="text" 
                  value={inspector} 
                  onChange={(e) => setInspector(e.target.value)}
                  style={styles.input}
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                />
              </div>
              <div style={styles.inputGroup} className="flex flex-col gap-1 w-full">
                <label style={styles.inputLabel} className="text-sm font-medium text-gray-700">Inspection Date & Time</label>
                <input 
                  type="text" 
                  value={inspectionDate} 
                  onChange={(e) => setInspectionDate(e.target.value)}
                  style={styles.input}
                  className="w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-2 px-3"
                />
              </div>
            </div>
          </div>

          {/* QUALITY CHECKLIST */}
          <div style={styles.card} className="w-full">
            <div style={styles.checklistHeader} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <ClipboardCheck size={20} color="#3b82f6" />
                <h3 style={styles.cardTitle}>Quality Checklist</h3>
              </div>
              <div style={styles.liveCount} className="flex gap-4">
                <span className="text-green-600 font-bold">Passed: {passedCount}</span>
                <span className="text-red-500 font-bold">Failed: {failedCount}</span>
              </div>
            </div>

            <div style={styles.checklistGrid} className="flex flex-col gap-3">
              {checklist.map(item => (
                <div key={item.id} style={styles.checkItem} className="flex flex-col p-4 bg-gray-50 border border-gray-100 rounded-lg shadow-sm gap-2">
                  <div className="flex w-full justify-between items-center cursor-pointer" onClick={() => toggleCheck(item.id)}>
                    <span style={{
                      ...styles.checkLabel,
                      color: item.passed ? '#4b5563' : '#111827',
                      textDecoration: item.passed ? 'line-through' : 'none',
                      opacity: item.passed ? 0.7 : 1
                    }} className="font-medium text-sm flex-1">{item.label}</span>
                    <button 
                      style={{
                        ...styles.checkBtn,
                        backgroundColor: item.passed ? '#22c55e' : 'white',
                        borderColor: item.passed ? '#22c55e' : '#d1d5db'
                      }}
                      className="w-6 h-6 rounded border-2 shrink-0 flex items-center justify-center transition-colors shadow-sm ml-4"
                    >
                      {item.passed && <Check size={14} color="white" strokeWidth={3} />}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Add fault notes (optional)..." 
                    style={styles.checkInput}
                    value={item.notes}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    className="w-full mt-2 p-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rework Section (only shown when any checklist items are failed) */}
          {failedCount > 0 && (
            <div style={styles.reworkCard} className="w-full bg-red-50 border border-red-300 rounded-xl p-5 shadow-sm">
              <div style={styles.reworkHeader} className="flex items-center gap-2 mb-3">
                <AlertTriangle size={20} color="#ef4444" />
                <h3 style={styles.reworkTitle} className="text-red-700 font-bold text-lg">Rework Required ({failedCount} Issues)</h3>
              </div>
              <p style={styles.reworkDesc} className="text-red-600 text-sm mb-4">Please provide reason for rework and assign a team for rectification.</p>
              
              <div style={styles.reworkForm} className="flex flex-col md:flex-row gap-5">
                <div style={{ flex: 2 }} className="w-full">
                  <label style={styles.label} className="text-xs font-bold text-red-700 uppercase mb-1 flex items-center">Rework Reason / Instructions <span className="text-red-500 ml-1 text-base">*</span></label>
                  <textarea 
                    placeholder="Describe what needs to be fixed..." 
                    style={styles.textarea}
                    className="w-full border-red-300 p-3 rounded-md focus:ring-red-500 text-sm shadow-sm"
                    value={reworkReason}
                    onChange={(e) => setReworkReason(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }} className="w-full">
                  <label style={styles.label} className="text-xs font-bold text-red-700 uppercase mb-1">Assign Rework To</label>
                  <select 
                    style={styles.select}
                    className="w-full border-red-300 p-3 rounded-md bg-white text-sm shadow-sm"
                    value={assignedTeam}
                    onChange={(e) => setAssignReworkTo(e.target.value)}
                  >
                    <option value="">Select Team</option>
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.name}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Validation error message if fields are missing */}
              {validationError && <p style={styles.errorText} className="text-red-600 font-medium text-sm mt-3">{validationError}</p>}
            </div>
          )}

          {/* Form Actions */}
          <div style={styles.actions} className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
            <button onClick={() => navigate(`/manager-dashboard`)} style={styles.cancelBtn} className="w-full sm:w-auto px-6 py-2 border rounded-md bg-white hover:bg-gray-50 font-medium text-gray-700 transition">Cancel</button>
            <button 
              onClick={handleSubmit} 
              style={{
                ...styles.submitBtn,
                backgroundColor: failedCount > 0 ? '#ef4444' : '#22c55e'
              }}
              className="w-full sm:w-auto px-8 py-2 rounded-md bg-green-500 hover:opacity-90 text-white font-bold transition shadow-sm"
            >
              {failedCount > 0 ? 'Submit for Rework' : 'Approve & Complete'}
            </button>
          </div>
        </div>

        {/* RIGHT SIDE (SIDEBAR) */}
        <div style={styles.sidebar} className="flex flex-col gap-6 lg:col-span-1">
          {/* QC History Card */}
          <div style={styles.sideCard} className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div style={styles.cardHeader} className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
              <History size={18} color="#3b82f6" />
              <h3 style={styles.sideCardTitle} className="font-bold text-gray-900">QC History</h3>
            </div>
            <div style={styles.historyList} className="flex flex-col gap-4">
              {history.length > 0 ? history.map((record) => (
                <div key={record.id} style={styles.historyItem} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div style={styles.historyTop} className="flex justify-between items-center mb-2">
                    <span style={{
                      ...styles.miniBadge,
                      backgroundColor: record.result === 'Pass' ? '#dcfce7' : '#fee2e2',
                      color: record.result === 'Pass' ? '#166534' : '#ef4444'
                    }} className="px-2 py-0.5 rounded text-xs font-bold uppercase">{record.result}</span>
                    <span style={styles.historyDate} className="text-xs text-gray-400">{record.date.split(',')[0]}</span>
                  </div>
                  <p style={styles.historyNotes} className="text-sm text-gray-600 mb-1">{record.notes}</p>
                  <span style={styles.historyInspector} className="text-xs text-gray-400">By: {record.inspector}</span>
                </div>
              )) : (
                <p style={styles.emptyText} className="text-sm text-gray-400 text-center py-4">No previous QC records.</p>
              )}
            </div>
          </div>

          {/* Parts Completion Card */}
          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-50">
              <Activity size={18} color="#3b82f6" />
              <h3 className="font-bold text-gray-900">Parts Completion</h3>
            </div>
            <div className="flex flex-col gap-4">
              {(job.parts || []).map((part, idx) => {
                const percent = part.requiredQty > 0 ? Math.round((part.completedQty / part.requiredQty) * 100) : 0;
                return (
                  <div key={part.id || idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-semibold text-gray-600">
                      <span>{part.name}</span>
                      <span className="text-blue-500">{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {(!job.parts || job.parts.length === 0) && (
                <p className="text-xs text-gray-400 italic">No parts defined for this job.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f5f6fa', padding: '32px', fontFamily: "'Inter', sans-serif" },
  header: { maxWidth: '1200px', margin: '0 auto 32px auto' },
  headerLeft: { display: 'flex', flexDirection: 'column', gap: '12px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '14px', fontWeight: '600', padding: 0 },
  headerTitleGroup: { display: 'flex', flexDirection: 'column' },
  title: { fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 },
  subtitle: { fontSize: '14px', color: '#6b7280', marginTop: '4px' },
  disabledBtn: { backgroundColor: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' },
  contentLayout: { display: 'grid', gap: '24px', maxWidth: '1200px', margin: '0 auto', gridTemplateColumns: '1fr 350px' },
  mainContent: { display: 'flex', flexDirection: 'column', gap: '24px' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#111827', margin: 0 },
  jobInfoGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' },
  inspectorGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  inputLabel: { fontSize: '12px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase' },
  label: { fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
  value: { fontSize: '14px', fontWeight: '600', color: '#111827' },
  badge: { padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '700' },
  input: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '14px', outline: 'none' },
  checklistHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  liveCount: { display: 'flex', gap: '16px', fontSize: '14px' },
  checklist: { display: 'flex', flexDirection: 'column', gap: '16px' },
  checkItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px', transition: 'all 0.2s' },
  checkMain: { display: 'flex', gap: '16px', alignItems: 'center' },
  checkBtn: { width: '22px', height: '22px', borderRadius: '4px', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', padding: 0 },
  checkLabel: { fontSize: '14px', fontWeight: '500' },
  checkInput: { flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', outline: 'none', backgroundColor: '#f9fafb' },
  reworkCard: { backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '16px', padding: '24px' },
  reworkHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  reworkTitle: { fontSize: '16px', fontWeight: '800', color: '#991b1b', margin: 0 },
  reworkDesc: { fontSize: '13px', color: '#b91c1c', marginBottom: '20px' },
  reworkForm: { display: 'flex', gap: '20px' },
  textarea: { padding: '12px', borderRadius: '8px', border: '1px solid #fca5a5', minHeight: '100px', outline: 'none', fontSize: '14px', width: '100%' },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #fca5a5', fontSize: '14px', backgroundColor: 'white', width: '100%' },
  errorText: { color: '#ef4444', fontSize: '12px', fontWeight: '600', marginTop: '12px' },
  buttonActionRow: { display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' },
  cancelBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#6b7280', fontWeight: '600', cursor: 'pointer' },
  reworkBtn: { padding: '12px 32px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: 'white', fontWeight: '700', cursor: 'pointer' },
  approveBtn: { padding: '12px 32px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: 'white', fontWeight: '700', cursor: 'pointer' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '24px' },
  sideCard: { backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  sideCardTitle: { fontSize: '15px', fontWeight: '700', color: '#111827', margin: 0 },
  historyList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  historyItem: { paddingBottom: '16px', borderBottom: '1px solid #f3f4f6' },
  historyTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  miniBadge: { padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase' },
  historyDate: { fontSize: '11px', color: '#9ca3af' },
  historyNotes: { fontSize: '12px', color: '#4b5563', margin: '0 0 4px 0', lineHeight: '1.4' },
  historyInspector: { fontSize: '11px', color: '#9ca3af', fontWeight: '500' },
  partsProgress: { display: 'flex', flexDirection: 'column', gap: '16px' },
  partItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
  partMeta: { display: 'flex', justifyContent: 'space-between' },
  partName: { fontSize: '12px', fontWeight: '600', color: '#4b5563' },
  partPercent: { fontSize: '12px', fontWeight: '700', color: '#3b82f6' },
  miniProgressBg: { height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' },
  miniProgressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: '3px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '12px', textAlign: 'left', fontSize: '12px', color: '#9ca3af', borderBottom: '1px solid #f3f4f6', fontWeight: '600', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '16px 12px', fontSize: '13px', color: '#4b5563' },
  tdBold: { padding: '16px 12px', fontSize: '13px', fontWeight: '600', color: '#111827' },
  tableBadge: { padding: '4px 10px', borderRadius: '50px', fontSize: '11px', fontWeight: '700' },
  tableProgressWrapper: { display: 'flex', alignItems: 'center', gap: '10px', width: '120px' },
  tableProgressBg: { flex: 1, height: '6px', backgroundColor: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' },
  tableProgressFill: { height: '100%', borderRadius: '3px' },
  tableProgressText: { fontSize: '12px', fontWeight: '700', color: '#111827' },
  emptyText: { fontSize: '13px', color: '#9ca3af', textAlign: 'center', margin: '20px 0' }
};

export default QualityCheck;
