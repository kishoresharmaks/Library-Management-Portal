export interface Book {
  id: string;
  isbn: string;
  name: string;
  author: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  reg_number: string;
  name?: string | null;
  department?: string | null;
  section?: string | null;
  year?: number | null;
  semester?: number | null;
  contact_number?: string | null;
  contact_info?: string | null;
  email?: string | null;
  status: 'active' | 'inactive' | 'graduated';
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  book_id: string;
  student_id: string;
  borrowed_date: string;
  due_date: string;
  return_date: string | null;
  status: 'Borrowed' | 'Returned';
  remarks?: string | null;
  remarks_date?: string | null;
  remarks_by?: string | null;
  created_at: string;
  updated_at: string;
  book?: Book;
  student?: Student;
}