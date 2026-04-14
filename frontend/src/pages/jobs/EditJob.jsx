// Import React hooks for state and lifecycle management
import React, { useState, useEffect } from 'react';
// Import navigation and URL parameter hooks
import { useNavigate, useParams } from 'react-router-dom';
// Import the shared job context to read and update job data
import { useJobs } from '../../context/JobContext';
// Import icons used in the edit form UI
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';

// ============================================================
// EDIT JOB PAGE — Form for editing an existing manufacturing job
// Pre-populates with the current job data and allows modifying
// product info, team assignment, priority, deadline, and parts.
// ============================================================

const EditJob = () => {
  const { id } = useParams();                  // Get the job ID from the URL parameter
  const navigate = useNavigate();               // Hook for page navigation
  const { getJobById, updateJob } = useJobs();  // Get job read/update functions from context
  
  // Form state — stores all editable job fields
  const [formData, setFormData] = useState({
    product: '',      // Product name
    quantity: '',      // Manufacturing quantity
    team: '',          // Assigned team
    deadline: '',      // Production deadline
    priority: '',      // Priority level
    notes: '',         // Special instructions
    parts: []          // Array of parts/components
  });

  const [loading, setLoading] = useState(true); // Loading state while fetching job data

  // On mount: fetch the job data and populate the form fields
  useEffect(() => {
    const job = getJobById(id);  // Look up the job by ID
    if (job) {
      // Pre-populate the form with existing job data
      setFormData({
        product: job.product || '',
        quantity: job.quantity || '',
        team: job.team || '',
        deadline: job.deadline || '',
        priority: job.priority || 'Medium',
        notes: job.notes || '',
        parts: job.parts || []
      });
      setLoading(false); // Mark loading as complete
    }
  }, [id, getJobById]);

  // Validate form — checks that all required fields are filled and at least one part exists
  const isFormValid = () => {
    const basicInfoValid = 
      formData.product && 
      formData.quantity && 
      formData.team && 
      formData.deadline && 
      formData.priority;
    
    // Every part must have a name and required quantity
    const partsValid = formData.parts.length > 0 && 
      formData.parts.every(part => part.name && part.requiredQty);

    return basicInfoValid && partsValid;
  };

  // Handle form submission — updates the job via API and redirects
  const handleUpdate = (e) => {
    e.preventDefault();           // Prevent default form submission
    if (!isFormValid()) return;   // Don't submit if validation fails
    
    updateJob(id, formData);       // Send the updated data to the backend
    navigate('/jobs'); // Redirect to the dashboard
  };

  // Add a new empty part to the parts list
  const addPart = () => {
    setFormData({
      ...formData,
      parts: [...formData.parts, { id: Date.now(), name: '', requiredQty: '' }]
    });
  };

  // Remove a part from the parts list by its ID
  const removePart = (partId) => {
    setFormData({
      ...formData,
      parts: formData.parts.filter(p => p.id !== partId)
    });
  };

  // Update a specific field of a specific part
  const updatePart = (partId, field, value) => {
    setFormData({
      ...formData,
      parts: formData.parts.map(p => p.id === partId ? { ...p, [field]: value } : p)
    });
  };

  // Show loading state while job data is being fetched
  if (loading) return <div style={styles.container}>Loading job details...</div>;

  return (
    <div style={styles.container} className="container">
      <header style={styles.header} className="stack-on-mobile">
        <div style={styles.headerTop}>
          <button onClick={() => navigate('/jobs')} style={styles.backBtn}>
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 style={styles.title}>Edit Job</h1>
        </div>
      </header>

      <form onSubmit={handleUpdate} style={styles.formContainer}>
        {/* BASIC INFORMATION CARD */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Basic Information</h2>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Product Name <span style={styles.required}>*</span></label>
            <input 
              type="text" 
              placeholder="Enter product name" 
              style={styles.input} 
              value={formData.product}
              onChange={(e) => setFormData({...formData, product: e.target.value})}
              required
            />
          </div>

          <div style={styles.row} className="responsive-grid-2">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Quantity <span style={styles.required}>*</span></label>
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
              <label style={styles.label}>Assigned Team <span style={styles.required}>*</span></label>
              <select 
                style={styles.select}
                value={formData.team}
                onChange={(e) => setFormData({...formData, team: e.target.value})}
                required
              >
                <option value="">Select Team</option>
                <option value="Team Alpha">Team Alpha</option>
                <option value="Team Beta">Team Beta</option>
                <option value="Team Gamma">Team Gamma</option>
                <option value="Team Delta">Team Delta</option>
              </select>
            </div>
          </div>

          <div style={styles.row} className="responsive-grid-2">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Deadline <span style={styles.required}>*</span></label>
              <input 
                type="date" 
                style={styles.input} 
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Priority <span style={styles.required}>*</span></label>
              <select 
                style={styles.select}
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Notes</label>
            <textarea 
              placeholder="Add any special instructions..." 
              style={styles.textarea}
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>
        </div>

        {/* PARTS & COMPONENTS CARD */}
        <div style={{ ...styles.card, marginTop: '24px' }}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>Parts & Components</h2>
            <button type="button" onClick={addPart} style={styles.addPartBtn}>
              <Plus size={16} />
              <span>Add Part</span>
            </button>
          </div>

          <div style={styles.partsList}>
            {formData.parts.map((part) => (
              <div key={part.id} style={styles.partRow} className="stack-on-mobile" >
                <div style={{ ...styles.inputGroup, flex: 2 }} className="full-width-on-mobile">
                  <label style={styles.label}>Part Name <span style={styles.required}>*</span></label>
                  <input 
                    type="text" 
                    placeholder="e.g., Motor Housing" 
                    style={styles.input} 
                    value={part.name}
                    onChange={(e) => updatePart(part.id, 'name', e.target.value)}
                    required
                  />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }} className="full-width-on-mobile">
                  <label style={styles.label}>Required Qty <span style={styles.required}>*</span></label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    style={styles.input} 
                    value={part.requiredQty}
                    onChange={(e) => updatePart(part.id, 'requiredQty', e.target.value)}
                    required
                  />
                </div>
                <button 
                  type="button" 
                  onClick={() => removePart(part.id)} 
                  style={styles.deleteBtn}
                >
                  <Trash2 size={18} color="#EF4444" />
                </button>
              </div>
            ))}
            {formData.parts.length === 0 && (
              <div style={styles.emptyParts}>No parts added. Add at least one part.</div>
            )}
          </div>
        </div>

        <div style={styles.formActions}>
          <button 
            type="submit" 
            disabled={!isFormValid()} 
            style={{
              ...styles.submitBtn,
              backgroundColor: isFormValid() ? '#3B82F6' : '#9CA3AF',
              cursor: isFormValid() ? 'pointer' : 'not-allowed'
            }}
          >
            Update Job
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', backgroundColor: '#F4F5F7', padding: '40px', fontFamily: "'Inter', sans-serif" },
  header: { maxWidth: '800px', margin: '0 auto 32px auto' },
  headerTop: { display: 'flex', alignItems: 'center', gap: '32px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontWeight: '600', padding: 0 },
  title: { fontSize: '28px', fontWeight: '800', color: '#111827', margin: 0 },
  formContainer: { maxWidth: '800px', margin: '0 auto' },
  card: { backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0, marginBottom: '24px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  required: { color: '#EF4444' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '14px', color: '#111827' },
  select: { padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '14px', backgroundColor: 'white', color: '#111827' },
  textarea: { padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', outline: 'none', fontSize: '14px', minHeight: '100px', fontFamily: 'inherit' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  addPartBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px solid #3B82F6', color: '#3B82F6', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  partsList: { display: 'flex', flexDirection: 'column', gap: '8px' },
  partRow: { display: 'flex', alignItems: 'flex-end', gap: '16px', backgroundColor: '#F9FAFB', padding: '16px', borderRadius: '12px', border: '1px solid #F3F4F6' },
  deleteBtn: { background: 'none', border: 'none', padding: '10px', cursor: 'pointer', marginBottom: '20px' },
  emptyParts: { textAlign: 'center', padding: '20px', color: '#6b7280', fontSize: '14px', backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px dashed #D1D5DB' },
  formActions: { display: 'flex', justifyContent: 'flex-end', marginTop: '32px' },
  submitBtn: { padding: '14px 40px', borderRadius: '8px', border: 'none', color: 'white', fontWeight: '700', fontSize: '16px', transition: 'all 0.2s' },
};

export default EditJob;
