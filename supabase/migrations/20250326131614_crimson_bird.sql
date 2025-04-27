/*
  # Add overdue remarks to transactions

  1. Changes
    - Add remarks column to transactions table for tracking overdue reasons
    - Add remarks_date column to track when remarks were added
    - Add remarks_by column to track who added the remarks
    - Add index for better query performance

  2. Notes
    - Remarks are optional and can be added for overdue books
    - Timestamps are automatically managed
*/

-- Add remarks columns
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS remarks text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS remarks_date timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS remarks_by text DEFAULT NULL;

-- Add index for remarks
CREATE INDEX IF NOT EXISTS idx_transactions_remarks ON transactions(remarks_date);