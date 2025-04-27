/*
  # Add cascade delete trigger for books

  1. Changes
    - Add trigger to automatically delete related transaction records when a book is deleted
    - Ensure data consistency by cleaning up related records

  2. Security
    - Maintains existing RLS policies
    - Ensures proper cleanup of related data
*/

-- Create trigger function for cascade delete
CREATE OR REPLACE FUNCTION delete_book_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all transactions related to the book
  DELETE FROM transactions WHERE book_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for cascade delete
DROP TRIGGER IF EXISTS book_delete_cascade ON books;
CREATE TRIGGER book_delete_cascade
  BEFORE DELETE ON books
  FOR EACH ROW
  EXECUTE FUNCTION delete_book_transactions();