// Import React Router components for client-side navigation
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';

// Import the JobProvider context which provides global job state to all pages
import { JobProvider } from './context/JobContext';

// Import all page components — each represents a different screen in the app
import Login from './pages/auth/Login';                       // Login page for authentication
import ManagerDashboard from './pages/jobs/ManagerDashboard'; // Job Manager's main dashboard
import WorkerDashboard from './pages/jobs/WorkerDashboard';   // Production Staff's personal dashboard
import WorkerTaskPanel from './pages/jobs/WorkerTaskPanel';   // Detailed task view for a specific job
import CreateJob from './pages/jobs/CreateJob';               // Form to create a new manufacturing job
import JobTracking from './pages/jobs/JobTracking';           // Detailed view of a specific job's progress
import QualityCheck from './pages/jobs/QualityCheck';         // Quality check inspection page
import Rework from './pages/jobs/Rework';                     // Rework order submission page
import EditJob from './pages/jobs/EditJob';                   // Form to edit an existing job
import ManageTeams from './pages/jobs/ManageTeams';           // Team and worker management page
import ProtectedRoute from './components/ProtectedRoute'; // RBAC protection component

// --- MODULE GATEWAY APPS ---
import InventoryApp from './pages/InventoryApp';
import OrderApp from './pages/OrderApp';
import JobsApp from './pages/JobsApp';

// --- UNIFIED NAVBAR ---
import UnifiedNavbar from './components/UnifiedNavbar';

// Main App component — defines the application's routing structure
function App() {
  return (
    // JobProvider wraps everything so all pages can access shared job data
    <JobProvider>
      {/* Router enables client-side navigation without full page reloads */}
      <Router>
        {/* Global Unified Navbar */}
        <UnifiedNavbar />

        {/* Routes container — only one Route matches at a time based on the current URL */}
        <Routes>
          {/* Public route — Login page */}
          <Route path="/login" element={<Login />} />
          
          {/* Jobs Module — Unifies Dashboard, Creating Jobs, Teams, and Worker Interface */}
          <Route path="/jobs/*" element={
            <ProtectedRoute allowedRoles={['Job Manager', 'Production Staff']}>
              <JobsApp />
            </ProtectedRoute>
          } />

          {/* Legacy Path Redirects (Backward Compatibility) */}
          <Route path="/manager-dashboard" element={<Navigate to="/jobs" replace />} />
          <Route path="/worker-dashboard" element={<Navigate to="/jobs/worker" replace />} />
          <Route path="/worker" element={<Navigate to="/jobs/worker" replace />} />
          <Route path="/manage-teams" element={<Navigate to="/jobs/teams" replace />} />
          <Route path="/create-job" element={<Navigate to="/jobs/new" replace />} />
          <Route path="/job/:id/*" element={<LegacyJobRedirect />} />

          {/* Inventory Module — Strictly for Inventory Managers */}
          <Route path="/inventory/*" element={
            <ProtectedRoute allowedRoles={['Inventory Manager']}>
              <InventoryApp />
            </ProtectedRoute>
          } />

          {/* Customer Orders Module — Strictly for Order Managers */}
          <Route path="/orders/*" element={
            <ProtectedRoute allowedRoles={['Order Manager']}>
              <OrderApp />
            </ProtectedRoute>
          } />

          {/* Root Redirection Logic */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </JobProvider>
  );
}

// Internal component to handle parameterized legacy redirects for jobs
const LegacyJobRedirect = () => {
  const { id } = useParams();
  const location = useLocation();
  const subPath = location.pathname.split(`/job/${id}`)[1] || '';
  return <Navigate to={`/jobs/${id}${subPath}`} replace />;
};

export default App;
