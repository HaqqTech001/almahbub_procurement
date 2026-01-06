-- Migration: Add budget fields to orders table
-- This migration adds budget tracking fields to the orders table
-- Run this SQL to update the database schema

-- Add new budget columns to the orders table (each statement is independent for safety)
ALTER TABLE orders ADD COLUMN budget_currency VARCHAR(10) DEFAULT 'NGN';
ALTER TABLE orders ADD COLUMN budget_amount DECIMAL(15, 2) DEFAULT NULL;

-- Note: If columns already exist, the above statements will error but that's OK
-- The migration runner will ignore "Duplicate column name" errors

-- Update existing records with default currency
UPDATE orders
SET budget_currency = 'NGN'
WHERE budget_currency IS NULL;

-- Verify the changes
SELECT id, request_number, budget_currency, budget_amount
FROM orders
LIMIT 10;
