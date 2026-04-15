const pool = require('../config/db');

// ============================================================
// SCHEDULE CONTROLLER — Generates and manages task schedules
//
// The scheduling engine:
//  1. Checks all material requests for a job are 'Approved'
//  2. Reads the job's parts list
//  3. For each part, generates 4 sequenced tasks:
//     Cutting → Shaping → Drilling → Finishing
//  4. Divides the (today → deadline) window into equal time slots
//  5. Assigns the least-loaded worker in the job's team to each task
//  6. Parts are scheduled in PARALLEL (same date ranges, different workers)
//  7. Steps within a part are SEQUENTIAL (dependsOn links enforce order)
// ============================================================

const PROCESS_STEPS = ['Cutting', 'Shaping', 'Drilling', 'Finishing'];

// Helper: format a Date object to 'YYYY-MM-DD' for MySQL DATE columns
const toDateStr = (date) => date.toISOString().split('T')[0];

// Helper: add days to a date and return a new Date
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.round(days));
  return d;
};

// ============================================================
// GENERATE SCHEDULE  POST /api/schedule/:jobId
// ============================================================
exports.generateSchedule = async (req, res) => {
  const { jobId } = req.params;

  try {
    // --- 1. Fetch the job ---
    const [jobs] = await pool.query('SELECT * FROM jobs WHERE id = ?', [jobId]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    const job = jobs[0];

    // --- 2. Gate: job must be in 'Materials Ready' status ---
    if (job.status !== 'Materials Ready') {
      // Check request statuses to give a useful error message
      const [requests] = await pool.query(
        'SELECT status, COUNT(*) as cnt FROM requests WHERE job_id = ? GROUP BY status',
        [jobId]
      );
      const pending = requests.find(r => r.status === 'Pending');
      const rejected = requests.find(r => r.status === 'Rejected');

      if (rejected) {
        return res.status(403).json({
          success: false,
          message: 'Cannot schedule: one or more material requests were rejected.',
          details: { pending: pending?.cnt || 0, rejected: rejected?.cnt || 0 }
        });
      }
      if (pending) {
        return res.status(403).json({
          success: false,
          message: `Cannot schedule yet: ${pending.cnt} material request(s) are still pending Inventory approval.`,
          details: { pending: pending.cnt, rejected: 0 }
        });
      }
      // No requests at all — allow if manager confirms (edge case)
      // Just means no parts were defined, let it proceed to show empty schedule
    }

    // --- 3. Fetch job parts ---
    const [parts] = await pool.query('SELECT * FROM job_parts WHERE jobId = ?', [jobId]);
    if (parts.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No parts defined for this job. Add components in the job creation form first.'
      });
    }

    // --- 4. Check if a schedule already exists ---
    const [existingTasks] = await pool.query(
      "SELECT COUNT(*) as cnt FROM tasks WHERE jobId = ? AND processStep IS NOT NULL",
      [jobId]
    );
    if (existingTasks[0].cnt > 0) {
      return res.status(409).json({
        success: false,
        message: 'A schedule already exists for this job. Clear it first before regenerating.'
      });
    }

    // --- 5. Build worker load map for the job's team ---
    // Strategy: assign to the worker with the fewest active (non-Completed) tasks
    let workerPool = [];

    if (job.team) {
      // Get all members of this job's team
      const [teamRows] = await pool.query(
        `SELECT u.name 
         FROM team_members tm 
         JOIN teams t ON tm.teamId = t.id 
         JOIN users u ON tm.userId = u.id 
         WHERE t.name = ?`,
        [job.team]
      );
      workerPool = teamRows.map(r => r.name);
    }

    // Fallback: if team has no members, use all Production Staff
    if (workerPool.length === 0) {
      const [allWorkers] = await pool.query(
        "SELECT name FROM users WHERE role = 'Production Staff' ORDER BY name ASC"
      );
      workerPool = allWorkers.map(r => r.name);
    }

    // Build task-count map per worker (active tasks across ALL jobs)
    const workerLoad = {};
    for (const name of workerPool) {
      workerLoad[name] = 0; // Initialize
    }
    if (workerPool.length > 0) {
      const [activeTasks] = await pool.query(
        `SELECT worker, COUNT(*) as cnt 
         FROM tasks 
         WHERE worker IN (${workerPool.map(() => '?').join(',')}) 
           AND status != 'Completed' 
         GROUP BY worker`,
        workerPool
      );
      for (const row of activeTasks) {
        if (workerLoad.hasOwnProperty(row.worker)) {
          workerLoad[row.worker] = row.cnt;
        }
      }
    }

    // Helper: pick the least-loaded worker and increment their count
    const pickWorker = () => {
      if (Object.keys(workerLoad).length === 0) return null;
      const least = Object.entries(workerLoad).sort((a, b) => a[1] - b[1])[0][0];
      workerLoad[least]++;
      return least;
    };

    // --- 6. Calculate time slots ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = job.deadline ? new Date(job.deadline) : addDays(today, 14);
    const totalDays = Math.max(
      (deadlineDate - today) / (1000 * 60 * 60 * 24),
      PROCESS_STEPS.length // Minimum 1 day per step
    );
    const stepDays = totalDays / PROCESS_STEPS.length;

    // --- 7. Generate tasks ---
    const generatedTasks = [];
    let taskCounter = await pool.query('SELECT COUNT(*) as cnt FROM tasks');
    let taskSeq = 200 + taskCounter[0][0].cnt;

    for (const part of parts) {
      let prevTaskId = null; // For dependsOn chaining

      for (let stepIndex = 0; stepIndex < PROCESS_STEPS.length; stepIndex++) {
        const step = PROCESS_STEPS[stepIndex];
        const taskId = `T-${taskSeq++}`;
        const assignedWorker = pickWorker();

        // Step dates: each step gets an equal slice of the total window
        const stepStart = addDays(today, stepIndex * stepDays);
        const stepEnd   = addDays(today, (stepIndex + 1) * stepDays);

        await pool.query(
          `INSERT INTO tasks 
           (taskId, jobId, jobName, partName, worker, status, deadline,
            startTime, completedTime, duration,
            processStep, sequenceOrder, scheduledStart, scheduledEnd, dependsOn)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            taskId,
            jobId,
            job.product,
            part.name,
            assignedWorker || '',
            'Pending',
            toDateStr(stepEnd),    // deadline = end of this step's window
            null, null, '-',       // startTime, completedTime, duration
            step,                  // processStep
            stepIndex + 1,         // sequenceOrder (1-indexed)
            toDateStr(stepStart),  // scheduledStart
            toDateStr(stepEnd),    // scheduledEnd
            prevTaskId             // dependsOn (null for first step)
          ]
        );

        generatedTasks.push({
          taskId, jobId, partName: part.name, worker: assignedWorker,
          processStep: step, sequenceOrder: stepIndex + 1,
          scheduledStart: toDateStr(stepStart), scheduledEnd: toDateStr(stepEnd),
          dependsOn: prevTaskId, status: 'Pending'
        });

        prevTaskId = taskId; // Next step depends on this one
      }
    }

    // --- 8. Update job status to 'Production' to reflect active scheduling ---
    await pool.query(
      "UPDATE jobs SET status='Production' WHERE id=?",
      [jobId]
    );

    res.status(201).json({
      success: true,
      message: `Schedule generated: ${generatedTasks.length} tasks created across ${parts.length} part(s)`,
      tasks: generatedTasks,
      summary: {
        parts: parts.length,
        stepsPerPart: PROCESS_STEPS.length,
        totalTasks: generatedTasks.length,
        deadline: toDateStr(deadlineDate)
      }
    });

  } catch (err) {
    console.error('generateSchedule error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================
// GET SCHEDULE  GET /api/schedule/:jobId
// Returns all scheduled tasks for a job, grouped by part.
// Also returns the material request status summary.
// ============================================================
exports.getSchedule = async (req, res) => {
  const { jobId } = req.params;

  try {
    // Fetch all scheduled tasks (those with a processStep)
    const [tasks] = await pool.query(
      `SELECT * FROM tasks 
       WHERE jobId = ? AND processStep IS NOT NULL 
       ORDER BY partName ASC, sequenceOrder ASC`,
      [jobId]
    );

    // Fetch material request status summary for this job
    const [requests] = await pool.query(
      `SELECT status, COUNT(*) as count FROM requests WHERE job_id = ? GROUP BY status`,
      [jobId]
    );

    // Group tasks by part for easier frontend rendering
    const grouped = {};
    for (const task of tasks) {
      if (!grouped[task.partName]) grouped[task.partName] = [];
      grouped[task.partName].push(task);
    }

    res.json({
      success: true,
      scheduled: tasks.length > 0,
      tasks,
      groupedByPart: grouped,
      materialRequests: requests // e.g. [{status:'Approved', count:3}, {status:'Pending', count:1}]
    });

  } catch (err) {
    console.error('getSchedule error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ============================================================
// CLEAR SCHEDULE  DELETE /api/schedule/:jobId
// Removes all auto-generated (scheduled) tasks for a job.
// Manual tasks (processStep IS NULL) are preserved.
// ============================================================
exports.clearSchedule = async (req, res) => {
  const { jobId } = req.params;

  try {
    const [result] = await pool.query(
      "DELETE FROM tasks WHERE jobId = ? AND processStep IS NOT NULL",
      [jobId]
    );

    // Revert job status back to 'Materials Ready' so it can be rescheduled
    await pool.query(
      "UPDATE jobs SET status='Materials Ready' WHERE id=? AND status='Production'",
      [jobId]
    );

    res.json({
      success: true,
      message: `Cleared ${result.affectedRows} scheduled task(s) for job ${jobId}`,
      cleared: result.affectedRows
    });

  } catch (err) {
    console.error('clearSchedule error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};
