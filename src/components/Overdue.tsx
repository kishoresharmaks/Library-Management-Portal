import React, { useState } from 'react';
import { 
  Loader2, 
  Search, 
  AlertCircle,
  MessageSquare,
  X,
  Clock,
  User,
  Book,
  Calendar
} from 'lucide-react';
import { useTransactions } from '../hooks/useSupabase';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

function Overdue() {
  const { transactions, loading, addOverdueRemarks } = useTransactions();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [remarks, setRemarks] = useState('');
  const [showRemarksModal, setShowRemarksModal] = useState(false);

  const overdueTransactions = transactions.filter(transaction => {
    const isDue = transaction.status === 'Borrowed' && 
                 transaction.due_date && 
                 new Date(transaction.due_date) < new Date();

    const matchesSearch = searchQuery.toLowerCase().trim() === '' ||
      transaction.book?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.student?.reg_number.toLowerCase().includes(searchQuery.toLowerCase());

    return isDue && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = [
      'Book Name',
      'Access No',
      'Student Name',
      'Registration Number',
      'Borrowed Date',
      'Due Date',
      'Days Overdue',
      'Remarks',
      'Remarks Date',
      'Remarks By'
    ];

    const csvContent = [
      headers.join(','),
      ...overdueTransactions.map(transaction => {
        const daysOverdue = Math.ceil(
          (new Date().getTime() - new Date(transaction.due_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        return [
          transaction.book?.name || '',
          transaction.book?.isbn || '',
          transaction.student?.name || '',
          transaction.student?.reg_number || '',
          new Date(transaction.borrowed_date).toLocaleDateString(),
          new Date(transaction.due_date).toLocaleDateString(),
          daysOverdue,
          transaction.remarks || '',
          transaction.remarks_date ? new Date(transaction.remarks_date).toLocaleDateString() : '',
          transaction.remarks_by || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'overdue_books.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Overdue books report exported successfully');
  };

  const handleAddRemarks = async () => {
    if (!selectedTransaction || !remarks.trim()) {
      toast.error('Please enter remarks');
      return;
    }

    try {
      await addOverdueRemarks(selectedTransaction, remarks.trim(), user?.email || 'Unknown User');
      setShowRemarksModal(false);
      setSelectedTransaction(null);
      setRemarks('');
    } catch (error) {
      console.error('Error adding remarks:', error);
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h2 className="text-lg font-semibold text-gray-900">Overdue Books</h2>
        </div>
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
        >
          Export Overdue Report
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by book name, student name, or registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Borrowed Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {overdueTransactions.map((transaction) => {
                const daysOverdue = Math.ceil(
                  (new Date().getTime() - new Date(transaction.due_date).getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                            <Book className="h-5 w-5 text-red-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.book?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Access No: {transaction.book?.isbn}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {transaction.student?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Reg: {transaction.student?.reg_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {new Date(transaction.borrowed_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-red-400" />
                        <span className="text-sm text-gray-500">
                          {new Date(transaction.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        {daysOverdue} days
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {transaction.remarks ? (
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">{transaction.remarks}</p>
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <span>Added by {transaction.remarks_by}</span>
                            <span>•</span>
                            <span>
                              {transaction.remarks_date && 
                                new Date(transaction.remarks_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No remarks</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTransaction(transaction.id);
                          setShowRemarksModal(true);
                          setRemarks(transaction.remarks || '');
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {transaction.remarks ? 'Update Remarks' : 'Add Remarks'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks Modal */}
      {showRemarksModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Remarks</h3>
              <button
                onClick={() => {
                  setShowRemarksModal(false);
                  setSelectedTransaction(null);
                  setRemarks('');
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-2">
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks about why the book is overdue..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                rows={4}
              />
            </div>

            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRemarksModal(false);
                  setSelectedTransaction(null);
                  setRemarks('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRemarks}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Save Remarks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Overdue;