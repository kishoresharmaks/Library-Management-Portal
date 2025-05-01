import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2, Book, ChevronDown, Info, ExternalLink, BookText } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RenewalChatbotProps {
  onClose: () => void;
}

export function RenewalChatbot({ onClose }: RenewalChatbotProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { 
      type: 'bot', 
      text: 'Hello! I can help you check book availability in our Sona IT library. What book would you like to find?',
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (chatContainerRef.current) {
        // Adjust chat container based on window size
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
    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (type, text) => {
    setMessages(prev => [...prev, { type, text, timestamp: new Date() }]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      addMessage('bot', 'Please enter a valid book title or access number.');
      return;
    }

    setLoading(true);
    addMessage('user', searchQuery);

    try {
      // Search for books by name or access number
      const { data: books, error: searchError } = await supabase
        .from('books')
        .select('*')
        .or(`name.ilike.%${searchQuery}%,isbn.ilike.%${searchQuery}%`)
        .limit(5);

      if (searchError) throw searchError;

      if (!books || books.length === 0) {
        addMessage('bot', 'No books found matching your search. Please try with a different title or access number.');
        return;
      }

      // Add search results message
      addMessage('bot', `I found ${books.length} book${books.length > 1 ? 's' : ''} matching your search:`);

      // Process each book separately for better visualization
      for (const book of books) {
        if (book.is_available) {
          addMessage('bot', {
            bookName: book.name,
            isbn: book.isbn,
            status: 'available',
            message: `"${book.name}" is currently available for Borrow.`
          });
        } else {
          // Get transaction details for borrowed book
          const { data: transaction } = await supabase
            .from('transactions')
            .select(`
              *,
              student:students(name)
            `)
            .eq('book_id', book.id)
            .eq('status', 'Borrowed')
            .order('borrowed_date', { ascending: false })
            .limit(1)
            .single();

          if (transaction) {
            const dueDate = new Date(transaction.due_date);
            const isOverdue = dueDate < new Date();
            
            addMessage('bot', {
              bookName: book.name,
              isbn: book.isbn,
              status: isOverdue ? 'overdue' : 'borrowed',
              dueDate: dueDate.toLocaleDateString(),
              message: `"${book.name}" is currently borrowed ${isOverdue ? ' and overdue' : ''}.`
            });
          } else {
            addMessage('bot', {
              bookName: book.name,
              isbn: book.isbn,
              status: 'borrowed',
              message: `"${book.name}" is currently Borrowed.`
            });
          }
        }
      }

      addMessage('bot', 'Can I help you find another book?');
      
    } catch (error) {
      console.error('Error:', error);
      addMessage('bot', 'Sorry, I encountered an error while searching. Please try again later.');
    } finally {
      setLoading(false);
      setSearchQuery('');
      // Focus on the input after search completes
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && searchQuery.trim()) {
      handleSearch();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) return null;

  // Format the timestamp for messages
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Render different message types
  const renderMessage = (message, index) => {
    if (message.type === 'user') {
      return (
        <div key={index} className="flex justify-end mb-4">
          <div className="flex flex-col items-end">
            <div className="bg-blue-600 text-white rounded-xl px-4 py-2 max-w-[85%] shadow-sm">
              {message.text}
            </div>
            <span className="text-xs text-gray-500 mt-1 mr-1">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      );
    } else {
      // Check if the message contains book info
      if (message.text && typeof message.text === 'object') {
        const { bookName, isbn, status, dueDate, message: bookMessage } = message.text;
        
        return (
          <div key={index} className="flex justify-start mb-4">
            <div className="flex flex-col">
              <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-[85%] shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <Book className={`h-5 w-5 ${
                    status === 'available' ? 'text-green-600' : 
                    status === 'overdue' ? 'text-red-600' : 'text-amber-500'
                  }`} />
                  <h4 className="font-medium text-gray-900 line-clamp-2">{bookName}</h4>
                </div>
                <p className="text-sm text-gray-700 mb-2">{bookMessage}</p>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Info className="h-3 w-3" /> Access No: {isbn}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    status === 'available' ? 'bg-green-100 text-green-800' : 
                    status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {status === 'available' ? 'Available' : 
                     status === 'overdue' ? `Overdue (${dueDate})` : `Due: ${dueDate}`}
                  </span>
                </div>
                {status === 'available' && (
                  <button className="mt-3 text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors">
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
      
      return (
        <div key={index} className="flex justify-start mb-4">
          <div className="flex flex-col">
            <div className="bg-gray-100 rounded-xl px-4 py-2 max-w-[85%] shadow-sm">
              {message.text}
            </div>
            <span className="text-xs text-gray-500 mt-1 ml-1">
              {formatTime(message.timestamp)}
            </span>
          </div>
        </div>
      );
    }
  };

  return (
    <div 
      ref={chatContainerRef}
      className={`fixed ${isMinimized ? 'bottom-4' : 'bottom-0 sm:bottom-4'} right-0 sm:right-4 w-full sm:w-96 bg-white rounded-t-lg sm:rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden transition-all duration-300 ease-in-out`}
      style={{ 
        height: isMinimized ? '60px' : 'auto', 
        maxHeight: isMinimized ? '60px' : '600px',
        maxWidth: '100%'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 rounded-full p-1.5">
            <MessageSquare className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Sona IT Library Assistant</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMinimize}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label={isMinimized ? "Expand chatbot" : "Minimize chatbot"}
          >
            <ChevronDown className={`h-5 w-5 transform transition-transform ${isMinimized ? 'rotate-180' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Close chatbot"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Message container - conditionally rendered based on minimized state */}
      {!isMinimized && (
        <>
          <div className="p-4 h-96 overflow-y-auto bg-gray-50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for a book..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm"
                disabled={loading}
              />
              <button
                onClick={handleSearch}
                disabled={loading || !searchQuery.trim()}
                className={`p-3 rounded-full flex items-center justify-center transition-colors ${
                  loading || !searchQuery.trim() 
                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                }`}
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                Try searching by book title, author, or access number
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}