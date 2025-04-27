/*
  # Add new columns to students table

  1. Changes
    - Add section column
    - Add year column
    - Add semester column
    - Add email column
    - Add status column with check constraint

  2. Notes
    - All new columns are made NOT NULL with default values
    - Status is restricted to specific values via check constraint
*/

DO $$ BEGIN
  -- Add section column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'section'
  ) THEN
    ALTER TABLE students ADD COLUMN section text NOT NULL DEFAULT 'A';
  END IF;

  -- Add year column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'year'
  ) THEN
    ALTER TABLE students ADD COLUMN year integer NOT NULL DEFAULT 1;
  END IF;

  -- Add semester column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'semester'
  ) THEN
    ALTER TABLE students ADD COLUMN semester integer NOT NULL DEFAULT 1;
  END IF;

  -- Add email column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'email'
  ) THEN
    ALTER TABLE students ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;

  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'status'
  ) THEN
    ALTER TABLE students ADD COLUMN status text NOT NULL DEFAULT 'active';
    ALTER TABLE students ADD CONSTRAINT students_status_check 
      CHECK (status IN ('active', 'inactive', 'graduated'));
  END IF;
END $$;