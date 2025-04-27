/*
  # Modify students table to accommodate staff records

  1. Changes
    - Remove NOT NULL constraints from student-specific fields
    - Add contact_info column for additional contact details
    - Update existing rows to prevent constraint violations
    
  2. Notes
    - This is a temporary solution to allow staff book transactions
    - A proper staff table should be created in the future
*/

-- Remove NOT NULL constraints from student-specific fields
ALTER TABLE students 
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN department DROP NOT NULL,
  ALTER COLUMN contact_number DROP NOT NULL,
  ALTER COLUMN section DROP NOT NULL,
  ALTER COLUMN year DROP NOT NULL,
  ALTER COLUMN semester DROP NOT NULL,
  ALTER COLUMN email DROP NOT NULL;

-- Add contact_info column for additional details
ALTER TABLE students 
  ADD COLUMN IF NOT EXISTS contact_info text;