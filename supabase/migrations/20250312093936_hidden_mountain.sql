/*
  # Update transactions table structure

  1. Changes
    - Add NOT NULL constraints where appropriate
    - Update status check constraint to match application values
    - Add indexes for better query performance
    - Add trigger to update book availability on transaction status change

  2. Security
    - Maintain existing RLS policies
    - Ensure data consistency with triggers
*/

-- Update status check constraint to match application values
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
  CHECK (status IN ('Borrowed', 'Returned'));

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_transactions_book_id ON transactions(book_id);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_borrowed_date ON transactions(borrowed_date);

-- Create trigger function to update book availability
CREATE OR REPLACE FUNCTION update_book_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Borrowed' THEN
    UPDATE books SET is_available = false WHERE id = NEW.book_id;
  ELSIF NEW.status = 'Returned' THEN
    UPDATE books SET is_available = true WHERE id = NEW.book_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic book availability updates
DROP TRIGGER IF EXISTS update_book_availability_trigger ON transactions;
CREATE TRIGGER update_book_availability_trigger
  AFTER INSERT OR UPDATE OF status ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_book_availability();

-- Add function to validate book availability before issuing
CREATE OR REPLACE FUNCTION validate_book_issue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Borrowed' THEN
    IF EXISTS (
      SELECT 1 FROM books 
      WHERE id = NEW.book_id 
      AND is_available = false
    ) THEN
      RAISE EXCEPTION 'Book is not available for borrowing';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for book availability validation
DROP TRIGGER IF EXISTS validate_book_issue_trigger ON transactions;
CREATE TRIGGER validate_book_issue_trigger
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION validate_book_issue();