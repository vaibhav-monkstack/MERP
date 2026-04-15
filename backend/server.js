require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');

// Database Connections
const db = require('./config/db'); // MySQL2 promise pool

// Route imports
const ordersRoutes      = require('./routes/orders');
const invOrdersRoutes   = require('./routes/invOrdersRoutes');
const materialsRoutes   = require('./routes/materialsRoutes');
const suppliersRoutes   = require('./routes/suppliersRoutes');
const requestsRoutes    = require('./routes/requestsRoutes');
const reportsRoutes     = require('./routes/reportsRoutes');

const jobRoutes         = require('./routes/jobRoutes');
const taskRoutes        = require('./routes/taskRoutes');
const teamRoutes        = require('./routes/teamRoutes');
const authRoutes        = require('./routes/authRoutes');
const qcRoutes          = require('./routes/qcRoutes'); 
const customersRoutes   = require('./routes/customers');
const templateRoutes    = require('./routes/templateRoutes');
const scheduleRoutes    = require('./routes/scheduleRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://manufacturing-company-website-1.onrender.com',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({ 
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }, 
  credentials: true 
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.locals.db = db;

// Basic health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 📦 Order Management
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);

// 📋 Inventory Management
app.use('/api/materials', materialsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/inv-orders', invOrdersRoutes);
app.use('/api/reports', reportsRoutes);

// 🔧 Job Management
app.use('/api/jobs', jobRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/qc', qcRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/schedule',  scheduleRoutes);

// 404 & Error Handling
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
