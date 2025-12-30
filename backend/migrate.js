const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'almahbub_procurement',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('Adding is_active column to users table...');

    // Add is_active column
    await pool.execute(
      "ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER role"
    );

    console.log('Column added successfully!');

    // Update existing admin users to be active
    await pool.execute("UPDATE users SET is_active = 1 WHERE role = 'admin'");
    console.log('Admin users updated to active!');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists. Migration not needed.');
    }
  } finally {
    await pool.end();
  }
}

runMigration();
