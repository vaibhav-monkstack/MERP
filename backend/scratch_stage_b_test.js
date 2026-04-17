// Stage B verification script — run with: node scratch_stage_b_test.js
require('dotenv').config();
const pool = require('./config/db');

async function main() {
  // Give the pool a moment to initialize
  await new Promise(r => setTimeout(r, 1500));

  // Step 1: Count requests before
  const [before] = await pool.query('SELECT COUNT(*) as count FROM requests');
  console.log('✅ Requests BEFORE test:', before[0].count);

  // Step 2: Insert a test job
  const newJobId = 'JOB-STAGETEST-' + Date.now();
  await pool.query(
    'INSERT INTO jobs (id, product, quantity, team, status, priority, progress, deadline, notes, alert, orderId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [newJobId, 'Test Circuit Board', 25, 'Team Alpha', 'Created', 'High', 0, '2025-12-31', 'Stage B test', '', null]
  );
  console.log('✅ Job inserted:', newJobId);

  // Step 3: Insert parts into job_parts
  const parts = [
    { name: 'Capacitor', requiredQty: 100 },
    { name: 'Resistor',  requiredQty: 200 }
  ];
  for (const part of parts) {
    await pool.query('INSERT INTO job_parts (jobId, name, requiredQty) VALUES (?, ?, ?)',
      [newJobId, part.name, part.requiredQty]);
  }
  console.log('✅ Parts saved to job_parts');

  // Step 4: Stage B — auto-create material requests
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const requestId = `REQ-${Date.now()}-${i}`;
    await pool.query(
      'INSERT INTO requests (request_id, job_id, material, quantity, requested_by) VALUES (?, ?, ?, ?, ?)',
      [requestId, newJobId, part.name, part.requiredQty, 'Job Manager']
    );
  }
  console.log(`✅ Stage B: auto-created ${parts.length} material request(s)`);

  // Step 5: Verify what's in the requests table for this job
  const [after] = await pool.query('SELECT COUNT(*) as count FROM requests');
  console.log('✅ Requests AFTER test:', after[0].count);

  const [newReqs] = await pool.query(
    'SELECT request_id, job_id, material, quantity, status FROM requests WHERE job_id = ?',
    [newJobId]
  );
  console.log('\n--- Auto-Generated Material Requests ---');
  newReqs.forEach(r =>
    console.log(` [${r.status}]  ${r.material} x${r.quantity}  →  Job: ${r.job_id}`)
  );

  // Cleanup: remove test data
  await pool.query('DELETE FROM requests WHERE job_id = ?', [newJobId]);
  await pool.query('DELETE FROM job_parts WHERE jobId = ?', [newJobId]);
  await pool.query('DELETE FROM jobs WHERE id = ?', [newJobId]);
  console.log('\n✅ Cleanup done — test data removed');

  process.exit(0);
}

main().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
