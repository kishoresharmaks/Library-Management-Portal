import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Loader2, 
  Search, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock,
  Filter,
  SortAsc,
  SortDesc,
  Calendar as CalendarIcon,
  User,
  Book,
  ChevronDown
} from 'lucide-react';
import { useTransactions } from '../hooks/useSupabase';
import toast from 'react-hot-toast';

type SortField = 'date' | 'student' | 'book' | 'status';
type SortOrder = 'asc' | 'desc';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'custom';

function Transactions() {
  const { transactions, loading } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'borrowed' | 'returned' | 'overdue'>('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const getDateRange = (filter: DateFilter) => {
    const now = new Date();
    const start = new Date();
    
    switch (filter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      case 'week':
        start.setDate(now.getDate() - 7);
        return { start, end: now };
      case 'month':
        start.setMonth(now.getMonth() - 1);
        return { start, end: now };
      case 'custom':
        return {
          start: customDateRange.start ? new Date(customDateRange.start) : new Date(0),
          end: customDateRange.end ? new Date(customDateRange.end) : now
        };
      default:
        return { start: new Date(0), end: now };
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    const currentDate = new Date();
    const { start, end } = getDateRange(dateFilter);
    
    return transactions
      .filter(transaction => {
        const transactionDate = new Date(transaction.borrowed_date);
        const isWithinDateRange = transactionDate >= start && transactionDate <= end;
        
        const matchesSearch = searchQuery.toLowerCase().trim() === '' ||
          transaction.book?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transaction.book?.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transaction.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          transaction.student?.reg_number.toLowerCase().includes(searchQuery.toLowerCase());

        const isOverdue = transaction.status === 'Borrowed' && 
          new Date(transaction.due_date) < currentDate;

        const matchesStatus = 
          statusFilter === 'all' ||
          (statusFilter === 'borrowed' && transaction.status === 'Borrowed' && !isOverdue) ||
          (statusFilter === 'returned' && transaction.status === 'Returned') ||
          (statusFilter === 'overdue' && isOverdue);

        return matchesSearch && matchesStatus && isWithinDateRange;
      })
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortField) {
          case 'date':
            comparison = new Date(b.borrowed_date).getTime() - new Date(a.borrowed_date).getTime();
            break;
          case 'student':
            comparison = (a.student?.name || '').localeCompare(b.student?.name || '');
            break;
          case 'book':
            comparison = (a.book?.name || '').localeCompare(b.book?.name || '');
            break;
          case 'status':
            comparison = a.status.localeCompare(b.status);
            break;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [transactions, searchQuery, statusFilter, sortField, sortOrder, dateFilter, customDateRange]);

  const stats = useMemo(() => {
    const currentDate = new Date();
    let total = filteredAndSortedTransactions.length;
    let borrowed = 0;
    let overdue = 0;
    let returned = 0;

    filteredAndSortedTransactions.forEach(transaction => {
      if (transaction.status === 'Borrowed') {
        borrowed++;
        if (new Date(transaction.due_date) < currentDate) {
          overdue++;
        }
      } else {
        returned++;
      }
    });

    return { total, borrowed, overdue, returned };
  }, [filteredAndSortedTransactions]);

  const handleExportCSV = () => {
    const headers = [
      'Transaction Date',
      'Book Name',
      'Access No',
      'Student Name',
      'Registration Number',
      'Status',
      'Due Date',
      'Return Date',
      'Days Overdue'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredAndSortedTransactions.map(transaction => {
        const currentDate = new Date();
        const dueDate = new Date(transaction.due_date);
        const daysOverdue = transaction.status === 'Borrowed' && dueDate < currentDate
          ? Math.ceil((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        return [
          new Date(transaction.borrowed_date).toLocaleDateString(),
          transaction.book?.name || '',
          transaction.book?.isbn || '',
          transaction.student?.name || '',
          transaction.student?.reg_number || '',
          transaction.status,
          new Date(transaction.due_date).toLocaleDateString(),
          transaction.return_date ? new Date(transaction.return_date).toLocaleDateString() : '-',
          daysOverdue > 0 ? daysOverdue : '-'
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Transactions exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar className="h-6 w-6 text-indigo-600" />
          Transaction History
        </h2>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Transactions
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-50 rounded-full mr-4">
              <Calendar className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-full mr-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Currently Borrowed</p>
              <p className="text-2xl font-bold text-blue-600">{stats.borrowed}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 bg-red-50 rounded-full mr-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-full mr-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Returned</p>
              <p className="text-2xl font-bold text-green-600">{stats.returned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search books, students, or registration numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                  >
                    <option value="all">All Status</option>
                    <option value="borrowed">Currently Borrowed</option>
                    <option value="returned">Returned</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                {/* Date Filter */}
                <div>
                  <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    id="date-filter"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {/* Sort Select */}
                <div>
                  <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      id="sort-select"
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                    >
                      <option value="date">Date</option>
                      <option value="student">Student</option>
                      <option value="book">Book</option>
                      <option value="status">Status</option>
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
              </div>

              {/* Custom Date Range */}
              {dateFilter === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="start-date"
                      value={customDateRange.start}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                    />
                  </div>
                  <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="end-date"
                      value={customDateRange.end}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transactions List */}
        <div className="border-t border-gray-200">
          <div className="overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredAndSortedTransactions.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Calendar className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No transactions found</h3>
                  <p className="mt-1 text-sm text-gray-500 max-w-md">
                    Try adjusting your search or filter criteria to find what you're looking for.
                  </p>
                </div>
              ) : (
                filteredAndSortedTransactions.map((transaction) => {
                  const isOverdue = transaction.status === 'Borrowed' && 
                    new Date(transaction.due_date) < new Date();
                  
                  return (
                    <div 
                      key={transaction.id}
                      className={`p-6 transition-colors duration-200 ${isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        {/* Book and Student Info */}
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            <div className="flex-shrink-0 w-16 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                              <Book className="h-8 w-8 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                {transaction.book?.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                Access No: {transaction.book?.isbn}
                              </p>
                              <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                                <User className="h-3 w-3 mr-1" />
                                {transaction.student?.name}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Reg: {transaction.student?.reg_number}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Transaction Timeline */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 lg:mt-0">
                          {/* Borrowed */}
                          <div className="text-center bg-gray-50 rounded-lg p-3 w-full sm:w-auto">
                            <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                              <Calendar className="h-4 w-4 text-indigo-500" />
                              Borrowed
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {new Date(transaction.borrowed_date).toLocaleDateString()}
                            </p>
                          </div>

                          <ArrowRight className="hidden sm:block h-4 w-4 text-gray-400" />

                          {/* Due Date */}
                          <div className={`text-center p-3 rounded-lg w-full sm:w-auto ${
                            isOverdue ? 'bg-red-50' : 'bg-yellow-50'
                          }`}>
                            <div className={`flex items-center justify-center gap-2 text-sm font-medium ${
                              isOverdue ? 'text-red-700' : 'text-yellow-700'
                            }`}>
                              <Calendar className={`h-4 w-4 ${
                                isOverdue ? 'text-red-500' : 'text-yellow-500'
                              }`} />
                              Due
                            </div>
                            <p className={`text-sm mt-1 ${
                              isOverdue ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {new Date(transaction.due_date).toLocaleDateString()}
                            </p>
                            {isOverdue && (
                              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                {Math.ceil(
                                  (new Date().getTime() - new Date(transaction.due_date).getTime()) / 
                                  (1000 * 60 * 60 * 24)
                                )} days overdue
                              </span>
                            )}
                          </div>

                          <ArrowRight className="hidden sm:block h-4 w-4 text-gray-400" />

                          {/* Return Status */}
                          <div className={`text-center p-3 rounded-lg w-full sm:w-auto ${
                            transaction.status === 'Returned' ? 'bg-green-50' : 'bg-gray-50'
                          }`}>
                            {transaction.status === 'Returned' ? (
                              <div>
                                <div className="flex items-center justify-center gap-2 text-sm font-medium text-green-700">
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  Returned
                                </div>
                                <p className="text-sm text-green-600 mt-1">
                                  {new Date(transaction.return_date!).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-700">
                                  <XCircle className="h-4 w-4 text-gray-400" />
                                  Not Returned
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transactions;