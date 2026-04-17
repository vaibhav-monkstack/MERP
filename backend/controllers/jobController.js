// Import the database connection pool for running queries
const pool = require('../config/db');

// ============================================================
// JOB CONTROLLER — Handles CRUD operations for manufacturing jobs
// Jobs represent manufacturing orders with products, quantities,
// team assignments, statuses, priorities, and deadlines
// ============================================================

// GET ALL JOBS — Fetches jobs from the database with pagination and search
// Called when GET /api/jobs is hit (e.g., /api/jobs?page=1&limit=10&search=A)
exports.getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // High limit by default for now
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM jobs';
    let countQuery = 'SELECT COUNT(*) as total FROM jobs';
    let queryParams = [];
    let countParams = [];

    // Apply search filter if provided
    if (search) {
      const searchPattern = `%${search}%`;
      const filter = ' WHERE product LIKE ? OR team LIKE ? OR id LIKE ?';
      query += filter;
      countQuery += filter;
      queryParams = [searchPattern, searchPattern, searchPattern];
      countParams = [searchPattern, searchPattern, searchPattern];
    }

    // Add sorting (newest first by default) and pagination
    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    // Execute queries in parallel
    const [[jobs], [[{ total }]]] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, countParams)
    ]);
    
    // For each job, also fetch its associated parts from the job_parts table
    for (let job of jobs) {
      const [parts] = await pool.query('SELECT * FROM job_parts WHERE jobId = ?', [job.id]);
      job.parts = parts;
    }
    
    // Return jobs with pagination metadata
    res.json({
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Error fetching jobs' });
  }
};

// GET PENDING ORDERS — Fetches confirmed orders that haven't been converted to jobs
// Called when GET /api/jobs/pending-orders is hit
exports.getPendingOrders = async (req, res) => {
  try {
    // Select all confirmed orders that are NOT yet linked to any job
    const query = `
      SELECT o.id as orderId, o.customer_name, o.item_name, o.quantity, o.priority, o.deadline, o.created_at
      FROM orders o
      LEFT JOIN jobs j ON o.id = j.orderId
      WHERE o.status = 'confirmed' AND j.orderId IS NULL
      ORDER BY o.created_at ASC
    `;
    
    const [orders] = await pool.query(query);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    res.status(500).json({ message: 'Error fetching pending orders' });
  }
};

