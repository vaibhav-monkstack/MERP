const express = require('express');
const router  = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware     = require('../middleware/authMiddleware');

// GET  /api/schedule/:jobId — Fetch schedule + material request status for a job
router.get('/:jobId',    authMiddleware, scheduleController.getSchedule);

// POST /api/schedule/:jobId — Generate auto-schedule for a job (Job Manager only)
router.post('/:jobId',   authMiddleware, scheduleController.generateSchedule);

// DELETE /api/schedule/:jobId — Clear all scheduled tasks for a job
router.delete('/:jobId', authMiddleware, scheduleController.clearSchedule);

module.exports = router;
