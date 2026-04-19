const db = require('../backend/config/db');

async function cleanup() {
  console.log('🧼 Starting Database Purge of Test Data...');
  
  try {
    const connection = await db.getConnection();
    
    // 1. Delete Test Material Requests
    const [requests] = await connection.query("DELETE FROM requests WHERE job_id LIKE 'ReworkTest-%' OR job_id LIKE 'AdvancedTest-%' OR job_id LIKE 'LifecycleTest-%'");
    console.log(`✅ Deleted ${requests.affectedRows} test material requests.`);

    // 2. Delete Test Stock Movements
    const [movements] = await connection.query("DELETE FROM stock_movements WHERE reference_id IN (SELECT id FROM jobs WHERE id LIKE 'ReworkTest-%' OR id LIKE 'AdvancedTest-%' OR id LIKE 'LifecycleTest-%')");
    console.log(`✅ Deleted ${movements.affectedRows} test stock movements.`);

    // 3. Delete Test Tasks
    const [tasks] = await connection.query("DELETE FROM tasks WHERE jobId LIKE 'ReworkTest-%' OR jobId LIKE 'AdvancedTest-%' OR jobId LIKE 'LifecycleTest-%'");
    console.log(`✅ Deleted ${tasks.affectedRows} test tasks.`);

    // 2. Delete Test QC Records
    const [qc] = await connection.query("DELETE FROM qc_records WHERE jobId LIKE 'ReworkTest-%' OR jobId LIKE 'AdvancedTest-%' OR jobId LIKE 'LifecycleTest-%'");
    console.log(`✅ Deleted ${qc.affectedRows} test QC records.`);

    // 3. Delete Test Jobs
    const [jobs] = await connection.query("DELETE FROM jobs WHERE id LIKE 'ReworkTest-%' OR id LIKE 'AdvancedTest-%' OR id LIKE 'LifecycleTest-%' OR product LIKE 'ReworkTest-%' OR product LIKE 'AdvFlow-%' OR product LIKE 'LifecycleTest-%'");
    console.log(`✅ Deleted ${jobs.affectedRows} test jobs.`);

    // 4. Delete Team Memberships for AutoTeams
    const [members] = await connection.query("DELETE FROM team_members WHERE teamId IN (SELECT id FROM teams WHERE name LIKE 'AutoTeam-%')");
    console.log(`✅ Deleted ${members.affectedRows} team memberships.`);

    // 5. Delete AutoTeams
    const [teams] = await connection.query("DELETE FROM teams WHERE name LIKE 'AutoTeam-%'");
    console.log(`✅ Deleted ${teams.affectedRows} test teams.`);

    // 6. Delete AutoWorkers
    const [workers] = await connection.query("DELETE FROM users WHERE name LIKE 'AutoWorker-%' OR email LIKE 'auto_%'");
    console.log(`✅ Deleted ${workers.affectedRows} test workers.`);

    connection.release();
    console.log('\n✨ Database is now clean! All automated test artifacts have been removed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  }
}

cleanup();
