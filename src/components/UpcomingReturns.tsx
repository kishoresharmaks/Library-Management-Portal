import React, { useMemo } from 'react';
import { 
  Clock, 
  User, 
  Book, 
  Phone, 
  Mail, 
  AlertCircle,
  Building2,
  GraduationCap
} from 'lucide-react';
import { useTransactions } from '../hooks/useSupabase';

function UpcomingReturns() {
  const { transactions, loading } = useTransactions();

  const upcomingReturns = useMemo(() => {
    const now = new Date();
    const twoDaysFromNow = new Date(now.getTime() + (2 * 24 * 60 * 60 * 1000));
    
    return transactions
      .filter(transaction => {
        const dueDate = new Date(transaction.due_date);
        return transaction.status === 'Borrowed' &&
               dueDate > now &&
               dueDate <= twoDaysFromNow;
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [transactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">Books Due in Next 2 Days</h2>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
          {upcomingReturns.length} books due soon
        </span>
      </div>

      {upcomingReturns.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming returns</h3>
          <p className="mt-1 text-sm text-gray-500">
            No books are due for return in the next 2 days.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {upcomingReturns.map((transaction) => {
            const dueDate = new Date(transaction.due_date);
            const hoursUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60));
            
            return (
              <div 
                key={transaction.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Book Details */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-16 bg-amber-50 rounded-lg flex items-center justify-center">
                        <Book className="h-6 w-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {transaction.book?.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Access No: {transaction.book?.isbn}
                        </p>
                        <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Due in {hoursUntilDue} hours
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {transaction.student?.name}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {transaction.student?.reg_number}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Building2 className="h-4 w-4 mr-2" />
                          {transaction.student?.department}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Year {transaction.student?.year}, Section {transaction.student?.section}
                        </div>
                        {transaction.student?.contact_number && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {transaction.student?.contact_number}
                          </div>
                        )}
                        {transaction.student?.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="h-4 w-4 mr-2" />
                            {transaction.student?.email}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center text-sm">
                          <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
                          <span className="text-amber-700">
                            Due on {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UpcomingReturns;