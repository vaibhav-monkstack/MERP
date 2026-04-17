const pool = require('../config/db');

/**
 * AUTOMATION UTILITY
 * Handles the logic for automatically creating jobs and task assignments
 * when a new order is received.
 */

/**
 * Triggered after a new order is saved to the database.
 * Creates a Job in 'Pending Approval' status and auto-assigns tasks to workers.
 */
/**
 * Triggered when the Order Manager requests a material check.
 * Looks up the product template and creates material requests in the inventory module.
 */
async function handleMaterialCheck(orderId) {
  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) return;
    const order = orderRows[0];

    console.log(`[Automation] Requesting material check for Order #${orderId} (${order.item_name})`);

    // 1. Find the product template
    const [templates] = await pool.query(
      'SELECT * FROM product_templates WHERE LOWER(name) = LOWER(?)',
      [order.item_name]
    );

    if (templates.length === 0) {
      console.warn(`[Automation] No template found for: ${order.item_name}. Manual material request required.`);
      return;
    }

    const template = templates[0];

    // 2. Fetch template parts
    const [templateParts] = await pool.query(
      'SELECT * FROM template_parts WHERE template_id = ?',
      [template.id]
    );

    // 3. Create material requests for Inventory dashboard
    for (const part of templateParts) {
      const requestId = `REQ-ORD-${orderId}-${Date.now()}`;
      await pool.query(
        'INSERT INTO requests (request_id, order_id, material, quantity, requested_by, status) VALUES (?, ?, ?, ?, ?, ?)',
        [
          requestId,
          orderId,
          part.part_name,
          part.qty_per_unit * order.quantity,
          'Order Manager',
          'Pending'
        ]
      );
    }

    console.log(`[Automation] Created ${templateParts.length} material requests for Order #${orderId}`);

  } catch (error) {
    console.error(`[Automation] Material check failed for Order #${orderId}:`, error);
  }
}

/**
 * Triggered after final manager approval.
 * Creates the actual Job and tasks.
 */
async function handleOrderApproved(orderId) {
  try {
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    if (orderRows.length === 0) return;
    const order = orderRows[0];

    const newJobId = `JOB-${Date.now()}`;
    console.log(`[Automation] Order #${orderId} approved. Creating Job ${newJobId}`);

    // 1. Find template (Exact then fuzzy)
    let [templates] = await pool.query(
      'SELECT * FROM product_templates WHERE LOWER(name) = LOWER(?)',
      [order.item_name]
    );

    if (templates.length === 0) {
      [templates] = await pool.query(
        'SELECT * FROM product_templates WHERE LOWER(name) LIKE LOWER(?)',
        [`%${order.item_name}%`]
      );
    }

    if (templates.length === 0) {
      console.warn(`[Automation] No template found for item: ${order.item_name}`);
      return;
    }
    const template = templates[0];

    // 2. Fetch parts
    const [templateParts] = await pool.query(
      'SELECT * FROM template_parts WHERE template_id = ?',
      [template.id]
    );

    // 3. Create Job
    await pool.query(
      'INSERT INTO jobs (id, product, quantity, team, status, priority, progress, deadline, orderId, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        newJobId, order.item_name, order.quantity, 'Auto-Assigned', 
        'Pending Approval', order.priority || 'Medium', 0, 
        order.deadline || null, orderId, `Approved by Manager for Order #${orderId}`
      ]
    );

    // 4. Create Job Parts & Tasks
    const [workers] = await pool.query("SELECT name FROM users WHERE role = 'Production Staff'");
    
    for (let i = 0; i < templateParts.length; i++) {
      const part = templateParts[i];
      await pool.query('INSERT INTO job_parts (jobId, name, requiredQty) VALUES (?, ?, ?)',
        [newJobId, part.part_name, part.qty_per_unit * order.quantity]);

      const assignedWorker = workers.length > 0 ? workers[i % workers.length].name : '';
      const taskId = `T-${Date.now()}-${i}`;
      await pool.query(
        'INSERT INTO tasks (taskId, jobId, jobName, partName, worker, status, deadline) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [taskId, newJobId, order.item_name, part.part_name, assignedWorker, 'Pending', order.deadline]
      );
    }

    // 5. Explicitly update order status to 'processing'
    await pool.query('UPDATE orders SET status = "processing" WHERE id = ?', [orderId]);
    await pool.query('INSERT INTO order_history (order_id, status, remarks) VALUES (?, ?, ?)', 
      [orderId, 'processing', `Production Job ${newJobId} created.`]);

    console.log(`[Automation] Job ${newJobId} successfully launched for Order #${orderId}`);

  } catch (error) {
    console.error(`[Automation] Approval trigger failed for Order #${orderId}:`, error);
  }
}

module.exports = {
  handleMaterialCheck,
  handleOrderApproved
};
