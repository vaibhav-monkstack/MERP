// Import the database connection pool for running queries
const pool = require('../config/db');

// ============================================================
// TASK CONTROLLER — Handles worker task operations
// Tasks are individual work items assigned to production staff
// within a job (e.g., "Assemble Motor Housing" assigned to "John Smith")
// ============================================================

// GET TASKS — Fetches tasks with optional filtering by jobId and/or worker name
// Called when GET /api/tasks is hit
// Query params: ?jobId=JOB-001 (filter by job) and/or ?worker=John Smith (filter by worker)
exports.getTasks = async (req, res) => {
  // Extract optional filter parameters from the query string
  const { jobId, worker } = req.query;
  try {
    // START BUILDING QUERY
    // JOIN with jobs table to ensure we only show tasks for jobs that are actually in production
    // (i.e., not 'Pending Approval')
    let query = `
      SELECT t.* 
      FROM tasks t
      JOIN jobs j ON t.jobId = j.id
      WHERE j.status != 'Pending Approval'
    `;
    let params = [];
    let conditions = [];

    // Filter by jobId
    if (jobId) {
      conditions.push('t.jobId = ?');
      params.push(jobId);
    }

    // Filter by worker name
    if (worker) {
      conditions.push('t.worker = ?');
      params.push(worker);
    }

    // Append conditions
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // Sort by task ID
    query += ' ORDER BY t.taskId ASC';

    // Execute the query
    const [tasks] = await pool.query(query, params);
    
    // Format the startTime field for display before sending to the frontend
    // Convert database datetime to a readable time string (e.g., "02:30 PM")
    const formattedTasks = tasks.map(t => ({
      ...t, // Spread all existing task fields
      startTime: t.startTime 
        ? new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : '-' // Show "-" if task hasn't been started yet
    }));

    // Return the formatted list of tasks
    res.json(formattedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
};

// CREATE TASK — Creates a new task and assigns it to a worker
// Called when POST /api/tasks is hit
// Request body should contain: jobId, partName, worker, deadline (optional)
exports.createTask = async (req, res) => {
  // Extract task details from the request body
  const { jobId, partName, worker, deadline } = req.body;

  // Validate that required fields are provided
  if (!jobId || !partName || !worker) {
    return res.status(400).json({ message: 'jobId, partName, and worker are required' });
  }

  try {
    // Look up the job name (product name) from the jobs table
    const [jobs] = await pool.query('SELECT product FROM jobs WHERE id = ?', [jobId]);
    // If the job doesn't exist, return 404
    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Job not found' });
    }
    const jobName = jobs[0].product; // Get the product name for this job

    // Generate a unique task ID (e.g., "T-200", "T-201", "T-202", ...)
    // Starts at T-200 and increments based on the total number of existing tasks
    const [countResult] = await pool.query('SELECT COUNT(*) as count FROM tasks');
    const taskId = `T-${(200 + countResult[0].count).toString()}`;

    // Insert the new task into the tasks table with default values
    await pool.query(
      'INSERT INTO tasks (taskId, jobId, jobName, partName, worker, status, deadline, startTime, completedTime, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [taskId, jobId, jobName, partName, worker, 'Pending', deadline || null, null, null, '-']
      // status starts as "Pending", startTime/completedTime are null, duration is "-"
    );

    // Return the newly created task data
    res.status(201).json({
      taskId,                        // Generated task ID (e.g., "T-200")
      jobId,                         // Parent job ID
      jobName,                       // Product name from the job
      partName,                      // Name of the task/part
      worker,                        // Name of the assigned worker
      status: 'Pending',             // Initial status
      deadline: deadline || null,    // Optional deadline
      startTime: '-',                // Not started yet
      completedTime: null,           // Not completed yet
      duration: '-'                  // No duration calculated yet
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task' });
  }
};

// UPDATE TASK — Updates a task's status and tracks timing information
// Called when PUT /api/tasks/:id is hit (e.g., PUT /api/tasks/T-101)
// Handles status transitions: Pending → In Progress → Completed
exports.updateTask = async (req, res) => {
  const { id } = req.params;   // Get the task ID from the URL parameter
  const { status } = req.body;  // Get the new status from the request body

  try {
    // Fetch the current task data to check if it exists and get its current state
    const [rows] = await pool.query('SELECT * FROM tasks WHERE taskId = ?', [id]);
    const task = rows[0];

    // If the task doesn't exist, return 404
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Build the UPDATE query dynamically
    let updates = []; // Array of "column = ?" strings
    let values = [];   // Array of corresponding values

    // If a new status was provided, process the status change
    if (status) {
      updates.push('status = ?');
      values.push(status);

      // When task moves to "In Progress", record the start time
      if (status === 'In Progress') {
        const startTime = new Date(); // Current timestamp
        updates.push('startTime = ?');
        values.push(startTime);
      } 
      // When task moves to "Completed", record completion time and calculate duration
      else if (status === 'Completed') {
        const completedTime = new Date(); // Current timestamp
        updates.push('completedTime = ?');
        values.push(completedTime);

        // Calculate how long the task took (from start to completion)
        if (task.startTime) {
          const start = new Date(task.startTime);          // When the task started
          const diffMs = completedTime - start;            // Difference in milliseconds
          const diffHrs = diffMs / (1000 * 60 * 60);      // Convert to hours

          // Format the duration as a human-readable string
          let durationStr = '0h';
          if (diffHrs < 1) {
            // If less than 1 hour, show in minutes (e.g., "45m")
             const diffMins = Math.round(diffMs / (1000 * 60));
             durationStr = `${diffMins}m`;
          } else {
            // If 1 hour or more, show in hours with one decimal (e.g., "2.5h")
             durationStr = `${diffHrs.toFixed(1)}h`;
          }
          updates.push('duration = ?');
          values.push(durationStr);
        }
      }
    }

    // Execute the UPDATE query if there are any changes to make
    if (updates.length > 0) {
      values.push(id); // Add the task ID for the WHERE clause
      await pool.query(`UPDATE tasks SET ${updates.join(', ')} WHERE taskId = ?`, values);
      
      // === AUTO-ASSEMBLY LOGIC ===
      if (status === 'Completed') {
        const [remainingTasks] = await pool.query(
          "SELECT COUNT(*) as cnt FROM tasks WHERE jobId = ? AND status != 'Completed' AND processStep IS NOT NULL",
          [task.jobId]
        );
        
        if (remainingTasks[0].cnt === 0) {
          // All production tasks done -> Move job to Assembly status
          await pool.query(
            "UPDATE jobs SET status = 'Assembly', progress = 60 WHERE id = ?",
            [task.jobId]
          );
          console.log(`Job ${task.jobId} auto-moved to 'Assembly' stage`);
        }
      }
    }

    // Fetch the updated task from the database to return it
    const [updatedRows] = await pool.query('SELECT * FROM tasks WHERE taskId = ?', [id]);
    const updatedTask = updatedRows[0];
    
    // Format the startTime for display
    if (updatedTask.startTime) {
       updatedTask.startTime = new Date(updatedTask.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
       updatedTask.startTime = '-'; // Show "-" if not started
    }

    // Return the updated task data
    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task' });
  }
};
