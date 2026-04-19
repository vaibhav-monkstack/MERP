import React, { useState, useEffect } from 'react';
// Import useNavigate and useLocation for routing and state access
import { useNavigate, useLocation } from 'react-router-dom';
// Import the useJobs hook to access the addJob function from JobContext
import { useJobs } from '../../context/JobContext';
// Import icons
import { ArrowLeft, Layers, Zap } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// ============================================================
// CREATE JOB PAGE — Form for creating a new manufacturing job
// Job Managers use this page to define new jobs with product details,
// team assignment, priority level, and deadline.
// ============================================================

const CreateJob = () => {
  const navigate = useNavigate();   // Hook for page navigation
  const location = useLocation();   // Hook to access navigation state (for pre-filling)
  const { addJob, fetchPendingOrders } = useJobs();     // Get functions from context

  // Local state for teams fetched from the backend
  const [availableTeams, setAvailableTeams] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Template state
  const [templates, setTemplates] = useState([]);
  const [templateLoaded, setTemplateLoaded] = useState(false);
  const [templateName, setTemplateName] = useState('');

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
    parts: [],             // List of components for the job
    orderId: null          // Source Order ID (if applicable)
  });

  // Fetch all templates once on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/templates`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setTemplates(d.data || []))
      .catch(console.error);
  }, []);

  // Helper: apply a template, scaling parts by order quantity
  const applyTemplate = (template, qty) => {
    if (!template) return;
    const scaledParts = template.parts.map(p => ({
      name: p.part_name,
      requiredQty: Math.ceil(parseFloat(p.qty_per_unit) * parseFloat(qty || 1))
    }));
    setFormData(prev => ({ ...prev, parts: scaledParts }));
    setTemplateName(template.name);
    setTemplateLoaded(true);
  };

  // Effect to handle incoming state from the Dashboard (conversion from Order)
  useEffect(() => {
    if (location.state && location.state.fromOrder) {
      const order = location.state.fromOrder;
      
      const priorityMap = {
        'urgent': 'Urgent', 'high': 'High', 'medium': 'Medium', 'low': 'Low'
      };

      const qty = order.quantity;
      setFormData(prev => ({
        ...prev,
        product: order.item_name,
        quantity: qty,
        priority: priorityMap[order.priority] || 'Medium',
        deadline: order.deadline ? new Date(order.deadline).toISOString().split('T')[0] : '',
        orderId: order.orderId,
        notes: `Automatically generated from Order #${order.orderId} for ${order.customer_name}.`
      }));

      // Auto-match template by product name
      const token = localStorage.getItem('token');
      fetch(`${API_BASE}/templates/match/${encodeURIComponent(order.item_name)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(d => { if (d.data) applyTemplate(d.data, qty); })
        .catch(console.error);
    }
  }, [location, templates]);

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
      await fetchPendingOrders();         // Refresh the pending orders list
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
        <h1 style={styles.title}>
          {formData.orderId ? `Convert Order #${formData.orderId} to Job` : 'Create New Job'}
        </h1>
      </header>

      {/* Template auto-load banner */}
      {templateLoaded && (
        <div style={styles.templateBanner}>
          <Zap size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
          <span><strong>BOM Auto-Loaded:</strong> Components for <em>{templateName}</em> have been pre-filled and scaled to quantity {formData.quantity}.</span>
        </div>
      )}

      {/* Form card */}
      <div style={styles.card}>
        {/* Manual Template Picker (only shown if not from an order) */}
        {!formData.orderId && templates.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="template-select" style={styles.label}>
              <Layers size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Load from Product Template
            </label>
            <select
              id="template-select"
              style={styles.select}
              value={templateName}
              onChange={e => {
                const t = templates.find(t => t.name === e.target.value);
                if (t) applyTemplate(t, formData.quantity || 1);
                else { setTemplateName(''); setTemplateLoaded(false); }
              }}
            >
              <option value="">— Select a template to auto-fill parts —</option>
              {templates.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
        )}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Product name input */}
          <div style={styles.inputGroup}>
            <label htmlFor="product" style={styles.label}>Product Name</label>
            <input 
              id="product"
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
              <label htmlFor="quantity" style={styles.label}>Quantity</label>
              <input 
                id="quantity"
                type="number" 
                placeholder="0" 
                style={styles.input} 
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label htmlFor="team" style={styles.label}>Team</label>
              <select 
                id="team"
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
              <label htmlFor="priority" style={styles.label}>Priority</label>
              <select 
                id="priority"
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
              <label htmlFor="deadline" style={styles.label}>Deadline</label>
              <input 
                id="deadline"
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
            <label htmlFor="notes" style={styles.label}>Special Instructions / Notes</label>
            <textarea 
              id="notes"
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
  header: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#4b5563', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  title: { fontSize: '24px', fontWeight: '700', color: '#111827' },
  templateBanner: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', maxWidth: '600px', margin: '0 auto 20px', fontSize: '13px', color: '#15803d' },
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
