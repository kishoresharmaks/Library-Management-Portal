import React, { useState, useMemo } from 'react';
import { 
  BookUp, 
  BookDown, 
  Loader2, 
  Search, 
  Calendar,
  User,
  Book,
  CheckCircle2,
  X,
  Info,
  Clock,
  AlertCircle,
  UserCog
} from 'lucide-react';
import { useBooks, useTransactions } from '../hooks/useSupabase';
import { Book as BookType } from '../types/database';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function StaffTransactions() {
  const { books, loading: booksLoading, updateBook } = useBooks();
  const { addTransaction } = useTransactions();
  const { user } = useAuth();
  
  const [selectedBook, setSelectedBook] = useState<BookType | null>(null);
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [isIssuing, setIsIssuing] = useState(true);
  const [staffName, setStaffName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 15);
    return date.toISOString().split('T')[0];
  });

  // Filter books based on search query and availability
  const availableBooks = useMemo(() => {
    return books.filter(book => 
      book.is_available && 
      (book.name.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
       book.isbn.toLowerCase().includes(bookSearchQuery.toLowerCase()))
    );
  }, [books, bookSearchQuery]);

  const issuedBooks = useMemo(() => {
    return books.filter(book => 
      !book.is_available && 
      (book.name.toLowerCase().includes(bookSearchQuery.toLowerCase()) ||
       book.isbn.toLowerCase().includes(bookSearchQuery.toLowerCase()))
    );
  }, [books, bookSearchQuery]);

  // Clear selections when changing between issue and return modes
  React.useEffect(() => {
    setSelectedBook(null);
    setBookSearchQuery('');
    setStaffName('');
    setStaffId('');
  }, [isIssuing]);

  const handleIssueBook = async () => {
    if (!selectedBook || !staffName.trim() || !staffId.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // First, check if staff member exists in students table
      let { data: staffData } = await supabase
        .from('students')
        .select('id')
        .eq('reg_number', staffId)
        .single();

      // If staff member doesn't exist, create a new record
      if (!staffData) {
        const { data: newStaff, error: createError } = await supabase
          .from('students')
          .insert({
            reg_number: staffId,
            name: staffName,
            department: 'Staff', // Always set department as "Staff"
            status: 'active',
            contact_info: 'Staff Member',
            section: 'Staff',
            year: 1,
            semester: 1
          })
          .select('id')
          .single();

        if (createError) throw createError;
        staffData = newStaff;
      }

      await addTransaction({
        book_id: selectedBook.id,
        student_id: staffData.id,
        borrowed_date: new Date().toISOString(),
        due_date: new Date(dueDate).toISOString(),
        return_date: null,
        status: 'Borrowed',
        remarks: `Issued to staff member: ${staffName} (${staffId})`
      });

      await updateBook(selectedBook.id, { is_available: false });
      toast.success(`"${selectedBook.name}" issued successfully to ${staffName}`);
      
      // Reset form
      setSelectedBook(null);
      setStaffName('');
      setStaffId('');
      setBookSearchQuery('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to issue book. Please try again.');
    }
  };

  const handleReturnBook = async () => {
    if (!selectedBook) {
      toast.error('Please select a book to return');
      return;
    }

    try {
      const { data: activeTransaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('book_id', selectedBook.id)
        .eq('status', 'Borrowed')
        .order('borrowed_date', { ascending: false })
        .limit(1)
        .single();

      if (!activeTransaction) {
        toast.error('No active borrowing record found for this book');
        return;
      }

      await addTransaction({
        book_id: selectedBook.id,
        student_id: activeTransaction.student_id,
        borrowed_date: activeTransaction.borrowed_date,
        due_date: activeTransaction.due_date,
        return_date: new Date().toISOString(),
        status: 'Returned',
        remarks: `Returned by staff member (processed by ${user?.email})`
      });

      await updateBook(selectedBook.id, { is_available: true });
      toast.success(`"${selectedBook.name}" returned successfully`);
      
      // Reset selection
      setSelectedBook(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error returning book. Please try again.');
    }
  };

  if (booksLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        <p className="text-gray-600 font-medium">Loading library data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Mode Toggle */}
      <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {isIssuing ? (
                <BookUp className="h-7 w-7" />
              ) : (
                <BookDown className="h-7 w-7" />
              )}
              {isIssuing ? 'Issue Books to Staff' : 'Return Staff Books'}
            </h2>
            <p className="text-purple-100 mt-1">
              {isIssuing 
                ? 'Issue books to staff members' 
                : 'Process staff book returns'}
            </p>
          </div>
          
          {/* Mode Toggle Buttons */}
          <div className="flex gap-2 bg-purple-800/50 p-1 rounded-lg">
            <button
              onClick={() => setIsIssuing(true)}
              className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                isIssuing
                  ? 'bg-white text-purple-900 shadow-md'
                  : 'bg-transparent text-white hover:bg-purple-800'
              }`}
            >
              <BookUp className="h-4 w-4 mr-2" />
              Issue
            </button>
            <button
              onClick={() => setIsIssuing(false)}
              className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                !isIssuing
                  ? 'bg-white text-purple-900 shadow-md'
                  : 'bg-transparent text-white hover:bg-purple-800'
              }`}
            >
              <BookDown className="h-4 w-4 mr-2" />
              Return
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Books Section */}
        <div className={`bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 ${isIssuing ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Book className="h-5 w-5 text-purple-700" />
              {isIssuing ? 'Available Books' : 'Issued Books'}
            </h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by book title or Access No"
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Results count and filter info */}
          <div className="px-5 py-2 bg-purple-50 border-b text-sm flex justify-between items-center">
            <span className="text-purple-900">
              {(isIssuing ? availableBooks : issuedBooks).length} books found
            </span>
            {bookSearchQuery && (
              <div className="flex items-center gap-1 text-purple-700">
                <Info className="h-4 w-4" />
                <span>Filtered by: "{bookSearchQuery}"</span>
                <button 
                  onClick={() => setBookSearchQuery('')}
                  className="ml-1 p-1 rounded-full hover:bg-purple-100"
                >
                  <X className="h-3 w-3 text-purple-500" />
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {(isIssuing ? availableBooks : issuedBooks).length > 0 ? (
              (isIssuing ? availableBooks : issuedBooks).map((book) => (
                <div
                  key={book.id}
                  onClick={() => setSelectedBook(book)}
                  className={`p-4 cursor-pointer transition-all duration-200 hover:bg-purple-50 ${
                    selectedBook?.id === book.id
                      ? 'bg-purple-50 border-l-4 border-purple-500'
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      selectedBook?.id === book.id ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      <Book className={`h-6 w-6 ${
                        selectedBook?.id === book.id ? 'text-purple-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{book.name}</h4>
                        {selectedBook?.id === book.id && (
                          <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">By {book.author}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">
                          Access No: {book.isbn}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center">
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-purple-50 mb-4">
                  <Book className="h-8 w-8 text-purple-300" />
                </div>
                <p className="text-purple-800 text-lg mb-2">No {isIssuing ? 'available' : 'issued'} books found</p>
                <p className="text-gray-400 text-sm">
                  {bookSearchQuery 
                    ? 'Try adjusting your search criteria'
                    : isIssuing ? 'All books are currently issued' : 'All books are currently in the library'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Staff Details or Return Details */}
        {isIssuing ? (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 lg:col-span-3">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <UserCog className="h-5 w-5 text-purple-700" />
                Staff Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="staffName" className="block text-sm font-medium text-gray-700 mb-1">
                    Staff Name
                  </label>
                  <input
                    type="text"
                    id="staffName"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="Enter staff member's name"
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="staffId" className="block text-sm font-medium text-gray-700 mb-1">
                    Staff ID
                  </label>
                  <input
                    type="text"
                    id="staffId"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    placeholder="Enter staff ID or reference number"
                    className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-purple-50">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-5 w-5 text-purple-600 mr-2" />
                <span className="text-sm text-purple-800">Staff members can borrow books for an extended period</span>
              </div>
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-600" />
                  <input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 lg:col-span-2">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                <BookDown className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Return Staff Book</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Select a book from the list to return it to the library. The system will automatically update the inventory.
              </p>
              
              {selectedBook ? (
                <div className="w-full p-5 rounded-lg bg-purple-50 text-left">
                  <h4 className="text-sm font-medium text-purple-800 mb-4 flex items-center gap-2">
                    <Info className="h-4 w-4 text-purple-600" />
                    Selected Book Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2 pb-2 border-b border-purple-100">
                      <span className="w-20 text-purple-700">Title:</span>
                      <span className="font-medium text-gray-900">{selectedBook.name}</span>
                    </div>
                    <div className="flex items-start gap-2 pb-2 border-b border-purple-100">
                      <span className="w-20 text-purple-700">Author:</span>
                      <span className="text-gray-700">{selectedBook.author}</span>
                    </div>
                    <div className="flex items-start gap-2 pb-2 border-b border-purple-100">
                      <span className="w-20 text-purple-700">Access No:</span>
                      <span className="text-gray-700">{selectedBook.isbn}</span>
                    </div>
                    
                    <div className="flex items-center mt-4 pt-2">
                      <AlertCircle className="h-4 w-4 text-purple-500 mr-2" />
                      <span className="text-sm text-purple-700">
                        This will mark the book as available in inventory
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full p-5 rounded-lg bg-purple-50 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-purple-600">
                    <AlertCircle className="h-5 w-5" />
                    <span>Please select a book from the list</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Panel */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex-1">
            {(selectedBook || staffName || staffId) ? (
              <div className="space-y-2">
                {selectedBook && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Book className="h-4 w-4 text-purple-600" />
                    <span>Selected Book:</span>
                    <span className="font-semibold text-gray-900">{selectedBook.name}</span>
                  </div>
                )}
                {isIssuing && staffName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="h-4 w-4 text-purple-600" />
                    <span>Staff Name:</span>
                    <span className="font-semibold text-gray-900">{staffName}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <Info className="h-4 w-4" />
                <span>{isIssuing ? 'Select a book and enter staff details' : 'Select a book to return'}</span>
              </div>
            )}
          </div>

          <button
            onClick={isIssuing ? handleIssueBook : handleReturnBook}
            disabled={!selectedBook || (isIssuing && (!staffName || !staffId))}
            className={`inline-flex items-center px-6 py-3 rounded-lg text-sm font-medium shadow-md transition-all duration-200 ${
              isIssuing
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 disabled:opacity-50'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 disabled:opacity-50'
            } disabled:cursor-not-allowed min-w-[160px] justify-center`}
          >
            {isIssuing ? (
              <>
                <BookUp className="h-5 w-5 mr-2" />
                Issue Book
              </>
            ) : (
              <>
                <BookDown className="h-5 w-5 mr-2" />
                Return Book
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffTransactions;