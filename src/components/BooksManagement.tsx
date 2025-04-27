import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Upload, 
  Plus, 
  Loader2, 
  Search, 
  Edit, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Library,
  BookOpen,
  Filter,
  SortAsc,
  SortDesc,
  CheckSquare,
  Square,
  View,
  Grid,
  List,
  BookCopy
} from 'lucide-react';
import { useBooks } from '../hooks/useSupabase';
import { Book } from '../types/database';
import toast from 'react-hot-toast';

interface ImportPreview {
  isbn: string;
  name: string;
  author: string;
  status: 'valid' | 'duplicate' | 'invalid';
  message?: string;
}

function BooksManagement() {
  const { books, loading, addBook, updateBook } = useBooks();
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isEditingBook, setIsEditingBook] = useState<Book | null>(null);
  const [viewingBook, setViewingBook] = useState<Book | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchBy, setSearchBy] = useState<'isbn' | 'name' | 'author'>('name');
  const [sortBy, setSortBy] = useState<'name' | 'author' | 'isbn'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [importPreview, setImportPreview] = useState<ImportPreview[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'borrowed'>('all');
  const [selectedBooks, setSelectedBooks] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [newBook, setNewBook] = useState({
    isbn: '',
    name: '',
    author: '',
  });

  const filteredBooks = useMemo(() => {
    return books
      .filter(book => {
        const matchesSearch = searchQuery
          ? book[searchBy].toLowerCase().includes(searchQuery.toLowerCase())
          : true;
        
        const matchesAvailability = filterAvailability === 'all'
          ? true
          : filterAvailability === 'available'
            ? book.is_available
            : !book.is_available;

        return matchesSearch && matchesAvailability;
      })
      .sort((a, b) => {
        const compareValue = sortOrder === 'asc'
          ? a[sortBy].localeCompare(b[sortBy])
          : b[sortBy].localeCompare(a[sortBy]);
        return compareValue;
      });
  }, [books, searchQuery, searchBy, sortBy, sortOrder, filterAvailability]);

  // Pagination
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  
  const paginatedBooks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBooks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBooks, currentPage, itemsPerPage]);

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const existingBook = books.find(book => book.isbn === newBook.isbn);
    if (existingBook) {
      toast.error('A book with this Access Number already exists');
      return;
    }

    await addBook({
      ...newBook,
      is_available: true,
    });
    setNewBook({ isbn: '', name: '', author: '' });
    setIsAddingBook(false);
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingBook) return;
    
    const existingBook = books.find(
      book => book.isbn === isEditingBook.isbn && book.id !== isEditingBook.id
    );
    if (existingBook) {
      toast.error('A book with this Access Number already exists');
      return;
    }

    await updateBook(isEditingBook.id, {
      isbn: isEditingBook.isbn,
      name: isEditingBook.name,
      author: isEditingBook.author,
    });
    setIsEditingBook(null);
  };

  const handleFilePreview = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n').slice(1);
      const preview: ImportPreview[] = [];

      for (const row of rows) {
        const fields = row.split(',').map(field => field.trim().replace(/^"|"$/g, ''));

        if (fields.length < 4) {
          continue;
        }

        const [isbn, name, ...remainingFields] = fields;
        const author = remainingFields.slice(0, -1).join(',');
        const available = remainingFields[remainingFields.length - 1];

        if (isbn && name && author && available !== undefined) {
          const existingBook = books.find(book => book.isbn === isbn);
          preview.push({
            isbn,
            name,
            author,
            status: existingBook ? 'duplicate' : (!isbn || !name || !author || available === undefined) ? 'invalid' : 'valid',
            message: existingBook ? 'Access Number already exists' : (!isbn || !name || !author || available === undefined) ? 'Missing required fields' : undefined
          });
        }
      }

      setImportPreview(preview);
      setShowImportPreview(true);
    } catch (error) {
      toast.error('Error reading file');
      console.error('Error:', error);
    }
  };

  const handleConfirmImport = async () => {
    const validBooks = importPreview.filter(book => book.status === 'valid');
    setIsImporting(true);
    let imported = 0;

    try {
      for (const book of validBooks) {
        await addBook({
          isbn: book.isbn,
          name: book.name,
          author: book.author,
          is_available: true
        });
        imported++;
        setImportProgress((imported / validBooks.length) * 100);
      }
      
      toast.success(`Successfully imported ${imported} books`);
      setShowImportPreview(false);
      setImportPreview([]);
      setImportProgress(0);
    } catch (error) {
      toast.error('Error during import');
      console.error('Error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ISBN', 'Name', 'Author', 'Available'];
    const csvContent = [
      headers.join(','),
      ...books.map(book => [
        book.isbn,
        book.name,
        book.author,
        book.is_available ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'books.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleToggleBookSelection = (bookId: string) => {
    const newSelected = new Set(selectedBooks);
    if (newSelected.has(bookId)) {
      newSelected.delete(bookId);
    } else {
      newSelected.add(bookId);
    }
    setSelectedBooks(newSelected);
  };

  const handleSelectAllBooks = () => {
    if (selectedBooks.size === paginatedBooks.length) {
      setSelectedBooks(new Set());
    } else {
      setSelectedBooks(new Set(paginatedBooks.map(book => book.id)));
    }
  };

  const handleBulkUpdateAvailability = async (setAvailable: boolean) => {
    if (selectedBooks.size === 0) {
      toast.error('Please select at least one book');
      return;
    }

    setIsBulkUpdating(true);
    try {
      for (const bookId of selectedBooks) {
        await updateBook(bookId, { is_available: setAvailable });
      }
      toast.success(`Successfully updated ${selectedBooks.size} books`);
      setSelectedBooks(new Set());
    } catch (error) {
      toast.error('Error updating books');
      console.error('Error:', error);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Books</p>
              <p className="text-2xl font-semibold text-gray-900">{books.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Library className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available Books</p>
              <p className="text-2xl font-semibold text-green-600">
                {books.filter(b => b.is_available).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Borrowed Books</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {books.filter(b => !b.is_available).length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <BookOpen className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h2 className="text-lg font-semibold text-gray-900">Books Management</h2>
        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFilePreview}
            />
          </label>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setIsAddingBook(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </button>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">View Mode:</span>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Grid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="p-1 border border-gray-300 rounded text-sm"
          >
            <option value={9}>9</option>
            <option value={18}>18</option>
            <option value={27}>27</option>
            <option value={36}>36</option>
          </select>
        </div>
      </div>

      {/* Import Preview Modal */}
      {showImportPreview && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Import Preview</h3>
              <button
                onClick={() => {
                  setShowImportPreview(false);
                  setImportPreview([]);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isImporting ? (
              <div className="space-y-4">
                <div className="text-center text-gray-600">
                  Importing books... Please wait
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <>
                <div className="max-h-96 overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Access Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Author
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {importPreview.map((book, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {book.status === 'valid' ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <div className="flex items-center">
                                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                                <span className="text-sm text-red-500">{book.message}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {book.isbn}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {book.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {book.author}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowImportPreview(false);
                      setImportPreview([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={!importPreview.some(book => book.status === 'valid')}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Import Valid Books
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Book Detail Modal */}
      {viewingBook && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Book Details</h3>
              <button
                onClick={() => setViewingBook(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex space-x-6">
              <div className="flex-shrink-0 bg-gray-100 p-6 rounded-md flex items-center justify-center">
                <BookCopy className="h-16 w-16 text-gray-400" />
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{viewingBook.name}</h4>
                  <p className="text-gray-600">by {viewingBook.author}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Access Number</p>
                    <p className="text-gray-900">{viewingBook.isbn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        viewingBook.is_available
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {viewingBook.is_available ? 'Available' : 'Borrowed'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setViewingBook(null);
                      setIsEditingBook(viewingBook);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Book
                  </button>
                  <button
                    onClick={async () => {
                      await updateBook(viewingBook.id, { is_available: !viewingBook.is_available });
                      setViewingBook({...viewingBook, is_available: !viewingBook.is_available});
                    }}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      viewingBook.is_available ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {viewingBook.is_available ? (
                      <>
                        <BookOpen className="h-4 w-4 mr-2" />
                        Mark as Borrowed
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark as Available
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search books..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <select
              value={searchBy}
              onChange={(e) => {
                setSearchBy(e.target.value as typeof searchBy);
                setCurrentPage(1);
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="name">Search by Name</option>
              <option value="isbn">Search by Access Number</option>
              <option value="author">Search by Author</option>
            </select>
          </div>
          <div>
            <select
              value={filterAvailability}
              onChange={(e) => {
                setFilterAvailability(e.target.value as typeof filterAvailability);
                setCurrentPage(1);
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Books</option>
              <option value="available">Available Only</option>
              <option value="borrowed">Borrowed Only</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as typeof sortBy);
                setCurrentPage(1);
              }}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="name">Sort by Name</option>
              <option value="author">Sort by Author</option>
              <option value="isbn">Sort by Access Number</option>
            </select>
            <button
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setCurrentPage(1);
              }}
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? (
                <SortAsc className="h-5 w-5 text-gray-500" />
              ) : (
                <SortDesc className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedBooks.size > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-700">
                {selectedBooks.size} book{selectedBooks.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleBulkUpdateAvailability(true)}
                disabled={isBulkUpdating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isBulkUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Set Available
              </button>
              <button
                onClick={() => handleBulkUpdateAvailability(false)}
                disabled={isBulkUpdating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isBulkUpdating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4 mr-2" />
                )}
                Set Borrowed
              </button>
              <button
                onClick={() => setSelectedBooks(new Set())}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingBook && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Book</h3>
            <button
              onClick={() => setIsAddingBook(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleAddBook} className="space-y-4">
            <div>
              <label htmlFor="isbn" className="block text-sm font-medium text-gray-700">
                Access Number
              </label>
              <input
                type="text"
                id="isbn"
                value={newBook.isbn}
                onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Book Name
              </label>
              <input
                type="text"
                id="name"
                value={newBook.name}
          

              onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
required
/>
</div>
<div>
<label htmlFor="author" className="block text-sm font-medium text-gray-700">
  Author
</label>
<input
  type="text"
  id="author"
  value={newBook.author}
  onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
  required
/>
</div>
<div className="flex justify-end space-x-3">
<button
  type="button"
  onClick={() => setIsAddingBook(false)}
  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
>
  Cancel
</button>
<button
  type="submit"
  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
>
  Add Book
</button>
</div>
</form>
</div>
)}

{isEditingBook && (
<div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
<div className="flex justify-between items-center mb-4">
  <h3 className="text-lg font-medium text-gray-900">Edit Book</h3>
  <button
    onClick={() => setIsEditingBook(null)}
    className="text-gray-400 hover:text-gray-500"
  >
    <X className="h-5 w-5" />
  </button>
</div>
<form onSubmit={handleEditBook} className="space-y-4">
  <div>
    <label htmlFor="edit-isbn" className="block text-sm font-medium text-gray-700">
      Access Number
    </label>
    <input
      type="text"
      id="edit-isbn"
      value={isEditingBook.isbn}
      onChange={(e) => setIsEditingBook({ ...isEditingBook, isbn: e.target.value })}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      required
    />
  </div>
  <div>
    <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
      Book Name
    </label>
    <input
      type="text"
      id="edit-name"
      value={isEditingBook.name}
      onChange={(e) => setIsEditingBook({ ...isEditingBook, name: e.target.value })}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      required
    />
  </div>
  <div>
    <label htmlFor="edit-author" className="block text-sm font-medium text-gray-700">
      Author
    </label>
    <input
      type="text"
      id="edit-author"
      value={isEditingBook.author}
      onChange={(e) => setIsEditingBook({ ...isEditingBook, author: e.target.value })}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      required
    />
  </div>
  <div className="flex justify-end space-x-3">
    <button
      type="button"
      onClick={() => setIsEditingBook(null)}
      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
    >
      Cancel
    </button>
    <button
      type="submit"
      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Save Changes
    </button>
  </div>
</form>
</div>
)}

{/* Books Display */}
{paginatedBooks.length === 0 ? (
<div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
<div className="p-4 flex justify-center">
  <BookOpen className="h-12 w-12 text-gray-400" />
</div>
<h3 className="mt-2 text-lg font-medium text-gray-900">No books found</h3>
<p className="mt-1 text-gray-500">
  {searchQuery ? 'Try adjusting your search criteria.' : 'Add some books to get started.'}
</p>
{!searchQuery && (
  <div className="mt-6">
    <button
      onClick={() => setIsAddingBook(true)}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Book
    </button>
  </div>
)}
</div>
) : viewMode === 'grid' ? (
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
{paginatedBooks.map((book) => (
  <div
    key={book.id}
    className={`bg-white p-4 rounded-lg shadow-sm border ${
      selectedBooks.has(book.id) ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
    } transition-all duration-200`}
  >
    <div className="flex items-start justify-between mb-2">
      <button
        onClick={() => handleToggleBookSelection(book.id)}
        className="p-1 -ml-1 rounded-sm hover:bg-gray-100"
      >
        {selectedBooks.has(book.id) ? (
          <CheckSquare className="h-5 w-5 text-blue-600" />
        ) : (
          <Square className="h-5 w-5 text-gray-400" />
        )}
      </button>
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          book.is_available
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {book.is_available ? 'Available' : 'Borrowed'}
      </span>
    </div>
    <div className="ml-1">
      <h4 className="text-lg font-medium text-gray-900 line-clamp-1">{book.name}</h4>
      <p className="text-sm text-gray-600 mb-1 line-clamp-1">by {book.author}</p>
      <p className="text-xs text-gray-500 mb-3">{book.isbn}</p>
    </div>
    <div className="flex justify-end space-x-2 mt-2">
      <button
        onClick={() => setViewingBook(book)}
        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
      >
        <View className="h-4 w-4" />
      </button>
      <button
        onClick={() => setIsEditingBook(book)}
        className="p-2 text-gray-600 hover:bg-gray-50 rounded-md"
      >
        <Edit className="h-4 w-4" />
      </button>
      <button
        onClick={async () => updateBook(book.id, { is_available: !book.is_available })}
        className={`p-2 rounded-md ${
          book.is_available
            ? 'text-yellow-600 hover:bg-yellow-50'
            : 'text-green-600 hover:bg-green-50'
        }`}
      >
        {book.is_available ? (
          <BookOpen className="h-4 w-4" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
      </button>
    </div>
  </div>
))}
</div>
) : (
<div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="flex items-center">
          <button
            onClick={handleSelectAllBooks}
            className="p-1 rounded-sm hover:bg-gray-100 mr-2"
          >
            {selectedBooks.size === paginatedBooks.length && paginatedBooks.length > 0 ? (
              <CheckSquare className="h-5 w-5 text-blue-600" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </button>
          Book
        </div>
      </th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Author
      </th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Access Number
      </th>
      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
        Status
      </th>
      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
        Actions
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {paginatedBooks.map((book) => (
      <tr 
        key={book.id}
        className={`hover:bg-gray-50 ${selectedBooks.has(book.id) ? 'bg-blue-50' : ''}`}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <button
              onClick={() => handleToggleBookSelection(book.id)}
              className="p-1 rounded-sm hover:bg-gray-100 mr-3"
            >
              {selectedBooks.has(book.id) ? (
                <CheckSquare className="h-5 w-5 text-blue-600" />
              ) : (
                <Square className="h-5 w-5 text-gray-400" />
              )}
            </button>
            <div className="text-sm font-medium text-gray-900">{book.name}</div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">{book.author}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">{book.isbn}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              book.is_available
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {book.is_available ? 'Available' : 'Borrowed'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => setViewingBook(book)}
            className="text-blue-600 hover:text-blue-900 ml-2"
          >
            View
          </button>
          <button
            onClick={() => setIsEditingBook(book)}
            className="text-gray-600 hover:text-gray-900 ml-2"
          >
            Edit
          </button>
          <button
            onClick={async () => updateBook(book.id, { is_available: !book.is_available })}
            className={`ml-2 ${
              book.is_available
                ? 'text-yellow-600 hover:text-yellow-900'
                : 'text-green-600 hover:text-green-900'
            }`}
          >
            {book.is_available ? 'Borrow' : 'Return'}
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
</div>
)}

{/* Pagination */}
{totalPages > 1 && (
<div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm mt-4">
<div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
  <div>
    <p className="text-sm text-gray-700">
      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
      <span className="font-medium">
        {Math.min(currentPage * itemsPerPage, filteredBooks.length)}
      </span>{' '}
      of <span className="font-medium">{filteredBooks.length}</span> results
    </p>
  </div>
  <div>
    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
      <button
        onClick={() => goToPage(1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
      >
        <span className="sr-only">First</span>
        &laquo;
      </button>
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
      >
        <span className="sr-only">Previous</span>
        &lsaquo;
      </button>
      
      {/* Page numbers */}
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
            onClick={() => goToPage(pageNumber)}
            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
              currentPage === pageNumber
                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {pageNumber}
          </button>
        );
      })}
      
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
      >
        <span className="sr-only">Next</span>
        &rsaquo;
      </button>
      <button
        onClick={() => goToPage(totalPages)}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
      >
        <span className="sr-only">Last</span>
        &raquo;
      </button>
    </nav>
  </div>
</div>
</div>
)}
</div>
);
}

export default BooksManagement;