-- Migration: Add video message type to chat_messages
-- This 'video' as a valid value migration adds for message_type ENUM

-- Modify the ENUM to include 'video'
ALTER TABLE chat_messages MODIFY COLUMN message_type ENUM('text', 'file', 'image', 'video') DEFAULT 'text';

-- Also add form and form_response types for form messages
ALTER TABLE chat_messages MODIFY COLUMN message_type ENUM('text', 'file', 'image', 'video', 'form', 'form_response') DEFAULT 'text';

-- Migration completed successfully
