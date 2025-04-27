/*
  # Add due date to transactions

  1. Changes
    - Add due_date column to transactions table
    - Add index for due_date for better query performance
*/

-- Add due_date column if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE transactions ADD COLUMN due_date timestamptz;
  END IF;
END $$;

-- Add index for due_date
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);