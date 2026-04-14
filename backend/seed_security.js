const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function seed() {
  try {
    console.log('--- Database Security Hardening & Seeding ---');

    // 1. Update Role Enum (redundant check but safe)
    await pool.query("ALTER TABLE users MODIFY COLUMN role ENUM('Job Manager', 'Production Staff', 'Inventory Manager', 'Order Manager') NOT NULL");
    console.log('✅ Updated users role enum');

    // 2. Define Demo Users
    const users = [
      { name: 'Admin User', email: 'admin@factory.com', pass: 'admin123', role: 'Job Manager' },
      { name: 'Inventory Manager', email: 'inventory@factory.com', pass: 'inventory123', role: 'Inventory Manager' },
      { name: 'Order Manager', email: 'order@factory.com', pass: 'order123', role: 'Order Manager' },
      { name: 'Production Staff', email: 'worker@factory.com', pass: 'worker123', role: 'Production Staff' }
    ];

    for (const u of users) {
      const hashed = await bcrypt.hash(u.pass, 10);
      
      // Upsert (Insert or Update if email exists)
      await pool.query(`
        INSERT INTO users (name, email, password, role) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        password = VALUES(password), 
        role = VALUES(role), 
        name = VALUES(name)
      `, [u.name, u.email, hashed, u.role]);
      
      console.log(`✅ Seeded/Updated user: ${u.email} (${u.role})`);
    }

    console.log('--- Seeding Complete ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
}

seed();
