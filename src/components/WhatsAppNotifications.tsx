import React, { useMemo, useState } from 'react';
import { MessageSquare, Send, Loader2, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import { useTransactions } from '../hooks/useSupabase';
import toast from 'react-hot-toast';

type NotificationType = 'upcoming' | 'overdue';

function WhatsAppNotifications() {
  const { transactions, loading } = useTransactions();
  const [sendingMessages, setSendingMessages] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [notificationType, setNotificationType] = useState<NotificationType>('upcoming');

  const { upcomingDueTransactions, overdueTransactions } = useMemo(() => {
    const now = new Date();
    const fiveDaysFromNow = new Date(now.getTime() + (5 * 24 * 60 * 60 * 1000));
    
    const upcoming = transactions
      .filter(transaction => {
        const dueDate = new Date(transaction.due_date);
        return transaction.status === 'Borrowed' &&
               dueDate > now &&
               dueDate <= fiveDaysFromNow;
      })
      .map(transaction => {
        const dueDate = new Date(transaction.due_date);
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return { ...transaction, daysUntilDue };
      })
      .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

    const overdue = transactions
      .filter(transaction => {
        const dueDate = new Date(transaction.due_date);
        return transaction.status === 'Borrowed' && dueDate < now;
      })
      .map(transaction => {
        const dueDate = new Date(transaction.due_date);
        const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return { ...transaction, daysOverdue };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    return { upcomingDueTransactions: upcoming, overdueTransactions: overdue };
  }, [transactions]);

  const currentTransactions = notificationType === 'upcoming' 
    ? upcomingDueTransactions 
    : overdueTransactions;

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === currentTransactions.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(currentTransactions.map(t => t.student_id)));
    }
  };

  const handleSendMessages = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setSendingMessages(true);
    try {
      for (const transaction of currentTransactions) {
        if (!selectedStudents.has(transaction.student_id)) continue;
        
        const student = transaction.student;
        const book = transaction.book;
        if (!student?.contact_number || !book) continue;

        let message;
        if (notificationType === 'upcoming') {
          message = encodeURIComponent(
            `Dear ${student.name},\n\n` +
            `This is a reminder that "${book.name}" is due in ${transaction.daysUntilDue} days ` +
            `(${new Date(transaction.due_date).toLocaleDateString()}).\n\n` +
            `Please ensure to return it on time to avoid any late fees.\n\n` +
            `Thank you,\nLibrary Management`
          );
        } else {
          message = encodeURIComponent(
            `Dear ${student.name},\n\n` +
            `This is an urgent reminder that "${book.name}" is OVERDUE by ${transaction.daysOverdue} days. ` +
            `The book was due on ${new Date(transaction.due_date).toLocaleDateString()}.\n\n` +
            `Please return the book immediately to avoid additional late fees.\n\n` +
            `Thank you,\nLibrary Management`
          );
        }

        // Format phone number (remove any non-digit characters)
        const phone = student.contact_number.replace(/\D/g, '');
        
        // Open WhatsApp link in new window
        window.open(`https://wa.me/91${phone}?text=${message}`, '_blank');
        
        // Add a small delay between messages to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success('WhatsApp messages prepared successfully');
    } catch (error) {
      console.error('Error sending messages:', error);
      toast.error('Error preparing WhatsApp messages');
    } finally {
      setSendingMessages(false);
    }
  };

  const handleTypeChange = (type: NotificationType) => {
    setNotificationType(type);
    setSelectedStudents(new Set());
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">WhatsApp Notifications</h2>
        </div>
        <button
          onClick={handleSendMessages}
          disabled={selectedStudents.size === 0 || sendingMessages}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {sendingMessages ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send WhatsApp Reminders
        </button>
      </div>

      {/* Type Selector */}
      <div className="flex space-x-4">
        <button
          onClick={() => handleTypeChange('upcoming')}
          className={`flex items-center px-4 py-2 rounded-md ${
            notificationType === 'upcoming'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <Clock className="h-4 w-4 mr-2" />
          Upcoming Due ({upcomingDueTransactions.length})
        </button>
        <button
          onClick={() => handleTypeChange('overdue')}
          className={`flex items-center px-4 py-2 rounded-md ${
            notificationType === 'overdue'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <AlertCircle className="h-4 w-4 mr-2" />
          Overdue ({overdueTransactions.length})
        </button>
      </div>

      {/* Info Card */}
      <div className={`${
        notificationType === 'upcoming' ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'
      } border rounded-lg p-4`}>
        <div className="flex items-start">
          <AlertCircle className={`h-5 w-5 mt-0.5 mr-3 ${
            notificationType === 'upcoming' ? 'text-blue-400' : 'text-red-400'
          }`} />
          <div>
            <h3 className={`text-sm font-medium ${
              notificationType === 'upcoming' ? 'text-blue-800' : 'text-red-800'
            }`}>
              {notificationType === 'upcoming' 
                ? 'Upcoming Due Reminders'
                : 'Overdue Book Notifications'
              }
            </h3>
            <p className={`mt-1 text-sm ${
              notificationType === 'upcoming' ? 'text-blue-600' : 'text-red-600'
            }`}>
              {notificationType === 'upcoming'
                ? 'Send reminders to students whose books are due within the next 5 days.'
                : 'Send notifications to students who have overdue books that need immediate return.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Students List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {notificationType === 'upcoming' ? 'Upcoming Due Books' : 'Overdue Books'} ({currentTransactions.length})
            </h3>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedStudents.size === currentTransactions.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
        </div>

        {currentTransactions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {currentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  selectedStudents.has(transaction.student_id) 
                    ? notificationType === 'upcoming' 
                      ? 'bg-blue-50'
                      : 'bg-red-50'
                    : ''
                }`}
              >
                <div className="flex items-center space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedStudents.has(transaction.student_id)}
                    onChange={() => handleToggleStudent(transaction.student_id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {transaction.student?.name}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        notificationType === 'upcoming'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {notificationType === 'upcoming'
                          ? `Due in ${transaction.daysUntilDue} days`
                          : `Overdue by ${transaction.daysOverdue} days`
                        }
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Book: {transaction.book?.name}
                    </p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <p>Due Date: {new Date(transaction.due_date).toLocaleDateString()}</p>
                      <span className="mx-2">•</span>
                      <p>Contact: {transaction.student?.contact_number}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">All Clear!</h3>
            <p className="mt-1 text-sm text-gray-500">
              {notificationType === 'upcoming'
                ? 'No books are due within the next 5 days.'
                : 'No books are currently overdue.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default WhatsAppNotifications;