// CREATE JOB — Creates a new manufacturing job in the database
// Called when POST /api/jobs is hit
exports.createJob = async (req, res) => {
  const jobData = req.body; // Get the job details from the request body
  // Generate a unique job ID using the current timestamp (e.g., "JOB-1712345678901")
  const newJobId = `JOB-${Date.now()}`;

  // Set defaults for optional fields if they weren't provided
  const status = jobData.status || 'Created';     // New jobs start in "Created" status
  const priority = jobData.priority || 'Medium';   // Default priority is "Medium"
  const progress = jobData.progress || 0;           // Initial progress is 0%
  
  try {
    // Insert the new job into the jobs table (added 'notes', 'alert', and 'orderId')
    await pool.query(
      'INSERT INTO jobs (id, product, quantity, team, status, priority, progress, deadline, notes, alert, orderId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [newJobId, jobData.product, jobData.quantity, jobData.team, status, priority, progress, jobData.deadline, jobData.notes || '', '', jobData.orderId || null]
    );

    // If this job was created from an order, update the original order's status to 'processing'
    if (jobData.orderId) {
      await pool.query('UPDATE orders SET status = "processing" WHERE id = ?', [jobData.orderId]);
      
      // Also log the history for the order
      await pool.query('INSERT INTO order_history (order_id, status, remarks) VALUES (?, ?, ?)', 
        [jobData.orderId, 'processing', `Job created: ${newJobId}`]);
      
      console.log(`Syncing status for order ${jobData.orderId} to 'processing'`);
    }

    // Insert any parts associated with this job into the job_parts table
    const parts = jobData.parts || []; // Default to empty array if no parts provided
    for (const part of parts) {
      await pool.query(
        'INSERT INTO job_parts (jobId, name, requiredQty) VALUES (?, ?, ?)',
        [newJobId, part.name, part.requiredQty]
      );
    }

    // STAGE B: Auto-generate a material request in Inventory for each part
    // This creates a "Pending" request so the Inventory team is notified automatically
    // ✅ IMPORTANT: Requests are created REGARDLESS of material availability
    // Availability check happens during APPROVAL, not creation
    const materialsUnavailable = []; // Track any materials not available (for job alert)
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const requestId = `REQ-${Date.now()}-${i}`; // Unique ID per request
      const requestedBy = req.user ? req.user.name : 'Job Manager';
      
      // ✅ Check material availability (for alert purposes only, doesn't block request creation)
      const [materialCheck] = await pool.query(
        'SELECT * FROM materials WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1',
        [part.name]
      );
      
      if (materialCheck.length === 0) {
        materialsUnavailable.push(`"${part.name}" - Not found in inventory`);
      } else {
        const material = materialCheck[0];
        const availableQty = Number(material.quantity || 0);
        const requiredQty = Number(part.requiredQty || 0);
        
        if (availableQty < requiredQty) {
          materialsUnavailable.push(`"${part.name}" - Need ${requiredQty} units, only ${availableQty} available`);
        }
      }
      
      // ✅ CREATE REQUEST REGARDLESS OF AVAILABILITY
      // The inventory manager will see it and can reject if material is not available
      await pool.query(
        'INSERT INTO requests (request_id, job_id, material, quantity, requested_by) VALUES (?, ?, ?, ?, ?)',
        [requestId, newJobId, part.name, part.requiredQty, requestedBy]
      );
      console.log(`✅ Request created: ${requestId} for ${part.requiredQty} units of "${part.name}"`);
    }
    
    if (parts.length > 0) {
      console.log(`✅ Created ${parts.length} material request(s) for job ${newJobId}`);
    }
    
    // ⚠️ NEW: Alert user if any materials were unavailable
    if (materialsUnavailable.length > 0) {
      await pool.query(
        'UPDATE jobs SET alert=? WHERE id=?',
        [`Material shortage: ${materialsUnavailable.join(', ')}`, newJobId]
      );
      console.warn(`⚠️  Job ${newJobId} has material shortages: ${materialsUnavailable.join(', ')}`);
    }

    console.log('Creating new job in DB:', newJobId); // Log for tracking

    // Fetch the newly created job back from the database to return it
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [newJobId]);
    const job = jobs[0];
    // Also fetch its parts
    const [jobParts] = await pool.query('SELECT * FROM job_parts WHERE jobId = ?', [newJobId]);
    job.parts = jobParts; // Attach parts to the job object

    // Return 201 Created status with the complete job data
    res.status(201).json({
      message: 'Job created successfully',
      job: job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Error creating job' });
  }
};

// UPDATE JOB — Updates specific fields of an existing job
// Called when PUT /api/jobs/:id is hit (e.g., PUT /api/jobs/JOB-123)
exports.updateJob = async (req, res) => {
  const { id } = req.params;       // Get the job ID from the URL parameter
  const updatedData = req.body;     // Get the fields to update from the request body

  try {
    // Build the SQL UPDATE query dynamically based on which fields were provided
    // This allows partial updates (only change what was sent)
    const fieldsToUpdate = []; // Array of "fieldName = ?" strings
    const values = [];          // Array of corresponding values

    // List of fields that are allowed to be updated
    const updatableFields = ['product', 'quantity', 'team', 'status', 'priority', 'progress', 'deadline', 'notes', 'alert'];
    for (const field of updatableFields) {
      // Only include fields that were actually provided in the request
      if (updatedData[field] !== undefined) {
        fieldsToUpdate.push(`${field} = ?`);  // Add to the SET clause
        values.push(updatedData[field]);       // Add to the values array
      }
    }

    // Only run the UPDATE query if there are fields to update
    if (fieldsToUpdate.length > 0) {
      values.push(id); // Add the job ID for the WHERE clause
      // Build and execute the dynamic UPDATE query
      await pool.query(`UPDATE jobs SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, values);
      console.log(`Updated job ${id} with:`, updatedData); // Log for tracking
    }

    // Return success response
    res.json({
      message: `Job ${id} updated successfully`,
      jobId: id,
      updatedAt: new Date().toISOString() // Include timestamp of the update
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({ message: 'Error updating job' });
  }
};

// DELETE JOB — Permanently removes a job from the database
// Called when DELETE /api/jobs/:id is hit
// Note: Related records (parts, tasks, QC records) are auto-deleted via ON DELETE CASCADE
exports.deleteJob = async (req, res) => {
  const { id } = req.params; // Get the job ID from the URL parameter

  try {
    // Delete the job from the database (cascading deletes handle related tables)
    await pool.query('DELETE FROM jobs WHERE id = ?', [id]);
    console.log(`Deleted job ${id}`);

    // Return success response
    res.json({
      message: `Job ${id} deleted successfully`,
      jobId: id,
      deletedAt: new Date().toISOString() // Include timestamp of deletion
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({ message: 'Error deleting job' });
  }
};
