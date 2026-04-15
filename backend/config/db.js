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
        status           ENUM('new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned') DEFAULT 'new',
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
    await initTable('suppliers_lead_time', `
      ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lead_time_days INT DEFAULT 0
    `);

    await initTable('requests', `
      CREATE TABLE IF NOT EXISTS requests (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        request_id       VARCHAR(50) NOT NULL,
        job_id           VARCHAR(50),
        material         VARCHAR(255) NOT NULL,
        quantity         INT NOT NULL DEFAULT 1,
        requested_by     VARCHAR(100),
        status           VARCHAR(50) DEFAULT 'Pending',
        requested_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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

    // =======================================================
    // SCHEDULING COLUMNS — Add new columns to tasks table
    // Uses SHOW COLUMNS to check existence first (compatible
    // with all MySQL versions, including < 8.0).
    // =======================================================
    const schedulingColumns = [
      { name: 'processStep',    def: 'VARCHAR(50)  DEFAULT NULL' },
      { name: 'sequenceOrder',  def: 'INT          DEFAULT NULL' },
      { name: 'scheduledStart', def: 'DATE         DEFAULT NULL' },
      { name: 'scheduledEnd',   def: 'DATE         DEFAULT NULL' },
      { name: 'dependsOn',      def: 'VARCHAR(50)  DEFAULT NULL' },
    ];
    try {
      const [existingCols] = await connection.query('SHOW COLUMNS FROM tasks');
      const colNames = existingCols.map(c => c.Field);
      for (const col of schedulingColumns) {
        if (!colNames.includes(col.name)) {
          await connection.query(`ALTER TABLE tasks ADD COLUMN ${col.name} ${col.def}`);
          console.log(`  ➕ Added column tasks.${col.name}`);
        }
      }
      console.log('✅ Scheduling columns ready on tasks table');
    } catch (e) {
      // tasks table may not exist yet on a fresh DB — that's fine
      console.warn('Scheduling column check skipped (tasks table not yet created):', e.message);
    }

    connection.release();
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
  }
};

initializeTables();

module.exports = pool;
