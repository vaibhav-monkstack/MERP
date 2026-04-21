const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedInventory() {
  console.log('📦 Resupplying Warehouse for Lock components...');
  let pool;
  try {
    pool = mysql.createPool(process.env.DATABASE_URL);
    
    // Get all parts from all templates
    const [parts] = await pool.query('SELECT DISTINCT part_name FROM template_parts');
    
    console.log(`Found ${parts.length} unique components to resupply.`);

    for (const p of parts) {
      const materialName = p.part_name;
      
      // Check if already exists
      const [existing] = await pool.query('SELECT id FROM materials WHERE LOWER(name) = LOWER(?)', [materialName]);
      
      if (existing.length === 0) {
        // Insert new material with 100 starting units
        await pool.query(
          'INSERT INTO materials (name, type, quantity, unit, min_stock) VALUES (?, ?, ?, ?, ?)',
          [materialName, 'Lock Components', 100, 'pcs', 10]
        );
        console.log(`✅ Added to Warehouse: ${materialName} (100 units)`);
      } else {
        // Update existing to 100 units to ensure user can approve
        await pool.query('UPDATE materials SET quantity = 100 WHERE id = ?', [existing[0].id]);
        console.log(`🔄 Refilled Stock: ${materialName} (Reset to 100 units)`);
      }
    }

    console.log('\n✨ Warehouse is now fully STOCKED. Manual approvals will now work!');
  } catch (error) {
    console.error('❌ Resupply failed:', error.message);
  } finally {
    if (pool) await pool.end();
  }
}

seedInventory();
