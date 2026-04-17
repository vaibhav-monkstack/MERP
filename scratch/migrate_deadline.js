const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const pool = require('../backend/config/db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE orders ADD COLUMN deadline DATE DEFAULT NULL');
    console.log('✅ Success: deadline column added to orders');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️ deadline already exists');
      process.exit(0);
    }
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

migrate();
