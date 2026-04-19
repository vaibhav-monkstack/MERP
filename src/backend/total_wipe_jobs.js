const db = require('./config/db');

async function totalWipe() {
  console.log('🚮 Starting TOTAL RESET of Teams, Workers, and Jobs...');
  
  try {
    const connection = await db.getConnection();
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    // 1. Wipe Teams & Memberships
    await connection.query("TRUNCATE TABLE team_members");
    await connection.query("TRUNCATE TABLE teams");
    console.log(`✅ All Teams and assignments deleted.`);

    // 2. Wipe Workers (Preserving the Admin)
    const [workers] = await connection.query("DELETE FROM users WHERE role = 'Production Staff' OR name LIKE 'AutoWorker-%' OR email LIKE 'auto_%'");
    console.log(`✅ All Production Workers deleted (${workers.affectedRows} accounts).`);

    // 3. Ensuring Jobs & Tasks are also clean
    await connection.query("TRUNCATE TABLE tasks");
    await connection.query("TRUNCATE TABLE qc_records");
    await connection.query("TRUNCATE TABLE requests");
    await connection.query("TRUNCATE TABLE job_parts");
    
    // 6. FINALLY, Wipe all Jobs
    await connection.query("TRUNCATE TABLE jobs");
    console.log(`✅ All jobs deleted.`);

    // 7. SEED: Create exactly ONE default team and ONE worker for tests to use
    const [teamResult] = await connection.query("INSERT INTO teams (name) VALUES ('Default Production Team') ON DUPLICATE KEY UPDATE name=name");
    const teamId = teamResult.insertId;

    // Use a fixed ID for the test worker if possible, or just look it up. 
    // We'll create a fresh one to be safe.
    const workerEmail = 'test.worker@factory.com';
    await connection.query("DELETE FROM users WHERE email = ?", [workerEmail]);
    const [workerResult] = await connection.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      ['Test Worker', workerEmail, 'worker123', 'Production Staff']
    );
    const workerId = workerResult.insertId;

    await connection.query("INSERT INTO team_members (teamId, userId) VALUES (?, ?)", [teamId, workerId]);
    console.log(`✅ Seeded 1 default team ('Default Production Team') with 1 worker ('Test Worker').`);

    // Re-enable foreign key checks
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    connection.release();
    
    console.log('\n✨ System Reset Complete! Manage Teams and Dashboards are now completely empty.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
    process.exit(1);
  }
}

totalWipe();
