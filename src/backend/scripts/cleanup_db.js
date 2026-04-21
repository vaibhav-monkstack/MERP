const mysql = require('mysql2/promise');
require('dotenv').config();

async function cleanup() {
  console.log('🚀 Starting Comprehensive Database Cleanup...');
  let pool;
  try {
    pool = mysql.createPool(process.env.DATABASE_URL);
    
    // 1. Delete Inventory Requests
    const [res1] = await pool.query("DELETE FROM requests WHERE request_id LIKE 'REQ-%' OR request_id LIKE 'REQ-JOB-%'");
    console.log(`✅ Deleted ${res1.affectedRows} junk requests.`);

    // 2. Delete Tasks
    const [res2] = await pool.query("DELETE FROM tasks WHERE taskId LIKE 'T-%' OR jobId LIKE 'JOB-1%'");
    console.log(`✅ Deleted ${res2.affectedRows} junk tasks.`);

    // 3. Delete Job Parts
    const [res3] = await pool.query("DELETE FROM job_parts WHERE jobId LIKE 'JOB-1%'");
    console.log(`✅ Deleted ${res3.affectedRows} junk job parts.`);

    // 4. Delete Jobs
    const [res4] = await pool.query("DELETE FROM jobs WHERE id LIKE 'JOB-1%'");
    console.log(`✅ Deleted ${res4.affectedRows} junk jobs.`);

    // 5. Delete Order History
    const [res5] = await pool.query("DELETE FROM order_history WHERE status IN ('new', 'confirmed', 'processing', 'shipped') OR remarks LIKE '%Job created%'");
    console.log(`✅ Deleted ${res5.affectedRows} order history records.`);

    // 6. Delete Orders
    const [res6] = await pool.query("DELETE FROM orders WHERE customer_name LIKE 'Customer-%' OR email LIKE '%example.com%' OR email LIKE '%corleone.com%'");
    console.log(`✅ Deleted ${res6.affectedRows} junk orders.`);

    // 7. Delete Template Parts
    const [junkTemplates] = await pool.query("SELECT id FROM product_templates WHERE name LIKE 'Product-%' OR name LIKE 'Industrial Engine%'");
    const junkIds = junkTemplates.map(t => t.id);
    if (junkIds.length > 0) {
      const [res7] = await pool.query(`DELETE FROM template_parts WHERE template_id IN (${junkIds.join(',')})`);
      console.log(`✅ Deleted ${res7.affectedRows} junk template parts.`);
      
      const [res8] = await pool.query(`DELETE FROM product_templates WHERE id IN (${junkIds.join(',')})`);
      console.log(`✅ Deleted ${res8.affectedRows} junk product templates.`);
    }

    console.log('\n✨ Database is now CLEAN. Only professional data remains.');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    if (pool) await pool.end();
  }
}

cleanup();
