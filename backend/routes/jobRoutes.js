// Import Express framework for creating route handlers
const express = require('express');
// Create a new Express Router instance
const router = express.Router();
// Import the job controller which handles all job-related operations
const jobController = require('../controllers/jobController');
// Import the auth middleware — ALL job routes require authentication
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/jobs — Fetch all manufacturing jobs (with their parts)
router.get('/', authMiddleware, jobController.getJobs);
// GET /api/jobs/pending-orders — Fetch orders ready for production
router.get('/pending-orders', authMiddleware, jobController.getPendingOrders);
// POST /api/jobs — Create a new manufacturing job
router.post('/', authMiddleware, jobController.createJob);
// PUT /api/jobs/:id — Update an existing job (status, progress, etc.)
router.put('/:id', authMiddleware, jobController.updateJob);
// GET /api/jobs/preview-init/:orderId — Dry-run of the production plan
router.get('/preview-init/:orderId', authMiddleware, jobController.getJobPreview);
// POST /api/jobs/manual-init/:orderId — Manually convert order to job
router.post('/manual-init/:orderId', authMiddleware, jobController.initializeJobFromOrder);
// POST /api/jobs/:id/approve — Formally approve a pending job
router.post('/:id/approve', authMiddleware, jobController.approveJob);
// DELETE /api/jobs/:id — Delete a job permanently
router.delete('/:id', authMiddleware, jobController.deleteJob);

// Export the router so it can be mounted in app.js at /api/jobs
module.exports = router;
