-- Migration: Add address fields to orders table
-- This migration adds structured address fields to the orders table
-- Run this SQL to update the database schema

-- Add new address columns to the orders table (each statement is independent for safety)
ALTER TABLE orders ADD COLUMN delivery_street VARCHAR(255) DEFAULT '';
ALTER TABLE orders ADD COLUMN delivery_city VARCHAR(100) DEFAULT '';
ALTER TABLE orders ADD COLUMN delivery_state VARCHAR(100) DEFAULT '';
ALTER TABLE orders ADD COLUMN delivery_zipcode VARCHAR(20) DEFAULT '';
ALTER TABLE orders ADD COLUMN delivery_country VARCHAR(100) DEFAULT '';

-- Note: If columns already exist, the above statements will error but that's OK
-- The migration runner will ignore "Duplicate column name" errors

-- Update existing records to populate the new fields from the old delivery_address field
UPDATE orders
SET delivery_street = delivery_address
WHERE (delivery_street = '' OR delivery_street IS NULL)
  AND delivery_address IS NOT NULL
  AND delivery_address != '';

-- Set default country for existing records
UPDATE orders
SET delivery_country = 'Nigeria'
WHERE delivery_country IS NULL OR delivery_country = '';

-- Verify the changes
SELECT id, request_number, delivery_street, delivery_city, delivery_state, delivery_zipcode, delivery_country
FROM orders
WHERE delivery_street != '' OR delivery_city != ''
LIMIT 10;
