import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Send, 
  X, 
  Loader2, 
  Book, 
  ChevronDown, 
  Info, 
  BookText,
  User,
  GraduationCap,
  Building2,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RenewalChatbotProps {
  onClose: () => void;
}

interface Message {
  type: 'user' | 'bot' | 'error';
  text: string | any;
  timestamp: Date;
}

export function RenewalChatbot({ onClose }: RenewalChatbotProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'bot', 
      text: 'Hello! I can help you check book availability or find student details. Enter a book title/access number to check availability, or enter a registration number (starting with 6178) to view student details.',
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (chatContainerRef.current) {
        const isMobile = window.innerWidth < 640;
        if (isMobile && !isMinimized) {
          chatContainerRef.current.classList.remove('w-96');
          chatContainerRef.current.classList.add('w-full', 'max-w-md');
        } else if (!isMobile) {
          chatContainerRef.current.classList.remove('w-full', 'max-w-md');
          chatContainerRef.current.classList.add('w-96');
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = useCallback((type: 'user' | 'bot' | 'error', text: string | any) => {
    setMessages(prev => [...prev, { type, text, timestamp: new Date() }]);
  }, []);

  const isRegistrationNumber = (query: string): boolean => {
    return /^6178\d{10}$/.test(query.trim());
  };

  const fetchStudentDetails = async (regNumber: string) => {
    try {
      setError(null);
      // Fetch student details
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('reg_number', regNumber)
        .single();

      if (studentError) {
        throw new Error(`Failed to fetch student: ${studentError.message}`);
      }
      
      if (!student) {
        addMessage('bot', 'No student found with this registration number.');
        return;
      }

      // Add student details message
      addMessage('bot', {
        type: 'student',
        student,
        message: `Found student details for ${student.name || 'Unknown'}`
      });

      // Fetch transaction history
      const { data: transactions, error: transactionError } = await supabase
        .from('transactions')
        .select(`
          *,
          book:books(*)
        `)
        .eq('student_id', student.id)
        .order('borrowed_date', { ascending: false });

      if (transactionError) {
        throw new Error(`Failed to fetch transactions: ${transactionError.message}`);
      }

      // Group transactions by status
      const currentBorrowings = transactions.filter(t => t.status === 'Borrowed');
      const history = transactions.filter(t => t.status === 'Returned');

      if (currentBorrowings.length > 0) {
        addMessage('bot', {
          type: 'borrowings',
          transactions: currentBorrowings,
          message: 'Currently borrowed books:'
        });
      }

      if (history.length > 0) {
        addMessage('bot', {
          type: 'history',
          transactions: history,
          message: 'Borrowing history:'
        });
      }

      if (transactions.length === 0) {
        addMessage('bot', 'No borrowing history found for this student.');
      }

    } catch (error) {
      console.error('Error fetching student details:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      addMessage('error', 'Sorry, I encountered an error while fetching student details. Please try again later.');
    }
  };

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      addMessage('bot', 'Please enter a valid book title, access number, or registration number.');
      return;
    }

    setLoading(true);
    setError(null);
    addMessage('user', trimmedQuery);

    try {
      if (isRegistrationNumber(trimmedQuery)) {
        await fetchStudentDetails(trimmedQuery);
      } else {
        // Book search logic
        const { data: books, error: searchError } = await supabase
          .from('books')
          .select('*')
          .or(`name.ilike.%${trimmedQuery}%,isbn.ilike.%${trimmedQuery}%`)
          .limit(5);

        if (searchError) {
          throw new Error(`Failed to search books: ${searchError.message}`);
        }

        if (!books || books.length === 0) {
          addMessage('bot', 'No books found matching your search. Please try with a different title or access number.');
          return;
        }

        addMessage('bot', `I found ${books.length} book${books.length > 1 ? 's' : ''} matching your search:`);

        for (const book of books) {
          if (book.is_available) {
            addMessage('bot', {
              bookName: book.name,
              isbn: book.isbn,
              status: 'available',
              message: `"${book.name}" is currently available for checkout.`
            });
          } else {
            try {
              const { data: transaction, error: transactionError } = await supabase
                .from('transactions')
                .select(`
                  *,
                  student:students(name, reg_number)
                `)
                .eq('book_id', book.id)
                .eq('status', 'Borrowed')
                .order('borrowed_date', { ascending: false })
                .limit(1)
                .single();

              if (transactionError && transactionError.code !== 'PGRST116') { // Not found error
                throw new Error(`Failed to fetch transaction: ${transactionError.message}`);
              }

              if (transaction) {
                const dueDate = new Date(transaction.due_date);
                const isOverdue = dueDate < new Date();
                
                addMessage('bot', {
                  bookName: book.name,
                  isbn: book.isbn,
                  status: isOverdue ? 'overdue' : 'borrowed',
                  dueDate: dueDate.toLocaleDateString(),
                  borrower: transaction.student?.name || 'Unknown',
                  regNumber: transaction.student?.reg_number || 'N/A',
                  message: `"${book.name}" is currently checked out${isOverdue ? ' and overdue' : ''}.`
                });
              } else {
                addMessage('bot', {
                  bookName: book.name,
                  isbn: book.isbn,
                  status: 'borrowed',
                  message: `"${book.name}" is currently checked out.`
                });
              }
            } catch (error) {
              console.error('Error fetching transaction:', error);
              addMessage('bot', {
                bookName: book.name,
                isbn: book.isbn,
                status: 'borrowed',
                message: `"${book.name}" is currently checked out. (Transaction details unavailable)`
              });
            }
          }
        }
      }

      addMessage('bot', 'Can I help you find something else?');
      
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      addMessage('error', 'Sorry, I encountered an error while searching. Please try again later.');
    } finally {
      setLoading(false);
      setSearchQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && searchQuery.trim()) {
      handleSearch();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    // Focus the input when maximizing
    if (isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const handleRetry = () => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      // If there's no query, just clear error state
      setError(null);
    }
  };

  if (!isOpen) return null;

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: Message, index: number) => {
    // User message
    if (message.type === 'user') {
      return (
       <div 
  key={index} 
  className="flex justify-end mb-4 animate-fadeIn transition-all duration-200 ease-out"
>
  <div className="flex flex-col items-end max-w-[90%] sm:max-w-[80%]">
    <div className={
      `relative bg-blue-600 text-white rounded-2xl px-4 py-2 shadow-sm
      break-words whitespace-pre-wrap
      before:content-[''] before:absolute before:border-8 before:border-transparent 
      before:border-l-blue-600 before:right-0 before:top-1/2 before:-translate-y-1/2 before:translate-x-1
      hover:shadow-md transition-all duration-150`
    }>
      {message.text}
    </div>
    <span className="text-xs text-gray-500 mt-1 mr-1.5 opacity-80">
      {formatTime(message.timestamp)}
    </span>
  </div>
</div>
      );
    }

    // Error message
    if (message.type === 'error') {
      return (
        <div key={index} className="flex justify-start mb-4 animate-fadeIn">
          <div className="flex flex-col">
            <div className="bg-red-50 text-red-800 border border-red-200 rounded-2xl px-4 py-3 max-w-[85%] shadow-sm">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{message.text}</p>
                  <button 
                    onClick={handleRetry} 
                    className="mt-2 flex items-center text-sm text-red-700 hover:text-red-900 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry Search
                  </button>
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1 ml-1">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      );
    }

    // Complex bot messages (objects)
    if (message.text && typeof message.text === 'object') {
      // Student details card
      if (message.text.type === 'student') {
        const { student } = message.text;
        return (
           <div key={index} className="flex justify-start mb-4 animate-fadeIn">
            <div className="flex flex-col w-full sm:w-auto">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-full sm:max-w-[85%] shadow-sm">
                {/* Student Header with Avatar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{student.name || 'Unknown'}</h4>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-500 truncate mr-2">{student.reg_number}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        student.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : student.status === 'inactive'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student Information Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 border-t border-gray-100 pt-3">
                  {student.department && (
                    <div className="flex items-center text-sm text-gray-600 truncate">
                      <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{student.department}</span>
                    </div>
                  )}
                  {student.year && (
                    <div className="flex items-center text-sm text-gray-600 truncate">
                      <GraduationCap className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">
                        Year {student.year}
                        {student.section && `, Section ${student.section}`}
                      </span>
                    </div>
                  )}
                  {student.contact_number && (
                    <div className="flex items-center text-sm text-gray-600 truncate">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{student.contact_number}</span>
                    </div>
                  )}
                  {student.email && (
                    <div className="flex items-center text-sm text-gray-600 truncate">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{student.email}</span>
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-1 ml-1">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        );
      }

      // Transaction lists (borrowings/history)
      if (message.text.type === 'borrowings' || message.text.type === 'history') {
        const { transactions, message: headerMessage } = message.text;
        return (
          <div key={index} className="flex justify-start mb-4 animate-fadeIn">
            <div className="flex flex-col">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-[85%] shadow-sm">
                <h4 className="text-sm font-medium text-gray-900 mb-3">{headerMessage}</h4>
                <div className="space-y-3">
                  {transactions.map((transaction, idx) => (
                    <div key={idx} className="border-t border-gray-100 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Book className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.book?.name || 'Unknown Book'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Access No: {transaction.book?.isbn || 'N/A'}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                            <span className="flex items-center text-gray-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              Borrowed: {new Date(transaction.borrowed_date).toLocaleDateString()}
                            </span>
                            {transaction.status === 'Borrowed' ? (
                              <span className={`flex items-center ${
                                new Date(transaction.due_date) < new Date() 
                                  ? 'text-red-600' 
                                  : 'text-amber-600'
                              }`}>
                                <Clock className="h-3 w-3 mr-1" />
                                Due: {new Date(transaction.due_date).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="flex items-center text-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Returned: {transaction.return_date ? new Date(transaction.return_date).toLocaleDateString() : 'N/A'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <span className="text-xs text-gray-500 mt-1 ml-1">
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        );
      }

      // Book info rendering
      const { bookName, isbn, status, dueDate, borrower, regNumber, message: bookMessage } = message.text;
      return (
        <div key={index} className="flex justify-start mb-4 animate-fadeIn">
          <div className="flex flex-col">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 max-w-[85%] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  status === 'available' ? 'bg-green-100' : 
                  status === 'overdue' ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  <Book className={`h-4 w-4 ${
                    status === 'available' ? 'text-green-600' : 
                    status === 'overdue' ? 'text-red-600' : 'text-amber-500'
                  }`} />
                </div>
                <h4 className="font-medium text-gray-900 line-clamp-2">{bookName}</h4>
              </div>
              <p className="text-sm text-gray-700 mb-2">{bookMessage}</p>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Access No: {isbn}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  status === 'available' ? 'bg-green-100 text-green-800' : 
                  status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {status === 'available' ? 'Available' : 
                   status === 'overdue' ? `Overdue (${dueDate})` : `Due: ${dueDate}`}
                </span>
              </div>
              {status !== 'available' && borrower && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center text-xs text-gray-600">
                    <User className="h-3 w-3 mr-1" />
                    Borrowed by: {borrower} ({regNumber})
                  </div>
                </div>
              )}
              {status === 'available' && (
                <button 
                  className="mt-3 text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                  aria-label="View borrowing details"
                >
                  <BookText className="h-3 w-3" /> Available To Borrow
                </button>
              )}
            </div>
            <span className="text-xs text-gray-500 mt-1 ml-1">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      );
    }
    
    // Simple text message from bot
    return (
      <div key={index} className="flex justify-start mb-4 animate-fadeIn">
        <div className="flex flex-col">
          <div className="bg-gray-100 rounded-2xl px-4 py-2 max-w-[85%] shadow-sm">
            {message.text}
          </div>
          <span className="text-xs text-gray-500 mt-1 ml-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={chatContainerRef}
      className={`fixed ${isMinimized ? 'bottom-4' : 'bottom-0 sm:bottom-4'} right-0 sm:right-4 w-full sm:w-96 bg-white rounded-t-lg sm:rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden transition-all duration-300 ease-in-out`}
      style={{ 
        height: isMinimized ? '60px' : 'auto', 
        maxHeight: isMinimized ? '60px' : '600px',
        maxWidth: '150%'
      }}
      role="dialog"
      aria-labelledby="chatbot-title"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-b border-blue-500"
        role="banner"
      >
        <div className="flex items-center space-x-2">
          <div className="bg-white bg-opacity-20 rounded-full p-1.5">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <h3 id="chatbot-title" className="text-lg font-semibold">Library Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMinimize}
            className="text-white hover:bg-white hover:bg-opacity-20 transition-colors p-1.5 rounded-full"
            aria-label={isMinimized ? "Expand chatbot" : "Minimize chatbot"}
          >
            <ChevronDown className={`h-5 w-5 transform transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 transition-colors p-1.5 rounded-full"
            aria-label="Close chatbot"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Message container - conditionally rendered based on minimized state */}
      {!isMinimized && (
        <>
          <div 
            className="p-4 h-96 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
            role="log"
            aria-live="polite"
          >
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </div>

          {/* Error banner */}
          {error && (
            <div className="px-4 py-2 bg-red-50 border-t border-b border-red-200">
              <div className="flex items-center text-sm text-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <p>Error: {error}</p>
              </div>
            </div>
          )}

          {/* Input */}
         <div className="p-4 border-t border-gray-200 bg-white shadow-sm">
  <div className="flex items-center gap-3">
    <div className="relative flex-1">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
        <Search className="h-4 w-4 text-gray-500" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Search books or enter registration number..."
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm transition-all"
        disabled={loading}
        aria-label="Search query"
      />
    </div>
    <button
      onClick={handleSearch}
      disabled={loading || !searchQuery.trim()}
      className={`p-3 rounded-full flex items-center justify-center transition-all ${
        loading || !searchQuery.trim()
          ? 'bg-gray-200 cursor-not-allowed text-gray-400'
          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-105'
      }`}
      aria-label="Search"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Send className="h-5 w-5" />
      )}
    </button>
  </div>
  <div className="mt-3 px-1">
    <p className="text-xs text-gray-500 leading-tight">
      Try searching by: <span className="font-medium">book title</span>, <span className="font-medium">access number</span>, or <span className="font-medium">registration number</span> (e.g. 6178XXX)
    </p>
  </div>
</div>
        </>
      )}
    </div>
  );
}