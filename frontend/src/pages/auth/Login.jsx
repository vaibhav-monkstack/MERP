// Import React and useState hook for managing component state
import React, { useState } from 'react';
// Import axios for making HTTP API requests to the backend
import axios from 'axios';
// Import useNavigate for programmatic page navigation
import { useNavigate } from 'react-router-dom';
// Import icons from lucide-react for visual elements
import { Factory, Eye, EyeOff } from 'lucide-react';
import { ROLES } from '../../utils/constants';

// ============================================================
// LOGIN PAGE — Authentication screen for all platform roles
// Users enter email and password. Role is determined by the server.
// On success, a JWT token is stored in localStorage for future API requests.
// ============================================================

const Login = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(ROLES.JOB_MANAGER); // UI display role
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle the login form submission
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

      // Send POST request to the login API endpoint
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username: email,   // Validated by server
        password: password
      });

      const { token, role: userRole, userId, userName } = response.data;
      
      // Store auth data
      localStorage.setItem('token', token);
      localStorage.setItem('role', userRole);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userName', userName);

      // Redirect map based on verified server role
      const redirectionMap = {
        [ROLES.JOB_MANAGER]: '/jobs',
        [ROLES.ORDER_MANAGER]: '/orders',
        [ROLES.INVENTORY_MANAGER]: '/inventory',
        [ROLES.PRODUCTION_STAFF]: '/jobs/worker'
      };

      const targetPath = redirectionMap[userRole] || '/login';
      navigate(targetPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fill in demo credentials
  const setDemoCredentials = (type) => {
    const demos = {
      'job-manager': { email: 'admin@factory.com', pass: 'admin123', role: ROLES.JOB_MANAGER },
      'order-manager': { email: 'order@factory.com', pass: 'order123', role: ROLES.ORDER_MANAGER },
      'inventory-manager': { email: 'inventory@factory.com', pass: 'inventory123', role: ROLES.INVENTORY_MANAGER },
      'worker': { email: 'worker@factory.com', pass: 'worker123', role: ROLES.PRODUCTION_STAFF }
    };

    const demo = demos[type];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.pass);
      setRole(demo.role);
    }
  };

  // === RENDER — The login page UI ===
  return (
    <div style={styles.container} className="container">
      {/* App branding header with factory icon */}
      <div style={styles.headerContainer}>
        <div style={styles.iconCircle}>
          <Factory size={32} color="#2563eb" />
        </div>
        <h1 style={styles.title}>Manufacturing Company</h1>
        <p style={styles.subtitle}>Manufacturing Operations Platform</p>
      </div>

      {/* Login card with form */}
      <div style={styles.card}>
        <h2 style={styles.cardHeading}>Welcome Back</h2>
        <p style={styles.cardSubtext}>Sign in to access your dashboard</p>

        {/* Error message display (only shown when there's an error) */}
        {error && <div style={styles.errorBox}>{error}</div>}

        {/* Login form */}
        <form onSubmit={handleLogin} style={styles.form}>
          {/* Email input field */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="your.email@factory.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {/* Password input field with show/hide toggle */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'} // Toggle between hidden and visible
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
              {/* Eye icon button to toggle password visibility */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
              </button>
            </div>
          </div>

          {/* Role selection dropdown */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Login As</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={styles.select}
            >
              <option value="Job Manager">Job Manager</option>
              <option value="Order Manager">Order Manager</option>
              <option value="Inventory Manager">Inventory Manager</option>
              <option value="Production Staff">Production Staff</option>
            </select>
          </div>

          {/* Submit button — shows "Signing In..." while loading */}
          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {/* Demo credentials section — quick buttons to fill in test credentials */}
        <div style={styles.demoSection}>
          <p style={styles.demoLabel}>Demo Credentials:</p>
          <div style={styles.demoButtonsContainer} className="stack-on-mobile">
            {/* Job Manager Demo */}
            <button onClick={() => setDemoCredentials('job-manager')} style={styles.demoButton}>
              Job Mgr
            </button>
            {/* Order Manager Demo */}
            <button onClick={() => setDemoCredentials('order-manager')} style={styles.demoButton}>
              Order Mgr
            </button>
            {/* Inventory Manager Demo */}
            <button onClick={() => setDemoCredentials('inventory-manager')} style={styles.demoButton}>
              Inv Mgr
            </button>
            {/* Worker Demo */}
            <button onClick={() => setDemoCredentials('worker')} style={styles.demoButton}>
              Staff
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 Manufacturing Operations Platform</p>
        <p>Job Management Module v1.0</p>
      </footer>
    </div>
  );
};

// ============================================================
// STYLES — CSS-in-JS style definitions for the Login page
// ============================================================
const styles = {
  // Full-page container — centers the login card vertically and horizontally
  container: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', backgroundColor: '#f3f4f6' },
  // Header section containing the app logo and title
  headerContainer: { textAlign: 'center', marginBottom: '32px' },
  // Circular icon container for the factory logo
  iconCircle: { width: '64px', height: '64px', backgroundColor: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  // Main app title text
  title: { fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' },
  // Subtitle text below the title
  subtitle: { fontSize: '14px', color: '#6b7280', fontWeight: '500' },
  // White card container for the login form
  card: { width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' },
  // Card heading ("Welcome Back")
  cardHeading: { fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '8px', textAlign: 'center' },
  // Card subtext description
  cardSubtext: { fontSize: '14px', color: '#6b7280', textAlign: 'center', marginBottom: '32px' },
  // Red error box for displaying login errors
  errorBox: { backgroundColor: '#fef2f2', color: '#b91c1c', padding: '12px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px', textAlign: 'center', border: '1px solid #fee2e2' },
  // Form layout — vertical flex with gap
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  // Input group — label + input pair
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  // Input label text
  label: { fontSize: '14px', fontWeight: '600', color: '#374151' },
  // Text input styling
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none', transition: 'border-color 0.2s' },
  // Password field wrapper for positioning the eye icon
  passwordWrapper: { position: 'relative', display: 'flex', flexDirection: 'column' },
  // Eye toggle button for password visibility
  eyeButton: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' },
  // Role selection dropdown
  select: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px', backgroundColor: 'white', outline: 'none' },
  // Blue submit button
  submitButton: { backgroundColor: '#2563eb', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', marginTop: '8px', transition: 'background-color 0.2s' },
  // Demo credentials section container
  demoSection: { marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', textAlign: 'center' },
  // "DEMO CREDENTIALS" label
  demoLabel: { fontSize: '13px', fontWeight: '600', color: '#9ca3af', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  // Container for demo buttons — displayed side-by-side
  demoButtonsContainer: { display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' },
  // Individual demo button style
  demoButton: { flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #e5e7eb', backgroundColor: 'white', color: '#4b5563', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxSizing: 'border-box' },
  // Footer text styling
  footer: { marginTop: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' },
};

// Export the Login component as default
export default Login;
