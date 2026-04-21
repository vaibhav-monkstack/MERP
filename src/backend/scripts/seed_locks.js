const mysql = require('mysql2/promise');
require('dotenv').config();

const templates = [
  {
    name: 'Deadbolt Lock',
    description: 'High-security deadbolt with stainless steel strike plate',
    parts: [
      { name: 'Euro Cylinder 70mm', qty: 1 },
      { name: 'Deadbolt (Solid Throw Bolt)', qty: 1 },
      { name: 'Strike Plate (Stainless Steel)', qty: 1 },
      { name: 'Thumbturn Assembly', qty: 1 }
    ]
  },
  {
    name: 'Knob Lock',
    description: 'Classic door knob set with tubular latch',
    parts: [
      { name: 'Door Knob Set', qty: 1 },
      { name: 'Tubular Latch 60mm Backset', qty: 1 },
      { name: 'Strike Plate', qty: 1 },
      { name: 'Spindle Rod', qty: 1 }
    ]
  },
  {
    name: 'Lever Handle Lock',
    description: 'Ergonomic lever handle with spring latch',
    parts: [
      { name: 'Lever Handle Set', qty: 1 },
      { name: 'Euro Cylinder', qty: 1 },
      { name: 'Spring Latch Bolt', qty: 1 },
      { name: 'Backplate', qty: 1 }
    ]
  },
  {
    name: 'Padlock',
    description: 'Hardened steel shackle padlock with brass body',
    parts: [
      { name: 'Hardened Steel Shackle', qty: 1 },
      { name: 'Brass Lock Body', qty: 1 },
      { name: 'Pin Tumbler Cylinder', qty: 1 },
      { name: 'Compression Springs', qty: 4 }
    ]
  },
  {
    name: 'Mortise Lock',
    description: 'Heavy duty mortise lock with 5-lever deadbolt',
    parts: [
      { name: 'Mortise Lock Case', qty: 1 },
      { name: 'Euro Profile Cylinder', qty: 1 },
      { name: '5-Lever Deadbolt', qty: 1 },
      { name: 'Strike Plate', qty: 1 }
    ]
  },
  {
    name: 'Magnetic Lock',
    description: 'Electromagnetic lock with 600 lbs holding force',
    parts: [
      { name: 'Electromagnet 600 lbs', qty: 1 },
      { name: 'Armature Plate', qty: 1 },
      { name: 'SMPS Power Supply 12V', qty: 1 },
      { name: 'Mounting Bracket', qty: 1 }
    ]
  },
  {
    name: 'Smart Lock',
    description: 'IoT-enabled smart lock with RFID and ESP32',
    parts: [
      { name: 'ESP32 Dev Board', qty: 1 },
      { name: 'Solenoid Lock 12V DC', qty: 1 },
      { name: 'RFID Reader Module RC522', qty: 1 },
      { name: 'Lithium-ion Battery Pack', qty: 1 }
    ]
  },
  {
    name: 'Rim Lock',
    description: 'Surface mounted rim lock for traditional doors',
    parts: [
      { name: 'Rim Lock Case', qty: 1 },
      { name: 'Rim Cylinder', qty: 1 },
      { name: 'Latch Bolt', qty: 1 },
      { name: 'Strike Plate', qty: 1 }
    ]
  },
  {
    name: 'Cam Lock (Drawer/Locker)',
    description: 'Compact cam lock for secured storage',
    parts: [
      { name: 'Cam Cylinder', qty: 1 },
      { name: 'Cam (Flat Metal Tailpiece)', qty: 1 },
      { name: 'Lock Nut', qty: 1 },
      { name: 'Key', qty: 2 }
    ]
  },
  {
    name: 'Sliding Door Lock',
    description: 'Secure hook bolt design for sliding glass/wood doors',
    parts: [
      { name: 'Hook Bolt', qty: 1 },
      { name: 'Flush Handle', qty: 1 },
      { name: 'Mortise Cylinder', qty: 1 },
      { name: 'Strike Plate', qty: 1 }
    ]
  }
];

async function seed() {
  console.log('🚀 Seeding Lock Templates...');
  let pool;
  try {
    pool = mysql.createPool(process.env.DATABASE_URL);
    
    // Clear existing templates to avoid duplicates (Surgical cleanup)
    const templateNames = templates.map(t => t.name);
    const [existing] = await pool.query('SELECT id FROM product_templates WHERE name IN (?)', [templateNames]);
    const ids = existing.map(e => e.id);
    
    if (ids.length > 0) {
      await pool.query('DELETE FROM template_parts WHERE template_id IN (?)', [ids]);
      await pool.query('DELETE FROM product_templates WHERE id IN (?)', [ids]);
      console.log(`♻️ Cleaned up ${ids.length} existing matching templates.`);
    }

    for (const t of templates) {
      const [res] = await pool.query('INSERT INTO product_templates (name, description) VALUES (?, ?)', [t.name, t.description]);
      const templateId = res.insertId;
      
      for (const p of t.parts) {
        await pool.query(
          'INSERT INTO template_parts (template_id, part_name, qty_per_unit, unit) VALUES (?, ?, ?, ?)',
          [templateId, p.name, p.qty, 'pcs']
        );
      }
      console.log(`✅ Seeded: ${t.name}`);
    }

    console.log('\n✨ All 10 Lock Templates created successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    if (pool) await pool.end();
  }
}

seed();
