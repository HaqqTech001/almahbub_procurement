-- Migration: Add priority field to orders table
-- This migration adds a priority column to store request urgency level

ALTER TABLE orders ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';

-- Set default priority for existing records
UPDATE orders SET priority = 'medium' WHERE priority IS NULL;
