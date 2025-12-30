-- Fix for announcement views and replies
-- Run this SQL script to fix the issues

-- 1. Create a table to track unique views (prevents counting same user multiple times)
CREATE TABLE IF NOT EXISTS announcement_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    announcement_id INT NOT NULL,
    user_id INT,
    session_id VARCHAR(255),
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_announcement (announcement_id),
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_viewed (viewed_at)
);

-- 2. Add a reply_count column if it doesn't exist (for faster counting)
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS reply_count INT DEFAULT 0;

-- 3. Create a trigger to automatically update reply_count when replies are added/deleted
DELIMITER //

-- Trigger to increment reply_count when a reply is added
CREATE TRIGGER after_announcement_reply_insert
AFTER INSERT ON announcement_replies
FOR EACH ROW
BEGIN
    UPDATE announcements 
    SET reply_count = reply_count + 1 
    WHERE id = NEW.announcement_id;
END //

-- Trigger to decrement reply_count when a reply is deleted
CREATE TRIGGER after_announcement_reply_delete
AFTER DELETE ON announcement_replies
FOR EACH ROW
BEGIN
    UPDATE announcements 
    SET reply_count = GREATEST(0, reply_count - 1) 
    WHERE id = OLD.announcement_id;
END //

DELIMITER ;

-- 4. Initialize reply_count from existing data (one-time migration)
UPDATE announcements a
SET reply_count = (
    SELECT COUNT(*) 
    FROM announcement_replies r 
    WHERE r.announcement_id = a.id
);

-- 5. Add unique index to prevent duplicate views (optional - helps with performance)
-- CREATE UNIQUE INDEX idx_unique_view ON announcement_views (announcement_id, COALESCE(user_id, session_id));

SELECT 'Fix completed successfully!' as status;
