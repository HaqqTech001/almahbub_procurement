-- Migration: Fix null notification timestamps
-- This migration updates existing notifications with null created_at timestamps

-- Update notifications with null or empty created_at to have a default timestamp
UPDATE notifications 
SET created_at = NOW() 
WHERE created_at IS NULL 
   OR created_at = '' 
   OR created_at = 'null' 
   OR created_at = 'undefined';

-- Verify the fix
SELECT 
  COUNT(*) as total_notifications,
  SUM(CASE WHEN created_at IS NULL OR created_at = '' THEN 1 ELSE 0 END) as null_timestamps,
  MIN(created_at) as earliest_notification,
  MAX(created_at) as latest_notification
FROM notifications;

SELECT 'Notification timestamps fixed successfully!' as status;
