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
  const { jobs, deleteJob, loading, pendingOrders } = useJobs();
  // Local state for the filtered/searched list of jobs shown in the table
  const [filteredJobs, setFilteredJobs] = useState([]);
  // Search input text
  const [searchTerm, setSearchTerm] = useState('');
  // Dropdown filter for job status
  const [statusFilter, setStatusFilter] = useState('All Status');
  // Dropdown filter for job priority
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  
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
    let result = [...jobs];

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

        {/* INCOMING ORDERS SECTION (OMS REFLECTION) */}
        {pendingOrders && pendingOrders.length > 0 && (
          <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-amber-100 p-1.5 rounded-lg">
                <ShoppingCart size={18} className="text-amber-600" />
              </div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Orders Ready for Production</h2>
              <span className="bg-amber-100 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ml-1">
                {pendingOrders.length} New
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {pendingOrders.map((order) => (
                <div 
                  key={order.orderId} 
                  className="bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:border-amber-200 transition-all duration-300 group relative overflow-hidden flex flex-col"
                >
                  {/* Status Bar */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-amber-400 opacity-20 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="p-7 flex-1 flex flex-col">
                    {/* Header: ID and Priority */}
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incoming Order</span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">ID #{order.orderId}</span>
                        </div>
                      </div>
                      <div className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        order.priority === 'urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                        order.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-slate-50 text-slate-500 border-slate-100'
                      }`}>
                        {order.priority}
                      </div>
                    </div>

                    {/* Product Name */}
                    <div className="mb-6">
                      <div className="flex items-center gap-2 mb-1.5 text-amber-600">
                        <Package size={14} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Production Item</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors uppercase">
                        {order.item_name}
                      </h3>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-4 mb-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <User size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Customer</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700 truncate">{order.customer_name}</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Hash size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Quantity</span>
                        </div>
                        <span className="text-sm font-bold text-slate-700">{order.quantity} Units</span>
                      </div>

                      <div className="flex flex-col gap-1 col-span-2 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200 group-hover:border-amber-200 group-hover:bg-amber-50/30 transition-colors">
                        <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-amber-600">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Target Deadline</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">
                          {order.deadline ? new Date(order.deadline).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Not Set'}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button 
                      onClick={() => navigate('/jobs/new', { state: { fromOrder: order } })}
                      className="mt-auto w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-amber-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-slate-200 hover:shadow-amber-200"
                    >
                      <Plus size={16} strokeWidth={3} />
                      <span>Release to Production</span>
                    </button>
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
                  <option>Production</option>
                  <option>Assembly</option>
                  <option>Created</option>
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
