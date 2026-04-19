require('dotenv').config({ path: './backend/.env' });
const db = require('./backend/config/db');

async function totalWipe() {
  console.log('🚮 Starting TOTAL WIPE of Job Management Dashboard...');
  
  try {
    const connection = await db.getConnection();
    
    // Disable foreign key checks for a clean wipe of inter-related data
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // 1. Wipe all Tasks
    const [tasks] = await connection.query("TRUNCATE TABLE tasks");
    console.log(`✅ All tasks deleted.`);

    // 2. Wipe all QC Records
    const [qc] = await connection.query("TRUNCATE TABLE qc_records");
    console.log(`✅ All QC records deleted.`);

    // 3. Wipe all Material Requests
    const [requests] = await connection.query("TRUNCATE TABLE requests");
    console.log(`✅ All material requests deleted.`);

    // 4. Wipe Job Parts
    const [parts] = await connection.query("TRUNCATE TABLE job_parts");
    console.log(`✅ All job components deleted.`);

    // 5. Wipe Stock Movements linked to jobs
    const [movements] = await connection.query("DELETE FROM stock_movements WHERE reference_type = 'Job' OR reference_type = 'Request'");
    console.log(`✅ All job-related inventory history removed.`);

    // 6. FINALLY, Wipe all Jobs
    const [jobs] = await connection.query("TRUNCATE TABLE jobs");
    console.log(`✅ All jobs deleted.`);

    // Re-enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    connection.release();
    console.log('\n✨ Dashboard Reset Complete! Your Job Manager view will now be completely empty.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Wipe failed:', err.message);
    process.exit(1);
  }
}

totalWipe();
