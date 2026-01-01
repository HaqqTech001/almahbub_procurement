const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'almahbub_procurement',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Initialize database with tables
async function initializeDatabase() {
  try {
    await testConnection();
    
    const queries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        company VARCHAR(255),
        address TEXT,
        street_address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(20),
        country VARCHAR(100),
        role ENUM('user', 'admin') DEFAULT 'user',
        email_verified BOOLEAN DEFAULT FALSE,
        email_verification_token VARCHAR(255),
        reset_password_token VARCHAR(255),
        reset_password_expires DATETIME,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      )`,

      // Categories table
      `CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        slug VARCHAR(255) UNIQUE NOT NULL,
        parent_id INT DEFAULT NULL,
        icon VARCHAR(10),
        color VARCHAR(20) DEFAULT '#205562',
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_slug (slug),
        INDEX idx_parent (parent_id),
        INDEX idx_active (is_active)
      )`,

      // Products/Services table
      `CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        gallery JSON,
        category_id INT,
        specifications JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_category (category_id),
        INDEX idx_active (is_active)
      )`,

      // Orders table
      `CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        request_number VARCHAR(20),
        product_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        quantity INT DEFAULT 1,
        budget DECIMAL(10,2),
        files JSON,
        status ENUM('pending', 'processing', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        INDEX idx_user (user_id),
        INDEX idx_request_number (request_number),
        INDEX idx_status (status),
        INDEX idx_created (created_at)
      )`,

      // Order tracking table
      `CREATE TABLE IF NOT EXISTS order_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        status VARCHAR(100) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_order (order_id),
        INDEX idx_created (created_at)
      )`,

      // Chat messages table
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT,
        order_id INT,
        message TEXT NOT NULL,
        message_type ENUM('text', 'file', 'image') DEFAULT 'text',
        file_url VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        is_ai_response BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
        INDEX idx_sender_receiver (sender_id, receiver_id),
        INDEX idx_order (order_id),
        INDEX idx_created (created_at)
      )`,

      // Announcements table
      `CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_active (is_active),
        INDEX idx_priority (priority)
      )`,

      // FAQ table
      `CREATE TABLE IF NOT EXISTS faqs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question VARCHAR(500) NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_category (category),
        INDEX idx_active (is_active)
      )`,

      // Notifications table
      `CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('order_update', 'new_message', 'announcement', 'system') NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_read (is_read),
        INDEX idx_created (created_at)
      )`,

      // AI Knowledge Base table
      `CREATE TABLE IF NOT EXISTS ai_knowledge (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question VARCHAR(500) NOT NULL,
        answer TEXT NOT NULL,
        confidence_score DECIMAL(3,2) DEFAULT 0.50,
        source VARCHAR(100),
        tags JSON,
        is_active BOOLEAN DEFAULT TRUE,
        usage_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_question (question),
        INDEX idx_active (is_active)
      )`,

      // Announcement replies table
      `CREATE TABLE IF NOT EXISTS announcement_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        announcement_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        media_files JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_announcement (announcement_id),
        INDEX idx_user (user_id),
        INDEX idx_created (created_at)
      )`
    ];

    // Execute all queries
    for (const query of queries) {
      await pool.execute(query);
    }

    // Add missing columns to existing announcements table (for database migrations)
    const alterAnnouncementsQueries = [
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS summary TEXT`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS type ENUM('info', 'maintenance', 'update', 'urgent', 'promotion') DEFAULT 'info'`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS status ENUM('draft', 'published', 'scheduled', 'expired') DEFAULT 'draft'`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS target_audience ENUM('all', 'customers', 'admins', 'users') DEFAULT 'all'`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS scheduled_for DATETIME`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS expires_at DATETIME`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS tags JSON`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS media_files JSON`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS published_at DATETIME`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS views INT DEFAULT 0`,
      `ALTER TABLE announcements ADD COLUMN IF NOT EXISTS reads INT DEFAULT 0`,
      
      // Migration: Add request_number column to orders table
      `ALTER TABLE orders ADD COLUMN IF NOT EXISTS request_number VARCHAR(20)`,
      
      // Migration: Add index on request_number for faster lookups
      `CREATE INDEX IF NOT EXISTS idx_orders_request_number ON orders(request_number)`,


     ` ALTER TABLE categories
      ADD COLUMN parent_id INT DEFAULT NULL AFTER slug,
      ADD COLUMN icon VARCHAR(10) DEFAULT NULL AFTER parent_id
      ADD COLUMN color VARCHAR(20) DEFAULT '#0F4C5C' AFTER icon`,

        `CREATE INDEX idx_parent ON categories(parent_id)`
    ];

    for (const query of alterAnnouncementsQueries) {
      try {
        await pool.execute(query);
      } catch (error) {
        // Ignore "duplicate column" errors
        if (!error.message.includes('Duplicate column')) {
          console.warn('Migration warning:', error.message);
        }
      }
    }

    console.log('✅ Database tables created successfully');
    console.log('✅ Announcements table migrated with missing columns');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

module.exports = {
  pool,
  initializeDatabase,
  testConnection
};