import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  Search, 
  Book, 
  Filter, 
  SortAsc, 
  SortDesc, 
  ChevronDown, 
  RefreshCw, 
  Library,
  BookOpen,
  Bookmark,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Book as BookType } from '../types/database';

function PublicBooks() {
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'name' | 'author'>('name');
  const [sortBy, setSortBy] = useState<'name' | 'author' | 'count'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const searchTimeoutRef = useRef<number>();
  const supabaseSubscription = useRef<any>(null);

  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = window.setTimeout(() => {
      setSearchQuery(query);
      setCurrentPage(1); // Reset to first page on search
    }, 300);
  }, []);

  useEffect(() => {
    supabaseSubscription.current = supabase
      .channel('public:books')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'books' },
        (payload) => {
          setBooks(currentBooks => {
            if (payload.eventType === 'UPDATE') {
              return currentBooks.map(book => 
                book.id === payload.new.id ? { ...book, ...payload.new } : book
              );
            }
            return currentBooks;
          });
        }
      )
      .subscribe();

    return () => {
      if (supabaseSubscription.current) {
        supabase.removeChannel(supabaseSubscription.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchBooks();
    const refreshInterval = setInterval(() => {
      fetchBooks(true);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(refreshInterval);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const fetchBooks = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setIsRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const groupedBooks = useMemo(() => {
    const groups = books.reduce((acc, book) => {
      const key = `${book.name}-${book.author}`;
      if (!acc[key]) {
        acc[key] = {
          name: book.name,
          author: book.author,
          count: 1,
          isbnList: [book.isbn]
        };
      } else {
        acc[key].count++;
        acc[key].isbnList.push(book.isbn);
      }
      return acc;
    }, {} as Record<string, { 
      name: string; 
      author: string; 
      count: number; 
      isbnList: string[];

    }>);

    return Object.values(groups)
      .filter(group => {
        const searchTerm = searchQuery.toLowerCase();
        return searchBy === 'name'
          ? group.name.toLowerCase().includes(searchTerm)
          : group.author.toLowerCase().includes(searchTerm);
      })
      .sort((a, b) => {
        let compareValue = 0;
        switch (sortBy) {
          case 'name':
            compareValue = a.name.localeCompare(b.name);
            break;
          case 'author':
            compareValue = a.author.localeCompare(b.author);
            break;
          case 'count':
            compareValue = a.count - b.count;
            break;
        }
        return sortOrder === 'asc' ? compareValue : -compareValue;
      });
  }, [books, searchQuery, searchBy, sortBy, sortOrder]);

  const stats = useMemo(() => ({
    totalBooks: books.length,
    uniqueTitles: groupedBooks.length,
 
  }), [books, groupedBooks]);

  // Pagination
  const totalPages = Math.ceil(groupedBooks.length / itemsPerPage);
  const paginatedBooks = groupedBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Library Catalog
          </h1>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Browse our collection of available books
          </p>
          <div className="mt-4 flex items-center justify-center text-sm text-gray-500">
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            <button
              onClick={() => fetchBooks(true)}
              disabled={isRefreshing}
              className="ml-2 p-1 text-blue-600 hover:text-blue-800 disabled:text-gray-400"
              title="Refresh books"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 backdrop-blur-sm bg-white/50">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-full mr-4">
                <Library className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Books</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalBooks}</p>
              </div>
            </div>
          </div>
          {/* <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 backdrop-blur-sm bg-white/50">
            <div className="flex items-center">
              <div className="p-3 bg-emerald-50 rounded-full mr-4">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Unique Titles</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.uniqueTitles}</p>
              </div>
            </div>
          </div> */}
          {/* <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 backdrop-blur-sm bg-white/50">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-full mr-4">
                <Bookmark className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Departments</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Object.keys(stats.departments).length}
                </p>
              </div>
            </div>
          </div> */}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 backdrop-blur-sm bg-white/50">
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search books..."
                  onChange={(e) => debouncedSearch(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="search-by" className="block text-sm font-medium text-gray-700 mb-1">
                    Search By
                  </label>
                  <select
                    id="search-by"
                    value={searchBy}
                    onChange={(e) => setSearchBy(e.target.value as typeof searchBy)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                  >
                    <option value="name">Book Name</option>
                    <option value="author">Author</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      id="sort-by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                    >
                      <option value="name">Book Name</option>
                      <option value="author">Author</option>
                      <option value="count">Available Copies</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                    >
                      {sortOrder === 'asc' ? (
                        <SortAsc className="h-5 w-5" />
                      ) : (
                        <SortDesc className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="items-per-page" className="block text-sm font-medium text-gray-700 mb-1">
                    Items per page
                  </label>
                  <select
                    id="items-per-page"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-lg"
                  >
                    <option value={9}>9 items</option>
                    <option value={18}>18 items</option>
                    <option value={27}>27 items</option>
                    <option value={36}>36 items</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing {Math.min(groupedBooks.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(currentPage * itemsPerPage, groupedBooks.length)} of {groupedBooks.length} results
          </p>
        </div>

        {/* Books Display */}
        {groupedBooks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <Book className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No books found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedBooks.map((group, index) => (
                <div
                  key={index}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 backdrop-blur-sm bg-white/50"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-16 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Book className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {group.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        by {group.author}
                      </p>
                      <div className="mt-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {group.count} {group.count === 1 ? 'copy' : 'copies'}
                          </span>
                         
                        </div>
                        <div className="text-xs text-gray-500">
                          <p className="font-medium mb-1">Access Numbers:</p>
                          <div className="flex flex-wrap gap-1">
                            {group.isbnList.map((isbn, i) => (
                              <span
                                key={i}
                                className="inline-block px-2 py-1 bg-gray-100 rounded"
                              >
                                {isbn}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, groupedBooks.length)}
                      </span>{' '}
                      of <span className="font-medium">{groupedBooks.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-50"
                      >
                        <span className="sr-only">First</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNumber
                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:bg-gray-50"
                      >
                        <span className="sr-only">Last</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PublicBooks;