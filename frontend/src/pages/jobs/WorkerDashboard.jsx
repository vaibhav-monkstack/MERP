import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LogOut,
  ClipboardList,
  Clock,
  CheckCircle,
  Play,
  Check,
  Filter,
  ChevronDown
} from 'lucide-react';

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const token = localStorage.getItem('token');
  const userName = localStorage.getItem('userName') || 'Worker';
  const userId = localStorage.getItem('userId');

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom dropdown state
  const [filter, setFilter] = useState('All Tasks');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    if (!token || role !== 'Production Staff') {
      navigate('/login');
      return;
    }
    fetchData();

    // Click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [token, role, navigate]);

  const fetchData = async () => {
    try {
      const taskRes = await axios.get(
        `${API_BASE}/tasks?worker=${encodeURIComponent(userName)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTasks(taskRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const response = await axios.put(
        `${API_BASE}/tasks/${taskId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedTask = response.data.task;
      setTasks(prev =>
        prev.map(task =>
          task.taskId === taskId ? { ...task, ...updatedTask } : task
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const pendingCount = tasks.filter(t => t.status === 'Pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  const filteredTasks = tasks.filter(task => {
    if (filter === 'All Tasks') return true;
    return task.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 text-base font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans text-slate-800">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 h-[70px] flex items-center justify-between px-6 md:px-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 leading-tight">Production Staff Dashboard</h1>
          <p className="text-sm text-gray-500">Worker Interface</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold text-sm">
              {getInitials(userName)}
            </div>
            <span className="font-medium text-gray-800">{userName}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 py-6 md:py-8 space-y-6">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <ClipboardList size={24} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Pending Tasks</p>
                <p className="text-3xl font-semibold text-gray-900">{pendingCount}</p>
              </div>
            </div>
          </div>

          {/* In Progress Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Clock size={24} className="text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6B7280]">In Progress</p>
                <p className="text-3xl font-semibold text-[#3B82F6]">{inProgressCount}</p>
              </div>
            </div>
          </div>

          {/* Completed Card */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle size={24} className="text-[#22C55E]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Completed</p>
                <p className="text-3xl font-semibold text-[#22C55E]">{completedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mt-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-lg font-semibold text-gray-900">My Assigned Tasks</h2>
            
            {/* Filter Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center justify-between w-40 px-3 py-2 bg-white border border-[#E5E7EB] rounded-md text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <span className="flex items-center gap-2">
                  <Filter size={14} className="text-gray-500" />
                  {filter}
                </span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-md shadow-md z-10 py-1">
                  {['All Tasks', 'Pending', 'In Progress', 'Completed'].map((option) => (
                    <button
                      key={option}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${filter === option ? 'bg-gray-50 font-medium text-blue-600' : 'text-gray-700'}`}
                      onClick={() => {
                        setFilter(option);
                        setIsDropdownOpen(false);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
              <thead>
                <tr className="bg-[#F9FAFB] text-gray-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium rounded-tl-md">Task ID</th>
                  <th className="px-4 py-3 font-medium">Job ID</th>
                  <th className="px-4 py-3 font-medium">Job Name</th>
                  <th className="px-4 py-3 font-medium">Part Name</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Deadline</th>
                  <th className="px-4 py-3 font-medium rounded-tr-md">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.taskId} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 font-medium">{task.taskId}</td>
                      <td className="px-4 py-3 text-gray-500">{task.jobId}</td>
                      <td className="px-4 py-3 text-gray-700">{task.jobName}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{task.partName}</td>
                      <td className="px-4 py-3">
                        {task.status === 'Pending' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#FEF3C7] text-[#92400E]">
                            Pending
                          </span>
                        )}
                        {task.status === 'In Progress' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#DBEAFE] text-[#1D4ED8]">
                            In Progress
                          </span>
                        )}
                        {task.status === 'Completed' && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#DCFCE7] text-[#166534]">
                            Completed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {task.deadline || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        {task.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusChange(task.taskId, 'In Progress')}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-medium rounded-md transition-colors w-24"
                          >
                            <Play size={12} fill="currentColor" />
                            Start
                          </button>
                        )}
                        {task.status === 'In Progress' && (
                          <button
                            onClick={() => handleStatusChange(task.taskId, 'Completed')}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#22C55E] hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors w-24"
                          >
                            <Check size={14} />
                            Finish
                          </button>
                        )}
                        {task.status === 'Completed' && (
                          <span className="text-gray-400 text-xs italic pl-2 text-center w-24 block">No action</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Task Instructions Box */}
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-md p-4 mt-6">
          <h3 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
            Task Instructions
          </h3>
          <ul className="list-disc list-inside text-sm text-blue-900 space-y-1">
            <li>Click "Start" to begin working on a pending task</li>
            <li>Click "Finish" when you complete an in-progress task</li>
            <li>Completed tasks are automatically recorded with timestamps</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
