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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await initTable('inv_orders', `
      CREATE TABLE IF NOT EXISTS inv_orders (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        order_id         VARCHAR(50) NOT NULL,
        product          VARCHAR(255) NOT NULL,
        customer         VARCHAR(255),
        quantity         INT NOT NULL DEFAULT 1,
        delivery_date    DATE,
        inventory_status VARCHAR(50),
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await initTable('materials', `
      CREATE TABLE IF NOT EXISTS materials (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(255) NOT NULL,
        type             VARCHAR(100),
        quantity         INT NOT NULL DEFAULT 0,
        dimensions       VARCHAR(100),
        unit             VARCHAR(50),
        supplier         VARCHAR(255),
        purchase_date    DATE,
        purchase_price   DECIMAL(10,2),
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

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
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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

    connection.release();
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
  }
};

initializeTables();

module.exports = pool;
