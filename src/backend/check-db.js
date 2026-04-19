const pool = require('./config/db');

async function checkUsers() {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role FROM users');
    console.log('--- USERS TABLE ---');
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUsers();
