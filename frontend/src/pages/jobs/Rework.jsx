// Import React and useState for managing the reason input field
import React, { useState } from 'react';
// Import URL param extraction (useParams) and navigation (useNavigate) hooks
import { useParams, useNavigate } from 'react-router-dom';
// Import the shared job context to read job data and update job status
import { useJobs } from '../../context/JobContext';
// Import icons for the page header and rework icon
import { RefreshCw, ArrowLeft } from 'lucide-react';

// ============================================================
// REWORK PAGE — Allows submitting a rework order for a failed QC job
// When submitted, the job's status changes to "Rework" and progress is reduced.
// This is an alternative entry point for rework (the primary flow is through QualityCheck.jsx)
// ============================================================

const Rework = () => {
  const { id } = useParams();                 // Extract the job ID from the URL (e.g., /job/JOB-001/rework)
  const navigate = useNavigate();              // Hook for navigating to other pages
  const { getJobById, updateJob } = useJobs(); // Get job lookup and update functions from context
  const job = getJobById(id);                  // Find this job by its ID in the context state
  const [reason, setReason] = useState('');    // State for the defect description text input

  // If the job ID doesn't match any job, show an error message
  if (!job) return <div style={{ padding: '40px' }}>Job not found.</div>;

  // Handle rework form submission
  const handleSubmitRework = (e) => {
    e.preventDefault(); // Prevent default form submission
    // Update the job: set status to "Rework" and reduce progress by 20%
    // Math.max ensures progress doesn't go below 10%
    updateJob(id, { status: 'Rework', progress: Math.max(job.progress - 20, 10) });
    navigate(`/jobs/${id}`); // Navigate back to the job tracking page
  };

  // === RENDER — Rework order form ===
  return (
    <div style={styles.container} className="container">
      {/* Header with back button and page title */}
      <header style={styles.header} className="stack-on-mobile">
        <button onClick={() => navigate(`/qc/${id}`)} style={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Quality Check</span>
        </button>
        <h1 style={styles.title}>Rework Order: {job.id}</h1>
      </header>

      {/* Rework order card */}
      <div style={styles.card} className="full-width-on-mobile">
        {/* Red refresh icon indicating rework */}
        <div style={styles.iconCircle}>
          <RefreshCw size={32} color="#991b1b" />
        </div>
        <h2 style={styles.cardTitle}>Issue Identified</h2>
        <p style={styles.cardSub}>Please describe the defects found and instructions for rework.</p>

        {/* Rework form with defect description text area */}
        <form onSubmit={handleSubmitRework} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Defect Details</label>
            <textarea 
              style={styles.textarea} 
              placeholder="Explain what needs to be fixed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            ></textarea>
          </div>

          {/* Submit button — triggers the rework status update */}
          <button type="submit" style={styles.submitBtn}>Submit Rework Order</button>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// STYLES — CSS-in-JS style definitions for the Rework page
// Uses a red color scheme to indicate the critical nature of rework
// ============================================================
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#fef2f2', padding: '40px' },              // Red-tinted background
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: '700' },
  title: { fontSize: '24px', fontWeight: '800', color: '#991b1b' },                            // Red title text
  card: { backgroundColor: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(153, 27, 27, 0.1)', maxWidth: '600px', width: '100%', margin: '0 auto', textAlign: 'center', boxSizing: 'border-box' },
  iconCircle: { width: '64px', height: '64px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' },
  cardTitle: { fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '8px' },
  cardSub: { fontSize: '14px', color: '#6b7280', marginBottom: '32px' },
  form: { textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  textarea: { padding: '16px', borderRadius: '12px', border: '1px solid #fee2e2', backgroundColor: '#fff5f5', minHeight: '120px', outline: 'none', fontSize: '14px' },
  submitBtn: { padding: '16px', borderRadius: '12px', border: 'none', backgroundColor: '#991b1b', color: 'white', fontWeight: '700', fontSize: '16px', cursor: 'pointer' }
};

// Export the Rework component as default
export default Rework;
