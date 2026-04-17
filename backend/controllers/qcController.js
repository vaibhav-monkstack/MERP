// Import the database connection pool for running queries
const pool = require('../config/db');

// ============================================================
// QC CONTROLLER — Handles Quality Check record operations
// QC records track inspection results for jobs (Pass/Fail),
// including inspector info, date, checklist scores, and notes
// ============================================================

// GET ALL QC RECORDS — Fetches every QC record, newest first
// Called when GET /api/qc is hit
exports.getQCRecords = async (req, res) => {
  try {
    // Fetch all QC records ordered by ID descending (newest first)
    const [records] = await pool.query('SELECT * FROM qc_records ORDER BY id DESC');
    res.json(records); // Return the array of records
  } catch (error) {
    console.error('Error fetching QC records:', error);
    res.status(500).json({ message: 'Error fetching QC records' });
  }
};

// GET QC RECORDS BY JOB ID — Fetches only the QC records for a specific job
// Called when GET /api/qc/job/:jobId is hit (e.g., GET /api/qc/job/JOB-001)
exports.getQCRecordsByJobId = async (req, res) => {
  const { jobId } = req.params; // Extract the job ID from the URL parameter
  try {
    // Query for records matching this specific job, newest first
    const [records] = await pool.query('SELECT * FROM qc_records WHERE jobId = ? ORDER BY id DESC', [jobId]);
    res.json(records); // Return the filtered array
  } catch (error) {
    console.error('Error fetching QC records by job id:', error);
    res.status(500).json({ message: 'Error fetching QC records' });
  }
};

// ADD QC RECORD — Creates a new quality check inspection record
// Called when POST /api/qc is hit
// The request body should contain: jobId, inspector, date, result, passed, total, notes
exports.addQCRecord = async (req, res) => {
  const record = req.body; // Get the QC record data from the request body
  
  try {
    // Insert the new QC record into the qc_records table
    const [result] = await pool.query(
      'INSERT INTO qc_records (jobId, inspector, date, result, passed, total, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [record.jobId, record.inspector, record.date, record.result, record.passed, record.total, record.notes]
    );

    // Get the auto-generated ID of the newly inserted record
    const newRecordId = result.insertId;
    // Fetch the complete record from the database to return it
    const [newRecords] = await pool.query('SELECT * FROM qc_records WHERE id = ?', [newRecordId]);
    
    // Return 201 Created with the complete record data
    res.status(201).json({
      message: 'QC Record created successfully',
      record: newRecords[0]
    });

    // === AUTOMATIC REWORK HANDLING ===
    if (record.result === 'Fail') {
      try {
        console.log(`QC Failed for job ${record.jobId}. Resetting tasks to Pending...`);
        
        // 1. Reset all production tasks to 'Pending'
        await pool.query(
          "UPDATE tasks SET status = 'Pending', startTime = NULL, completedTime = NULL, duration = '-' WHERE jobId = ?",
          [record.jobId]
        );

        // 2. Ensure job status is 'Rework' (though frontend usually sends this, backend ensures it)
        await pool.query(
          "UPDATE jobs SET status = 'Rework' WHERE id = ?",
          [record.jobId]
        );
      } catch (err) {
        console.error('Error during automatic rework reset:', err);
      }
    }
  } catch (error) {
    console.error('Error creating QC record:', error);
    res.status(500).json({ message: 'Error creating QC record' });
  }
};
