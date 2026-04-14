import React, { useState, useEffect } from 'react';
// Import useNavigate for redirecting after job creation
import { useNavigate } from 'react-router-dom';
// Import the useJobs hook to access the addJob function from JobContext
import { useJobs } from '../../context/JobContext';
// Import the back arrow icon for the navigation button
import { ArrowLeft } from 'lucide-react';

// ============================================================
// CREATE JOB PAGE — Form for creating a new manufacturing job
// Job Managers use this page to define new jobs with product details,
// team assignment, priority level, and deadline.
// ============================================================

const CreateJob = () => {
  const navigate = useNavigate();   // Hook for page navigation
  const { addJob } = useJobs();     // Get the addJob function from the shared context

  // Local state for teams fetched from the backend
  const [availableTeams, setAvailableTeams] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data state — stores all the fields for a new job
  const [formData, setFormData] = useState({
    product: '',          // Product name (e.g., "Circuit Board A")
    quantity: '',          // Number of units to manufacture
    team: '',              // Assigned team (e.g., "Team Alpha")
    status: 'Created',     // Initial status — always starts as "Created"
    priority: 'Medium',    // Default priority level
    progress: 0,           // Initial progress — starts at 0%
    deadline: '',          // Manufacturing deadline date
    notes: '',             // Special instructions or notes
    parts: []              // List of components for the job
  });

  // Fetch teams from the backend when the component mounts
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_BASE}/teams`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableTeams(data);
        }
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };
    fetchTeams();
  }, []);

  // Handle part addition
  const addPartField = () => {
    setFormData({
      ...formData,
      parts: [...formData.parts, { name: '', requiredQty: '' }]
    });
  };

  // Handle part removal
  const removePartField = (index) => {
    const newParts = [...formData.parts];
    newParts.splice(index, 1);
    setFormData({ ...formData, parts: newParts });
  };

  // Handle part change
  const handlePartChange = (index, field, value) => {
    const newParts = [...formData.parts];
    newParts[index][field] = value;
    setFormData({ ...formData, parts: newParts });
  };

  // Handle form submission — creates the job via API and redirects to dashboard
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission (page reload)
    
    // Prevent double submission
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await addJob(formData);             // Call the addJob function from JobContext
      navigate('/jobs');      // Redirect to the manager dashboard on success
    } catch (error) {
      console.error('Error creating job:', error); // Log any errors
      alert('Failed to create job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // === RENDER — Job creation form ===
  return (
    <div style={styles.container} className="container">
      {/* Header with back button and page title */}
      <header style={styles.header} className="stack-on-mobile">
        <button onClick={() => navigate('/jobs')} style={styles.backBtn}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>
        <h1 style={styles.title}>Create New Job</h1>
      </header>

      {/* Form card */}
      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Product name input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Product Name</label>
            <input 
              type="text" 
              placeholder="Enter product name" 
              style={styles.input} 
              value={formData.product}
              onChange={(e) => setFormData({...formData, product: e.target.value})}
              required
            />
          </div>

          {/* Quantity and Team — displayed side by side */}
          <div style={styles.row} className="responsive-grid-2">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Quantity</label>
              <input 
                type="number" 
                placeholder="0" 
                style={styles.input} 
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Team</label>
              <select 
                style={styles.select}
                value={formData.team}
                onChange={(e) => setFormData({...formData, team: e.target.value})}
                required
              >
                <option value="">Select Team</option>
                {availableTeams.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority and Deadline — displayed side by side */}
          <div style={styles.row} className="responsive-grid-2">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Priority</label>
              <select 
                style={styles.select}
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Deadline</label>
              <input 
                type="date" 
                style={styles.input} 
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                required
              />
            </div>
          </div>

          {/* Notes section */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Special Instructions / Notes</label>
            <textarea 
              placeholder="Enter any special handling instructions..." 
              style={styles.textarea}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          {/* Parts / Components Section */}
          <div style={styles.partsSection}>
            <div style={styles.partsHeader}>
              <label style={styles.label}>Manufacturing Components (Optional)</label>
              <button type="button" onClick={addPartField} style={styles.addPartBtn}>+ Add Component</button>
            </div>
            
            {formData.parts.map((part, index) => (
              <div key={index} style={styles.partRow}>
                <input 
                  type="text" 
                  placeholder="Component Name (e.g. Screen)" 
                  style={{ ...styles.input, flex: 2 }}
                  value={part.name}
                  onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                  required
                />
                <input 
                  type="number" 
                  placeholder="Qty" 
                  style={{ ...styles.input, flex: 1 }}
                  value={part.requiredQty}
                  onChange={(e) => handlePartChange(index, 'requiredQty', e.target.value)}
                  required
                />
                <button type="button" onClick={() => removePartField(index)} style={styles.removePartBtn}>×</button>
              </div>
            ))}
          </div>

          {/* Action buttons — Cancel and Create Job */}
          <div style={styles.buttonGroup} className="stack-on-mobile">
            <button type="button" onClick={() => navigate('/jobs')} style={styles.cancelBtn} className="full-width-on-mobile" disabled={isSubmitting}>Cancel</button>
            <button type="submit" style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1 }} className="full-width-on-mobile" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Job...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// STYLES — CSS-in-JS style definitions for the Create Job page
// ============================================================
const styles = {
  container: { minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '40px' },
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  title: { fontSize: '24px', fontWeight: '700', color: '#111827' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', maxWidth: '600px', margin: '0 auto' },
  form: { display: 'flex', flexDirection: 'column', gap: '24px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },   // Two-column layout
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },     // Label + input pair
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px' },
  textarea: { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px', minHeight: '80px', fontFamily: 'inherit' },
  select: { padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '14px', backgroundColor: 'white' },
  partsSection: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' },
  partsHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  addPartBtn: { padding: '4px 12px', borderRadius: '6px', border: '1px solid #2563eb', color: '#2563eb', backgroundColor: 'transparent', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  partRow: { display: 'flex', gap: '12px', alignItems: 'center' },
  removePartBtn: { width: '30px', height: '30px', borderRadius: '6px', border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
  cancelBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'white', color: '#4b5563', fontWeight: '600', cursor: 'pointer' },
  submitBtn: { padding: '12px 24px', borderRadius: '8px', border: 'none', backgroundColor: '#2563eb', color: 'white', fontWeight: '600', cursor: 'pointer' }
};

// Export the CreateJob component as default
export default CreateJob;
