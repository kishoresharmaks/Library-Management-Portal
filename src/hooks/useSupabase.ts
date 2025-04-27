import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Book, Student, Transaction } from '../types/database';
import toast from 'react-hot-toast';
import { useRefresh } from './useRefresh';

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger, triggerRefresh } = useRefresh();

  useEffect(() => {
    const cached = localStorage.getItem('books');
    if (cached) {
      setBooks(JSON.parse(cached));
      setLoading(false);
    }
    fetchBooks();
  }, [refreshTrigger]);

  async function fetchBooks() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
      localStorage.setItem('books', JSON.stringify(data || []));
    } catch (error) {
      toast.error('Error loading books');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addBook(book: Omit<Book, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { error } = await supabase.from('books').insert([book]);
      if (error) throw error;
      toast.success('Book added successfully');
      triggerRefresh();
    } catch (error) {
      toast.error('Error adding book');
      console.error('Error:', error);
      throw error;
    }
  }

  async function updateBook(id: string, updates: Partial<Book>) {
    try {
      const { error } = await supabase
        .from('books')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      toast.success('Book updated successfully');
      triggerRefresh();
    } catch (error) {
      toast.error('Error updating book');
      console.error('Error:', error);
      throw error;
    }
  }

  async function deleteBook(id: string) {
    try {
      // Check if the book has any active transactions
      const { data: activeTransactions, error: checkError } = await supabase
        .from('transactions')
        .select('id')
        .eq('book_id', id)
        .eq('status', 'Borrowed')
        .limit(1);

      if (checkError) throw checkError;

      if (activeTransactions && activeTransactions.length > 0) {
        throw new Error('Cannot delete book: It is currently borrowed');
      }

      // Delete the book (transactions will be deleted automatically by the trigger)
      const { error: deleteError } = await supabase
        .from('books')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Book and related records deleted successfully');
      triggerRefresh();
    } catch (error: any) {
      if (error.message.includes('currently borrowed')) {
        toast.error(error.message);
      } else {
        toast.error('Error deleting book');
        console.error('Error:', error);
      }
      throw error;
    }
  }

  useEffect(() => {
    localStorage.setItem('books', JSON.stringify(books));
  }, [books]);

  return { books, loading, addBook, updateBook, deleteBook };
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger, triggerRefresh } = useRefresh();

  useEffect(() => {
    const cached = localStorage.getItem('students');
    if (cached) {
      setStudents(JSON.parse(cached));
      setLoading(false);
    }
    fetchStudents();
  }, [refreshTrigger]);

  async function fetchStudents() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
      localStorage.setItem('students', JSON.stringify(data || []));
    } catch (error) {
      toast.error('Error loading students');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addStudent(student: Omit<Student, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { error } = await supabase.from('students').insert([student]);
      if (error) throw error;
      toast.success('Student added successfully');
      triggerRefresh();
    } catch (error) {
      toast.error('Error adding student');
      console.error('Error:', error);
      throw error;
    }
  }

  async function updateStudent(id: string, updates: Partial<Student>) {
    try {
      const { error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      toast.success('Student updated successfully');
      triggerRefresh();
    } catch (error) {
      toast.error('Error updating student');
      console.error('Error:', error);
      throw error;
    }
  }

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
  }, [students]);

  return { students, loading, addStudent, updateStudent };
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger, triggerRefresh } = useRefresh();

  useEffect(() => {
    const cached = localStorage.getItem('transactions');
    if (cached) {
      setTransactions(JSON.parse(cached));
      setLoading(false);
    }
    fetchTransactions();
  }, [refreshTrigger]);

  async function fetchTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          book:books(*),
          student:students(*)
        `)
        .order('borrowed_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
      localStorage.setItem('transactions', JSON.stringify(data || []));
    } catch (error) {
      toast.error('Error loading transactions');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addTransaction(transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) {
    try {
      if (transaction.status === 'Returned') {
        // Find the active borrow transaction for this book
        const { data: existingTransactions, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('book_id', transaction.book_id)
          .eq('status', 'Borrowed')
          .order('borrowed_date', { ascending: false });

        if (fetchError) throw fetchError;
        if (!existingTransactions?.length) {
          throw new Error('No active borrowing found for this book');
        }

        const mostRecentBorrow = existingTransactions[0];

        // Update the existing transaction with return date and status
        // while preserving the original borrowed_date and due_date
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            return_date: transaction.return_date,
            status: 'Returned'
          })
          .eq('id', mostRecentBorrow.id);

        if (updateError) throw updateError;

        // Update the book's availability
        const { error: bookError } = await supabase
          .from('books')
          .update({ is_available: true })
          .eq('id', transaction.book_id);

        if (bookError) throw bookError;
      } else {
        // For new borrows, check if the book is available
        const { data: book, error: bookError } = await supabase
          .from('books')
          .select('is_available')
          .eq('id', transaction.book_id)
          .single();

        if (bookError) throw bookError;
        if (!book?.is_available) {
          throw new Error('Book is not available for borrowing');
        }

        // Create new borrow transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert([transaction]);

        if (transactionError) throw transactionError;

        // Update book availability
        const { error: updateError } = await supabase
          .from('books')
          .update({ is_available: false })
          .eq('id', transaction.book_id);

        if (updateError) throw updateError;
      }

      toast.success(
        transaction.status === 'Returned'
          ? 'Book returned successfully'
          : 'Book borrowed successfully'
      );
      triggerRefresh();
    } catch (error: any) {
      if (error.message.includes('Book is not available')) {
        toast.error('This book is not available for borrowing');
      } else if (error.message.includes('No active borrowing')) {
        toast.error('No active borrowing found for this book');
      } else {
        toast.error('Error processing transaction');
      }
      console.error('Error:', error);
      throw error;
    }
  }

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    try {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
      toast.success('Transaction updated successfully');
      triggerRefresh();
    } catch (error) {
      toast.error('Error updating transaction');
      console.error('Error:', error);
      throw error;
    }
  }

  async function addOverdueRemarks(id: string, remarks: string, remarksBy: string) {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          remarks,
          remarks_date: new Date().toISOString(),
          remarks_by: remarksBy
        })
        .eq('id', id);

      if (error) throw error;
      toast.success('Remarks added successfully');
      triggerRefresh();
    } catch (error) {
      toast.error('Error adding remarks');
      console.error('Error:', error);
      throw error;
    }
  }

  return { 
    transactions, 
    loading, 
    addTransaction, 
    updateTransaction,
    addOverdueRemarks 
  };
}