// Import React Router components for client-side navigation
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import the JobProvider context which provides global job state to all pages
import { JobProvider } from './context/JobContext';

// Import all page components — each represents a different screen in the app
import Login from './pages/Login';                       // Login page for authentication
import ManagerDashboard from './pages/ManagerDashboard'; // Job Manager's main dashboard
import WorkerDashboard from './pages/WorkerDashboard';   // Production Staff's personal dashboard
import WorkerTaskPanel from './pages/WorkerTaskPanel';   // Detailed task view for a specific job
import CreateJob from './pages/CreateJob';               // Form to create a new manufacturing job
import JobTracking from './pages/JobTracking';           // Detailed view of a specific job's progress
import QualityCheck from './pages/QualityCheck';         // Quality check inspection page
import Rework from './pages/Rework';                     // Rework order submission page
import EditJob from './pages/EditJob';                   // Form to edit an existing job
import ManageTeams from './pages/ManageTeams';           // Team and worker management page
import ProtectedRoute from './components/ProtectedRoute'; // RBAC protection component

// --- INVENTORY APP ---
import InventoryApp from './inventory/InventoryApp';

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
          
          {/* Job Manager routes — Strictly for Job Managers */}
          <Route path="/manager-dashboard" element={
            <ProtectedRoute allowedRoles={['Job Manager']}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/manage-teams" element={
            <ProtectedRoute allowedRoles={['Job Manager']}>
              <ManageTeams />
            </ProtectedRoute>
          } />
          <Route path="/create-job" element={
            <ProtectedRoute allowedRoles={['Job Manager']}>
              <CreateJob />
            </ProtectedRoute>
          } />
          <Route path="/jobs/:id/edit" element={
            <ProtectedRoute allowedRoles={['Job Manager']}>
              <EditJob />
            </ProtectedRoute>
          } />
          
          {/* Production Staff routes — Strictly for workers */}
          <Route path="/worker-dashboard" element={
            <ProtectedRoute allowedRoles={['Production Staff']}>
              <WorkerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/worker" element={<Navigate to="/worker-dashboard" replace />} />
          
          {/* Shared Production Tracking routes — Accessible by Both */}
          <Route path="/job/:id" element={
            <ProtectedRoute allowedRoles={['Job Manager', 'Production Staff']}>
              <JobTracking />
            </ProtectedRoute>
          } />
          <Route path="/job/:id/qc" element={
            <ProtectedRoute allowedRoles={['Job Manager', 'Production Staff']}>
              <QualityCheck />
            </ProtectedRoute>
          } />
          <Route path="/job/:id/rework" element={
            <ProtectedRoute allowedRoles={['Job Manager', 'Production Staff']}>
              <Rework />
            </ProtectedRoute>
          } />
          <Route path="/job/:id/tasks" element={
            <ProtectedRoute allowedRoles={['Job Manager', 'Production Staff']}>
              <WorkerTaskPanel />
            </ProtectedRoute>
          } />
          
          {/* Inventory App Portal — Inventory Manager only */}
          <Route path="/inventory/*" element={
            <ProtectedRoute allowedRoles={['Inventory Manager']}>
              <InventoryApp />
            </ProtectedRoute>
          } />

          {/* Root Redirection Logic */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </JobProvider>
  );
}

export default App;
