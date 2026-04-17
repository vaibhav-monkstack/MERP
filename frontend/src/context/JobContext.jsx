// Import React hooks and utilities needed for context management
import React, { createContext, useState, useContext, useEffect } from 'react';
// Import axios for making HTTP API requests to the backend
import axios from 'axios';
// Import toast for notifications
import toast from 'react-hot-toast';

// Create a React Context — this is a way to share data across components without prop drilling
// Any component wrapped in JobProvider can access this context's values
const JobContext = createContext();

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Custom hook — makes it easy to access the JobContext from any component
// Usage: const { jobs, addJob, updateJob } = useJobs();
export const useJobs = () => useContext(JobContext);

// JobProvider component — wraps the entire app and provides shared state for jobs and QC records
export const JobProvider = ({ children }) => {
  // State for storing the array of manufacturing jobs fetched from the backend
  const [jobs, setJobs] = useState([]);
  // State for storing pagination metadata
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  // State for storing quality check records
  const [qcRecords, setQCRecords] = useState([]);
  // State for storing orders that can be converted to jobs
  const [pendingOrders, setPendingOrders] = useState([]);
  // Loading state — true while initial data is being fetched
  const [loading, setLoading] = useState(true);

  // Function to fetch data — now supports params for pagination and search
  const fetchData = async (params = {}) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const config = { 
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 1000, ...params } // Default to high limit for now, allow overrides
        };
        
        const [jobsRes, qcRes] = await Promise.all([
          axios.get(`${API_BASE}/jobs`, config),
          axios.get(`${API_BASE}/qc`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: [] }))
        ]);
        
        // Handle paginated or non-paginated response gracefully
        if (jobsRes.data.jobs) {
          setJobs(jobsRes.data.jobs);
          setPagination(jobsRes.data.pagination);
        } else {
          setJobs(jobsRes.data);
        }
        
        setQCRecords(qcRes.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPendingOrders(); // Also fetch pending orders on load
  }, []);

  // FETCH PENDING ORDERS — Gets confirmed orders from OMS ready for job conversion
  const fetchPendingOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${API_BASE}/jobs/pending-orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPendingOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    }
  };

  // ADD JOB — Creates a new job via the backend API and adds it to local state
  const addJob = async (jobData) => {
    try {
      const token = localStorage.getItem('token'); // Get auth token
      if (token) {
        // Send POST request to create the job on the backend
        const response = await axios.post(`${API_BASE}/jobs`, jobData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Add the newly created job to the local state array
        setJobs(prev => [...prev, response.data.job]);
        toast.success('Job created successfully!');
        return response.data.job; // Return the created job for the caller to use
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job.');
      throw error; // Re-throw so the calling component can handle the error
    }
  };

  // UPDATE JOB — Updates a job's fields via the backend API and updates local state
  const updateJob = async (id, updatedData) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Send PUT request to update the job on the backend
        await axios.put(`${API_BASE}/jobs/${id}`, updatedData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Update the job in local state
        setJobs(prev => prev.map(job => job.id === id ? { ...job, ...updatedData } : job));
        toast.success('Job updated successfully!');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      toast.error('Failed to update job.');
      throw error;
    }
  };

  // DELETE JOB — Deletes a job via the backend API and removes it from local state
  const deleteJob = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Send DELETE request to remove the job from the backend database
        await axios.delete(`${API_BASE}/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Remove the job from local state by filtering it out
        setJobs(prev => prev.filter(job => job.id !== id));
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      throw error;
    }
  };

  // APPROVE JOB — Formally approves a pending job
  const approveJob = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_BASE}/jobs/${id}/approve`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Update local status to 'Production'
        setJobs(prev => prev.map(job => job.id === id ? { ...job, status: 'Production' } : job));
        toast.success(`Job ${id} approved! Production started.`);
      }
    } catch (error) {
      console.error('Error approving job:', error);
      toast.error('Failed to approve job.');
      throw error;
    }
  };

  // GET JOB BY ID — Finds a specific job from the local state array
  // This doesn't make an API call — it searches the already-loaded jobs
  const getJobById = (id) => jobs.find(job => job.id === id);

  // ADD QC RECORD — Creates a new quality check record via the backend API
  const addQCRecord = async (record) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Send POST request to create the QC record
        const response = await axios.post(`${API_BASE}/qc`, record, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Add the new record to the beginning of the local state array (newest first)
        setQCRecords(prev => [response.data.record, ...prev]);
        toast.success('Quality check record saved!');
        return response.data.record;
      }
    } catch (error) {
      console.error('Error adding QC Record:', error);
      toast.error('Failed to save quality check.');
      throw error;
    }
  };

  // GET QC RECORDS BY JOB ID — Filters QC records for a specific job from local state
  const getQCRecordsByJobId = (jobId) => qcRecords.filter(r => r.jobId === jobId);

  // GET JOB PREVIEW — Fetch a dry-run production plan for an order
  const getJobPreview = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${API_BASE}/jobs/preview-init/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.data;
      }
    } catch (error) {
      console.error('Error fetching job preview:', error);
      toast.error('Failed to load job plan preview');
      throw error;
    }
  };

  // CREATE JOB FROM ORDER — Manually convert confirmed order to production job
  const createJobFromOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(`${API_BASE}/jobs/manual-init/${orderId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success(`Job initialized for Order #${orderId}!`);
        // Refresh jobs and pending orders
        await fetchData();
        await fetchPendingOrders();
      }
    } catch (error) {
      console.error('Error creating job from order:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize job');
      throw error;
    }
  };

  // Provide all the state and functions to child components via Context
  return (
    <JobContext.Provider value={{ 
      jobs,                   // Array of all manufacturing jobs
      loading,                // Boolean indicating if initial data is still loading
      addJob,                 // Function to create a new job
      updateJob,              // Function to update an existing job
      deleteJob,              // Function to delete a job
      getJobById,             // Function to find a job by its ID
      qcRecords,              // Array of all quality check records
      addQCRecord,            // Function to create a new QC record
      getQCRecordsByJobId,    // Function to filter QC records by job ID
      pendingOrders,          // Array of confirmed orders ready for conversion
      fetchPendingOrders,     // Function to refresh pending orders list
      approveJob,              // Function to formally approve a pending job
      createJobFromOrder,      // Function to manually initialize job from order
      getJobPreview           // Function to preview job plan before initialization
    }}>
      {children}  {/* Render all child components inside the provider */}
    </JobContext.Provider>
  );
};
