import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ManagerDashboard from './jobs/ManagerDashboard';
import WorkerDashboard from './jobs/WorkerDashboard';
import WorkerTaskPanel from './jobs/WorkerTaskPanel';
import CreateJob from './jobs/CreateJob';
import JobTracking from './jobs/JobTracking';
import QualityCheck from './jobs/QualityCheck';
import Rework from './jobs/Rework';
import EditJob from './jobs/EditJob';
import ManageTeams from './jobs/ManageTeams';
import ProtectedRoute from '../components/ProtectedRoute';

const JobsApp = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Routes>
        {/* Main Dashboard - Redirects based on role are handled in ProtectedRoute, 
            but here we define the primary entry points */}
        
        {/* MANAGER VIEWS */}
        <Route index element={
          <ProtectedRoute allowedRoles={['Job Manager']}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="teams" element={
          <ProtectedRoute allowedRoles={['Job Manager']}>
            <ManageTeams />
          </ProtectedRoute>
        } />
        
        <Route path="new" element={
          <ProtectedRoute allowedRoles={['Job Manager']}>
            <CreateJob />
          </ProtectedRoute>
        } />
        
        <Route path=":id/edit" element={
          <ProtectedRoute allowedRoles={['Job Manager']}>
            <EditJob />
          </ProtectedRoute>
        } />

        {/* WORKER DASHBOARD */}
        <Route path="worker" element={
          <ProtectedRoute allowedRoles={['Production Staff']}>
            <WorkerDashboard />
          </ProtectedRoute>
        } />

        {/* SHARED TRACKING VIEWS (Accessible by Manager & Worker) */}
        <Route path=":id" element={
          <ProtectedRoute allowedRoles={['Job Manager', 'Production Staff']}>
            <JobTracking />
          </ProtectedRoute>
        } />
        
        <Route path=":id/qc" element={
          <ProtectedRoute allowedRoles={['Job Manager', 'Production Staff']}>
            <QualityCheck />
          </ProtectedRoute>
        } />
        
        <Route path=":id/rework" element={
          <ProtectedRoute allowedRoles={['Job Manager', 'Production Staff']}>
            <Rework />
          </ProtectedRoute>
        } />
        
        <Route path=":id/tasks" element={
          <ProtectedRoute allowedRoles={['Job Manager', 'Production Staff']}>
            <WorkerTaskPanel />
          </ProtectedRoute>
        } />

        {/* Default redirect for unknown sub-paths */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default JobsApp;
