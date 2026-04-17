const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a modern Promise-based connection pool
const pool = process.env.DATABASE_URL 
  ? mysql.createPool(process.env.DATABASE_URL)
  : mysql.createPool({
      host:               process.env.DB_HOST || 'localhost',
      port:               process.env.DB_PORT || 3306,
      user:               process.env.DB_USER || 'root',
      password:           process.env.DB_PASSWORD || '',
      database:           process.env.DB_NAME || 'job_management',
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
      connectTimeout:     20000 
    });

// Automatic Table Initialization (Self-executing for platform safety)
// This ensures that the DB schema is ready even if it's a fresh deployment
const initializeTables = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Connected to MySQL (Promise Pool)');
    
    // Helper to log table status
    const initTable = async (name, sql) => {
      try {
        await connection.query(sql);
        console.log(`✅ Table '${name}' is ready`);
      } catch (err) {
        console.error(`❌ Error initializing table '${name}':`, err.message);
      }
    };

    const ensureColumnExists = async (table, column, definition) => {
      try {
        const [rows] = await connection.query(
          'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
          [process.env.DB_NAME || 'job_management', table, column]
        );
        if (rows.length === 0) {
          await connection.query(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
          console.log(`✅ Column '${column}' added to '${table}'`);
        }
      } catch (err) {
        if (err.code !== 'ER_DUP_FIELDNAME') {
          console.error(`❌ Error ensuring column '${column}' on '${table}':`, err.message);
        }
      }
    };

    // Table definitions
    await initTable('orders', `
      CREATE TABLE IF NOT EXISTS orders (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        customer_name    VARCHAR(100) NOT NULL,
        email            VARCHAR(100),
        mobile_number    VARCHAR(20),
        delivery_address TEXT,
        item_name        VARCHAR(200) NOT NULL,
        quantity         INT NOT NULL DEFAULT 1,
        price            DECIMAL(10,2) NOT NULL,
        status           ENUM('new', 'awaiting_materials', 'ready_to_approve', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'new',
        priority         ENUM('low','medium','high','urgent') DEFAULT 'medium',
        shipping_method  VARCHAR(100),
        courier_details  VARCHAR(255),
        tracking_number  VARCHAR(100),
        remarks          TEXT,
        deadline         DATE,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await initTable('order_history', `
      CREATE TABLE IF NOT EXISTS order_history (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        order_id   INT NOT NULL,
        status     VARCHAR(50),
        remarks    TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    await initTable('returns', `
      CREATE TABLE IF NOT EXISTS returns (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        order_id   INT NOT NULL,
        reason     TEXT,
        type       ENUM('return', 'exchange') DEFAULT 'return',
        status     ENUM('pending', 'approved', 'completed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);

    await initTable('customers', `
      CREATE TABLE IF NOT EXISTS customers (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(100),
        phone      VARCHAR(20),
        address    TEXT,
        order_count INT DEFAULT 0,
        total_spent DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await initTable('inv_orders', `
      CREATE TABLE IF NOT EXISTS inv_orders (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        order_id         VARCHAR(50) NOT NULL,
        product          VARCHAR(255) NOT NULL,
        customer         VARCHAR(255),
        supplier_id      INT,
        quantity         INT NOT NULL DEFAULT 1,
        delivery_date    DATE,
        eta_date         DATE,
        received_date    DATE,
        inventory_status VARCHAR(50),
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await ensureColumnExists('inv_orders', 'supplier_id', 'supplier_id INT');
    await ensureColumnExists('inv_orders', 'eta_date', 'eta_date DATE');
    await ensureColumnExists('inv_orders', 'received_date', 'received_date DATE');

    await initTable('materials', `
      CREATE TABLE IF NOT EXISTS materials (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(255) NOT NULL,
        type             VARCHAR(100),
        quantity         INT NOT NULL DEFAULT 0,
        min_stock        INT NOT NULL DEFAULT 20,
        dimensions       VARCHAR(100),
        unit             VARCHAR(50),
        supplier         VARCHAR(255),
        purchase_date    DATE,
        purchase_price   DECIMAL(10,2),
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await ensureColumnExists('materials', 'min_stock', 'min_stock INT NOT NULL DEFAULT 20');

    await initTable('suppliers', `
      CREATE TABLE IF NOT EXISTS suppliers (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(255) NOT NULL,
        contact_email    VARCHAR(255),
        contact_phone    VARCHAR(50),
        location         VARCHAR(255),
        rating           DECIMAL(3,1),
        active_orders    INT DEFAULT 0,
        status           VARCHAR(50) DEFAULT 'On Time',
        lead_time_days   INT DEFAULT 0,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await ensureColumnExists('suppliers', 'lead_time_days', 'lead_time_days INT DEFAULT 0');

    await initTable('requests', `
      CREATE TABLE IF NOT EXISTS requests (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        request_id       VARCHAR(50) NOT NULL,
        job_id           VARCHAR(50),
        order_id         INT,
        material         VARCHAR(255) NOT NULL,
        quantity         INT NOT NULL DEFAULT 1,
        requested_by     VARCHAR(100),
        status           VARCHAR(50) DEFAULT 'Pending',
        requested_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await ensureColumnExists('requests', 'order_id', 'order_id INT');

    await initTable('stock_movements', `
      CREATE TABLE IF NOT EXISTS stock_movements (
        id                 INT AUTO_INCREMENT PRIMARY KEY,
        material_id        INT,
        material_name      VARCHAR(255) NOT NULL,
        change_type        VARCHAR(50) NOT NULL,
        quantity_change    INT NOT NULL,
        resulting_quantity INT NOT NULL,
        reference_type     VARCHAR(50),
        reference_id       INT,
        note               TEXT,
        created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
      )
    `);

    await initTable('product_templates', `
      CREATE TABLE IF NOT EXISTS product_templates (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await initTable('template_parts', `
      CREATE TABLE IF NOT EXISTS template_parts (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        template_id  INT NOT NULL,
        part_name    VARCHAR(255) NOT NULL,
        qty_per_unit DECIMAL(10,2) NOT NULL DEFAULT 1,
        unit         VARCHAR(50) DEFAULT 'pcs',
        FOREIGN KEY (template_id) REFERENCES product_templates(id) ON DELETE CASCADE
      )
    `);

    // 👤 User & Security Management
    await initTable('users', `
      CREATE TABLE IF NOT EXISTS users (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(100) NOT NULL,
        email            VARCHAR(100) NOT NULL UNIQUE,
        password         VARCHAR(255) NOT NULL,
        role             ENUM('Job Manager', 'Production Staff', 'Inventory Manager', 'Order Manager') NOT NULL,
        failedAttempts   INT DEFAULT 0,
        lockoutUntil     DATETIME DEFAULT NULL,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 🏗️ Job Management
    await initTable('jobs', `
      CREATE TABLE IF NOT EXISTS jobs (
        id               VARCHAR(50) PRIMARY KEY,
        product          VARCHAR(255) NOT NULL,
        quantity         INT NOT NULL,
        team             VARCHAR(100),
        status           VARCHAR(50) DEFAULT 'Created',
        priority         VARCHAR(50) DEFAULT 'Medium',
        progress         INT DEFAULT 0,
        deadline         DATE,
        notes            TEXT,
        alert            VARCHAR(255),
        orderId          INT,
        createdAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE SET NULL
      )
    `);

    await initTable('job_parts', `
      CREATE TABLE IF NOT EXISTS job_parts (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        jobId            VARCHAR(50) NOT NULL,
        name             VARCHAR(255) NOT NULL,
        requiredQty      INT NOT NULL DEFAULT 1,
        completedQty     INT DEFAULT 0,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
      )
    `);

    // 👥 Team Management
    await initTable('teams', `
      CREATE TABLE IF NOT EXISTS teams (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(100) NOT NULL UNIQUE,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await initTable('team_members', `
      CREATE TABLE IF NOT EXISTS team_members (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        teamId           INT NOT NULL,
        userId           INT NOT NULL,
        UNIQUE KEY team_user_unq (teamId, userId),
        FOREIGN KEY (teamId) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 📋 Task Tracking
    await initTable('tasks', `
      CREATE TABLE IF NOT EXISTS tasks (
        taskId           VARCHAR(50) PRIMARY KEY,
        jobId            VARCHAR(50) NOT NULL,
        jobName          VARCHAR(255),
        partName         VARCHAR(255),
        worker           VARCHAR(100),
        status           VARCHAR(50) DEFAULT 'Pending',
        deadline         DATE,
        startTime        DATETIME,
        completedTime    DATETIME,
        duration         VARCHAR(50) DEFAULT '-',
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
      )
    `);

    await initTable('qc_records', `
      CREATE TABLE IF NOT EXISTS qc_records (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        jobId            VARCHAR(50) NOT NULL,
        inspector        VARCHAR(100),
        date             VARCHAR(50),
        result           ENUM('Pass', 'Fail') NOT NULL,
        passed           INT,
        total            INT,
        notes            TEXT,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE
      )
    `);

    // =======================================================
    // MIGRATIONS — Ensure schema is up to date
    // =======================================================
    try {
      // 1. Manufacturing Sync (Status ENUM & Requests order_id)
      const [orderCols] = await connection.query('SHOW COLUMNS FROM orders WHERE Field = "status"');
      if (orderCols.length > 0) {
        const type = orderCols[0].Type;
        if (!type.includes('awaiting_materials') || !type.includes('ready_to_approve')) {
          console.log('🔄 Updating orders.status ENUM...');
          await connection.query(`
            ALTER TABLE orders MODIFY COLUMN status 
            ENUM('new', 'awaiting_materials', 'ready_to_approve', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') 
            DEFAULT 'new'
          `);
          console.log('✅ orders.status ENUM updated');
        }
      }
      await ensureColumnExists('requests', 'order_id', 'order_id INT AFTER job_id');

      // 2. Scheduling Columns (Process Steps & Sequence)
      const schedulingColumns = [
        { name: 'processStep',    def: 'VARCHAR(50)  DEFAULT NULL' },
        { name: 'sequenceOrder',  def: 'INT          DEFAULT NULL' },
        { name: 'scheduledStart', def: 'DATE         DEFAULT NULL' },
        { name: 'scheduledEnd',   def: 'DATE         DEFAULT NULL' },
        { name: 'dependsOn',      def: 'VARCHAR(50)  DEFAULT NULL' },
      ];
      const [existingCols] = await connection.query('SHOW COLUMNS FROM tasks');
      const taskColNames = existingCols.map(c => c.Field);
      for (const col of schedulingColumns) {
        if (!taskColNames.includes(col.name)) {
          await connection.query(`ALTER TABLE tasks ADD COLUMN ${col.name} ${col.def}`);
          console.log(`  ➕ Added column tasks.${col.name}`);
        }
      }
      console.log('✅ All migrations complete');
      
    } catch (migErr) {
      console.error('❌ Migration Error:', migErr.message);
    }

    connection.release();
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
  }
};

initializeTables();

module.exports = pool;
