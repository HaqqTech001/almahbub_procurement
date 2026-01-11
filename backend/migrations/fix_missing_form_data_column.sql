-- Fix: Add missing form_data column to chat_messages table
-- Run this SQL command in your database (phpMyAdmin, MySQL Workbench, or command line)

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS form_data JSON NULL;
