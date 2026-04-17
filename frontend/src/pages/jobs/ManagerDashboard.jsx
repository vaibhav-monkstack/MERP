// Import React hooks for state management and side effects
import React, { useState, useEffect } from 'react';
// Import navigation hook for page redirects
import { useNavigate } from 'react-router-dom';
// Import the shared job context to access job data and operations
import { useJobs } from '../../context/JobContext';
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
  ShoppingCart,  // Incoming orders icon
  User,          // Customer icon
  Package,       // Product icon
  Hash,          // Quantity icon
  Calendar,      // Deadline icon
  ChevronDown,   // Expand icon
  ChevronUp,     // Collapse icon
  Truck,         // Materials icon
  Users,         // Assignments icon
} from 'lucide-react';

// Shared Components
import TopHeader from '../../components/TopHeader';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';

// Import toast for notifications
import toast from 'react-hot-toast';

const ManagerDashboard = () => {
  // Get jobs data and operations from the shared context
  const { 
    jobs, deleteJob, loading, approveJob, 
    pendingOrders, createJobFromOrder, getJobPreview 
  } = useJobs();
  // Local state for the filtered/searched list of jobs shown in the table
  const [filteredJobs, setFilteredJobs] = useState([]);
  // Search input text
  const [searchTerm, setSearchTerm] = useState('');
  // Dropdown filter for job status
  const [statusFilter, setStatusFilter] = useState('All Status');
  // Dropdown filter for job priority
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  
  // State for expanded orders in the "Incoming" section
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [previews, setPreviews] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Separate jobs pending approval
  const jobsPendingApproval = jobs.filter(j => j.status === 'Pending Approval');
  const activeJobs = jobs.filter(j => j.status !== 'Pending Approval');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' });
  
  const navigate = useNavigate();
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
    if (window.confirm('Are you sure you want to delete this job permanently?')) {
      try {
        await deleteJob(jobId);
        toast.success('Job deleted successfully');
      } catch (error) {
        toast.error('Failed to delete job');
      }
    }
  };

  // Handle toggling the preview expansion and fetching details
  const toggleOrderPreview = async (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      return;
    }
    
    setExpandedOrder(orderId);
    
    if (!previews[orderId]) {
      try {
        setPreviewLoading(true);
        const data = await getJobPreview(orderId);
        setPreviews(prev => ({ ...prev, [orderId]: data }));
      } catch (err) {
        console.error("Preview failed:", err);
        setPreviews(prev => ({ ...prev, [orderId]: { error: err.response?.data?.message || 'Failed to load details' } }));
      } finally {
        setPreviewLoading(false);
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
    let result = [...activeJobs];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(job => 
        job.product.toLowerCase().includes(lowerSearch) ||
        job.team.toLowerCase().includes(lowerSearch) ||
        job.id.toLowerCase().includes(lowerSearch)
      );
    }

    if (statusFilter !== 'All Status') {
      result = result.filter(job => job.status === statusFilter);
    }

    if (priorityFilter !== 'All Priorities') {
      result = result.filter(job => job.priority === priorityFilter);
    }

    result.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'progress' || sortConfig.key === 'quantity') {
        valA = Number(valA);
        valB = Number(valB);
      }
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredJobs(result);
  }, [searchTerm, statusFilter, priorityFilter, jobs, sortConfig]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  // Table Headers Definition
  const tableHeaders = [
    { key: 'id', label: 'Job ID', sortable: true },
    { key: 'product', label: 'Product', sortable: true },
    { key: 'quantity', label: 'Qty', sortable: true },
    { key: 'team', label: 'Team', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'priority', label: 'Priority', sortable: true },
    { key: 'progress', label: 'Progress', sortable: true },
    { key: 'deadline', label: 'Deadline', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false, align: 'right' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="container-custom py-8">
        
        {/* HEADER */}
        <TopHeader 
          title="Job Management" 
          subtitle="Real-time monitoring and production control"
        />

        {/* STATS ROW */}
        <div className="stat-grid mb-10">
          <StatCard 
            title="Total Jobs" 
            value={jobs.length} 
            description="All jobs in system" 
            icon={Briefcase} 
            iconColor="#6366f1"
          />
          <StatCard 
            title="In Progress" 
            value={jobs.filter(j => j.status !== 'Completed' && j.status !== 'Created').length} 
            description="Currently active" 
            icon={Clock} 
            iconColor="#3b82f6"
          />
          <StatCard 
            title="Completed" 
            value={jobs.filter(j => j.status === 'Completed').length} 
            description="Finished jobs" 
            icon={CheckCircle} 
            iconColor="#10b981"
          />
          <StatCard 
            title="Overdue" 
            value={jobs.filter(j => {
              if (!j.deadline || j.status === 'Completed') return false;
              const deadlineDate = new Date(j.deadline);
              deadlineDate.setHours(23, 59, 59, 999);
              return new Date() > deadlineDate;
            }).length} 
            description="Past deadline" 
            icon={AlertCircle} 
            iconColor="#f43f5e"
          />
        </div>

        {/* INCOMING PRODUCTION ORDERS (MANUAL INITIALIZATION) */}
        {pendingOrders.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2 mb-4 px-2">
              <div className="bg-indigo-100 p-1.5 rounded-lg flex items-center justify-center">
                <ShoppingCart size={18} className="text-indigo-600" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase">Incoming Production Orders</h2>
              <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-indigo-700 text-[10px] font-black uppercase tracking-widest leading-none">
                  {pendingOrders.length} Ready to Initialize
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <th className="px-8 py-5">Order Context</th>
                      <th className="px-8 py-5">Customer Profile</th>
                      <th className="px-8 py-5">System Plan</th>
                      <th className="px-8 py-5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingOrders.map((order) => (
                      <React.Fragment key={order.orderId}>
                        <tr className={`group transition-all duration-300 ${expandedOrder === order.orderId ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${expandedOrder === order.orderId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-900 text-white'}`}>
                                <Package size={22} strokeWidth={2.5} />
                              </div>
                              <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 flex items-center gap-1.5">
                                  <span>Order #{order.orderId}</span>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-base font-black text-slate-900 uppercase leading-tight tracking-tight">{order.item_name}</div>
                                <div className="text-[10px] font-bold text-slate-500 mt-1.5 flex items-center gap-2">
                                  <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-slate-600 uppercase">Qty: {order.quantity}</span>
                                  <span className={`px-2 py-0.5 rounded-md border text-[9px] uppercase font-black tracking-widest ${
                                    order.priority === 'Urgent' ? 'bg-rose-50 border-rose-100 text-rose-600' : 
                                    order.priority === 'High' ? 'bg-amber-50 border-amber-100 text-amber-600' : 
                                    'bg-slate-100 border-slate-200 text-slate-500'
                                  }`}>{order.priority}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors shadow-sm">
                                <User size={16} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{order.customer_name}</span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Production</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <button 
                              onClick={() => toggleOrderPreview(order.orderId)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                expandedOrder === order.orderId 
                                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm'
                              }`}
                            >
                              {expandedOrder === order.orderId ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
                              <span>{expandedOrder === order.orderId ? 'Hide Plan' : 'Preview Plan'}</span>
                            </button>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => createJobFromOrder(order.orderId)}
                              className="bg-indigo-600 text-white px-7 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-[1.05] active:scale-[0.95] transition-all shadow-xl shadow-indigo-100 flex items-center gap-2 ml-auto"
                            >
                              <Plus size={16} strokeWidth={3} />
                              <span>Initialize Job</span>
                            </button>
                          </td>
                        </tr>

                        {/* EXPANDED PREVIEW CONTENT */}
                        {expandedOrder === order.orderId && (
                          <tr>
                            <td colSpan="4" className="bg-indigo-50/20 px-12 py-8 border-b border-indigo-100/50">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-top-2 duration-500">
                                
                                {/* MATERIALS PREVIEW */}
                                <div>
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-white p-1.5 rounded-lg border border-indigo-100 text-indigo-600 shadow-sm">
                                      <Truck size={14} />
                                    </div>
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Material Requirements</h4>
                                  </div>
                                  
                                  {previewLoading ? (
                                    <div className="flex items-center gap-3 py-4 text-slate-400 italic text-xs">
                                      <div className="w-3 h-3 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                      Calculating inventory needs...
                                    </div>
                                  ) : previews[order.orderId] ? (
                                    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                                      <table className="w-full text-left text-xs uppercase font-bold">
                                        <thead className="bg-slate-50 text-slate-400 text-[9px] tracking-tighter">
                                          <tr>
                                            <th className="px-4 py-2.5">Component</th>
                                            <th className="px-4 py-2.5 text-right">Required Qty</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 text-slate-700">
                                          {previews[order.orderId].parts.map((part, idx) => (
                                            <tr key={idx}>
                                              <td className="px-4 py-3">{part.name}</td>
                                              <td className="px-4 py-3 text-right text-indigo-600 font-black">{part.requiredQty}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  ) : previews[order.orderId] && previews[order.orderId].error ? (
                                    <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] font-bold text-rose-600 uppercase">
                                      <AlertCircle size={14} />
                                      <span>{previews[order.orderId].error}</span>
                                    </div>
                                  ) : <div className="text-xs text-rose-500">Failed to load preview</div>}
                                </div>

                                {/* ASSIGNMENT PREVIEW */}
                                <div>
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="bg-white p-1.5 rounded-lg border border-indigo-100 text-indigo-600 shadow-sm">
                                      <Users size={14} />
                                    </div>
                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Task Assignment Plan</h4>
                                  </div>
                                  
                                  {previewLoading ? (
                                    <div className="flex items-center gap-3 py-4 text-slate-400 italic text-xs">
                                      <div className="w-3 h-3 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                                      Assigning production team...
                                    </div>
                                  ) : previews[order.orderId] ? (
                                    <div className="space-y-2">
                                      {previews[order.orderId].tasks.map((task, idx) => (
                                        <div key={idx} className="bg-white border border-slate-100 rounded-xl p-3 flex justify-between items-center hover:border-indigo-200 transition-colors shadow-sm">
                                          <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] font-black text-slate-900 uppercase mb-0.5">{task.partName}</span>
                                            <span className="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
                                              <Calendar size={10} />
                                              Deadline: {task.deadline}
                                            </span>
                                          </div>
                                          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-2">
                                            <div className="w-5 h-5 bg-indigo-600 text-white rounded flex items-center justify-center text-[9px] font-bold">
                                              {task.workerName.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{task.workerName}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : previews[order.orderId] && previews[order.orderId].error ? (
                                    <div className="flex items-center gap-2 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-[10px] font-bold text-rose-600 uppercase">
                                      <AlertCircle size={14} />
                                      <span>Template Missing</span>
                                    </div>
                                  ) : <div className="text-xs text-rose-500">Failed to load assignment pre-plan</div>}
                                </div>

                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* JOBS PENDING APPROVAL SECTION */}
        {jobsPendingApproval.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-amber-100 p-1.5 rounded-lg">
                <ShoppingCart size={18} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Jobs Awaiting Approval</h2>
              <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
                {jobsPendingApproval.length} New
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobsPendingApproval.map((job) => (
                <div 
                  key={job.id} 
                  className="bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-amber-200 transition-all duration-300 group relative overflow-hidden flex flex-col"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="p-7 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Auto-Generated Job</span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">ID #{job.id}</span>
                        </div>
                      </div>
                      <div className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        job.priority === 'Urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        job.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {job.priority}
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1.5 text-amber-600">
                        <Package size={14} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Product</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors uppercase">
                        {job.product}
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 mb-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <User size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Order ID</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 truncate">#{job.orderId || 'Manual'}</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Hash size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Quantity</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700">{job.quantity} Units</span>
                      </div>

                      <div className="flex flex-col gap-1 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200 group-hover:border-amber-200 group-hover:bg-amber-50/30 transition-colors">
                        <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-amber-600">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Deadline</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">
                          {job.deadline ? new Date(job.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not Set'}
                        </span>
                      </div>
                    </div>

                    {/* JOB PLAN DETAILS (PARTS & TASKS) */}
                    <div className="mb-8 space-y-4">
                      {/* Materials Preview Mini */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Truck size={12} className="text-indigo-600" strokeWidth={3} />
                          <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Material Forecast</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {job.parts && job.parts.map((p, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] bg-white px-2 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                              <span className="text-slate-500 font-bold truncate pr-1">{p.name}</span>
                              <span className="text-indigo-600 font-black">{p.requiredQty}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tasks Preview Mini */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Users size={12} className="text-indigo-600" strokeWidth={3} />
                          <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Worker Assignment Plan</span>
                        </div>
                        <div className="space-y-2">
                          {job.tasks && job.tasks.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white px-2.5 py-2 rounded-xl border border-slate-100 shadow-sm">
                              <span className="text-[10px] font-black text-slate-900 truncate pr-2 uppercase">{t.partName}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">{t.worker}</span>
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => approveJob(job.id)}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-100"
                      >
                        <CheckCircle size={16} strokeWidth={3} />
                        <span>Approve Plan</span>
                      </button>
                      <button 
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all font-bold"
                        title="Review Details"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MAIN CONTENT CARD */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Job List</h2>
              <button 
                className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate('/jobs/new')}
              >
                <Plus size={18} strokeWidth={3} />
                <span>Create New Job</span>
              </button>
            </div>

            {/* FILTERS */}
            <div className="controls-responsive">
              <div className="relative flex-1 group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search products, teams, or IDs..." 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-transparent rounded-2xl text-sm focus:border-indigo-500 focus:bg-white transition-all font-medium outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <select 
                  className="bg-slate-50 border-2 border-transparent rounded-2xl text-sm py-3 px-4 font-bold text-slate-600 focus:border-indigo-500 focus:bg-white outline-none"
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All Status</option>
                  <option>Pending Approval</option>
                  <option>Created</option>
                  <option>Production</option>
                  <option>Assembly</option>
                  <option>QC</option>
                  <option>Rework</option>
                  <option>Completed</option>
                </select>
                <select 
                  className="bg-slate-50 border-2 border-transparent rounded-2xl text-sm py-3 px-4 font-bold text-slate-600 focus:border-indigo-500 focus:bg-white outline-none"
                  value={priorityFilter} 
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option>All Priorities</option>
                  <option>Urgent</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
          </div>

          <DataTable 
            headers={tableHeaders}
            data={filteredJobs}
            onSort={handleSort}
            sortConfig={sortConfig}
            renderRow={(job) => (
              <tr 
                key={job.id} 
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group border-b border-slate-50 last:border-none"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <td className="px-6 py-5 text-xs font-black text-slate-400 font-mono">{job.id}</td>
                <td className="px-6 py-5 text-sm font-bold text-slate-900">{job.product}</td>
                <td className="px-6 py-5 text-sm font-bold text-slate-600">{job.quantity}</td>
                <td className="px-6 py-5 text-sm font-medium text-slate-500">{job.team}</td>
                <td className="px-6 py-5">
                  <StatusBadge status={job.status} />
                </td>
                <td className="px-6 py-5">
                  <div className={`text-[10px] font-black uppercase px-2 py-0.5 rounded inline-block ${
                    job.priority === 'Urgent' ? 'bg-rose-100 text-rose-600' :
                    job.priority === 'High' ? 'bg-slate-900 text-white' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {job.priority}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1.5 w-24">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                      <span>Progress</span>
                      <span className="text-slate-900">{job.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${job.progress}%` }}></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm font-bold text-slate-500 whitespace-nowrap">
                  {job.deadline ? new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </td>
                <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-100"
                    >
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => navigate(`/jobs/${job.id}/tasks`)}
                      className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-blue-600 border border-transparent hover:border-slate-100"
                    >
                      <BarChart2 size={16} />
                    </button>
                    <button 
                      onClick={() => navigate(`/jobs/${job.id}/edit`)}
                      className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteJob(job.id)}
                      className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-rose-600 border border-transparent hover:border-slate-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
