-- Migration: Add online status, read receipts, and form support
-- Run this file to update the database schema

-- Add is_online and last_active_at columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP NULL;

-- Add read_at and form_data columns to chat_messages table
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP NULL;
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS form_data JSON NULL;

-- Create announcement_reads table to track which announcements users have read
CREATE TABLE IF NOT EXISTS announcement_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    announcement_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_announcement (user_id, announcement_id),
    INDEX idx_user_id (user_id),
    INDEX idx_announcement_id (announcement_id),
    INDEX idx_read_at (read_at)
);

-- Update message_type enum to include 'form' if not already present
-- Note: This may fail if the enum already has different values, adjust as needed
-- ALTER TABLE chat_messages MODIFY COLUMN message_type ENUM('text', 'file', 'form') DEFAULT 'text';

-- Create index for faster read status queries
CREATE INDEX IF NOT EXISTS idx_messages_read_status ON chat_messages(receiver_id, is_read, read_at);

-- Create index for online status queries
CREATE INDEX IF NOT EXISTS idx_users_online_status ON users(is_online, last_active_at);

-- Update existing messages to set read_at from is_read
UPDATE chat_messages SET read_at = NOW() WHERE is_read = TRUE AND read_at IS NULL;

-- Update is_online based on recent activity (users active in last 5 minutes)
UPDATE users SET is_online = TRUE WHERE last_active_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE);

COMMIT;
