/*
  # Add contact information to students table

  1. Changes
    - Add contact_info column to students table
    - Update existing contact information

  2. Notes
    - Preserves existing contact_number data
    - Adds new column for additional contact details
*/

DO $$ BEGIN
  -- Add contact_info column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE students ADD COLUMN contact_info text NOT NULL DEFAULT '';
  END IF;
END $$;