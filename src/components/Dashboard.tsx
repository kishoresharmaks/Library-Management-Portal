import React, { useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { 
  BookOpen, 
  Users, 
  BookUp, 
  Clock, 
  TrendingUp, 
  BookCheck,
  Building2,
  CalendarDays,
  ChevronRight
} from 'lucide-react';
import { useBooks, useStudents, useTransactions } from '../hooks/useSupabase';

const StatCard = ({ title, value, icon: Icon, color, subtext, trend }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtext?: string;
  trend?: { value: number; positive: boolean };
}) => (
  <div className="backdrop-blur-md bg-white/40 rounded-xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/50 flex flex-col min-h-[160px]"> {/* Added min-h-[160px] */}
    <div className="flex items-start justify-between mb-2">
      <p className="text-sm font-medium text-gray-700">{title}</p>
      <div className={`p-2 rounded-lg ${color} shadow-md flex-shrink-0`}> 
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
    <div className="mt-auto pt-3 flex items-center justify-between flex-wrap gap-y-1"> {/* Added flex-wrap and gap-y-1 */}
      {subtext && (
        <p className="text-sm text-gray-600 mr-2">{subtext}</p>  
      )}
      {trend && (
        <span className={`inline-flex items-center text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'} px-2 py-1 rounded-full ${trend.positive ? 'bg-green-50' : 'bg-red-50'}`}>
          {trend.positive ? '+' : ''}{trend.value}%
        </span>
      )}
    </div>
  </div>
);

const ProgressBar = ({ value, max, color, label }: { 
  value: number; 
  max: number; 
  color: string;
  label: string;
}) => {
  const percentage = Math.round((value / max) * 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-700">{label}</span>
        <span className="text-sm font-medium text-gray-900">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-100/70 backdrop-blur-sm rounded-full h-2.5 overflow-hidden">
        <div
          className={`${color} h-2.5 rounded-full transition-all duration-500 shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

function Dashboard() {
  const { books, loading: booksLoading } = useBooks();
  const { students, loading: studentsLoading } = useStudents();
  const { transactions, loading: transactionsLoading } = useTransactions();
  const navigate = useNavigate(); // Initialize useNavigate

  const stats = useMemo(() => {
    const currentDate = new Date();
    
    // Get active borrowed books
    const borrowedBooks = transactions.filter(transaction => 
      transaction.status === 'Borrowed' && !transactions.some(t => 
        t.book_id === transaction.book_id && 
        t.status === 'Returned' &&
        new Date(t.return_date!) > new Date(transaction.borrowed_date)
      )
    );

    // Calculate overdue books
    const overdueBooks = borrowedBooks.filter(transaction => 
      new Date(transaction.due_date) < currentDate
    );

    // Calculate department statistics
    const departmentStats = students.reduce((acc, student) => {
      if (student.department) {
        acc[student.department] = (acc[student.department] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topDepartment = Object.entries(departmentStats)
      .sort(([, a], [, b]) => b - a)[0];

    // Calculate monthly transactions
    const thisMonth = currentDate.getMonth();
    const thisYear = currentDate.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
    
    const thisMonthTransactions = transactions.filter(t => {
      const date = new Date(t.borrowed_date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });
    
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.borrowed_date);
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
    });
    
    const transactionTrend = lastMonthTransactions.length > 0
      ? Math.round(((thisMonthTransactions.length - lastMonthTransactions.length) / lastMonthTransactions.length) * 100)
      : 0;

    // Calculate return rate
    const returnedOnTime = transactions.filter(t => 
      t.status === 'Returned' && 
      new Date(t.return_date!) <= new Date(t.due_date)
    ).length;

    const returnRate = transactions.length > 0
      ? Math.round((returnedOnTime / transactions.length) * 100)
      : 0;

    return {
      totalBooks: books.length,
      availableBooks: books.filter(b => b.is_available).length,
      totalStudents: students.filter(s => s.status === 'active').length,
      borrowedBooks: borrowedBooks.length,
      overdueBooks: overdueBooks.length,
      monthlyTransactions: thisMonthTransactions.length,
      transactionTrend,
      topDepartment: topDepartment ? {
        name: topDepartment[0],
        count: topDepartment[1]
      } : null,
      returnRate
    };
  }, [books, students, transactions]);

  // Get recent activities with more context
  const recentActivities = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.borrowed_date).getTime() - new Date(a.borrowed_date).getTime())
      .slice(0, 5)
      .map(transaction => {
        const isOverdue = transaction.status === 'Borrowed' && 
          new Date(transaction.due_date) < new Date();

        return {
          id: transaction.id,
          studentName: transaction.student?.name || 'Unknown Student',
          studentDepartment: transaction.student?.department,
          bookName: transaction.book?.name || 'Unknown Book',
          date: new Date(transaction.status === 'Returned' ? transaction.return_date! : transaction.borrowed_date),
          type: transaction.status,
          isOverdue
        };
      });
  }, [transactions]);

  // Function to handle navigation
  const handleNavigateToTransactions = (activityId?: string) => {
    // Basic navigation for now, can be enhanced later with filtering
    navigate('/transactions', { state: { filterByActivityId: activityId } });
  };

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const totalBooks = books.length;
    const activeStudents = students.filter(s => s.status === 'active').length;
    const utilization = totalBooks > 0 
      ? Math.round((stats.borrowedBooks / totalBooks) * 100)
      : 0;

    const studentEngagement = activeStudents > 0
      ? Math.round((transactions.length / activeStudents) * 2) // multiply by 2 to get a percentage out of 100
      : 0;

    return {
      utilization,
      studentEngagement: Math.min(studentEngagement, 100), // cap at 100%
      returnRate: stats.returnRate
    };
  }, [books, students, transactions, stats]);

  if (booksLoading || studentsLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className='flex items-center justify-center h-screen'><div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div></div>}>
      <div className='p-4 md:p-6 lg:p-8 max-w-7xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen'>
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Library Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of library statistics and activities</p>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {/* StatCard components remain the same, but will use the updated StatCard component above */}
          <StatCard
            title="Total Books"
            value={stats.totalBooks.toLocaleString()}
            icon={BookOpen}
            color="bg-blue-500"
            subtext={`${stats.availableBooks} available`}
          />
          <StatCard
            title="Active Students"
            value={stats.totalStudents.toLocaleString()}
            icon={Users}
            color="bg-emerald-500"
            subtext="Currently enrolled"
          />
          <StatCard
            title="Books Borrowed"
            value={stats.borrowedBooks.toLocaleString()}
            icon={BookUp}
            color="bg-indigo-500"
            subtext="Currently in circulation"
            trend={{ value: stats.transactionTrend, positive: stats.transactionTrend >= 0 }}
          />
          <StatCard
            title="Overdue Books"
            value={stats.overdueBooks.toLocaleString()}
            icon={Clock}
            color="bg-rose-500"
            subtext="Need attention"
          />
        </div>

        {/* Performance & Insights Section */}
        {/* Changed grid layout for better responsiveness */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          {/* Performance Metrics */}
          <div className="backdrop-blur-md bg-white/40 rounded-xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="space-y-6">
              <ProgressBar
                value={performanceMetrics.utilization}
                max={100}
                color="bg-blue-500"
                label="Book Utilization"
              />
              <ProgressBar
                value={performanceMetrics.studentEngagement}
                max={100}
                color="bg-emerald-500"
                label="Student Engagement"
              />
              <ProgressBar
                value={performanceMetrics.returnRate}
                max={100}
                color="bg-indigo-500"
                label="Return Rate"
              />
            </div>
          </div>

          {/* Department Insights */}
          <div className="backdrop-blur-md bg-white/40 rounded-xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Department Insights</h3>
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            {stats.topDepartment ? (
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Most Active Department</p>
                  <div className="flex items-center">
                    <span className="text-xl font-bold text-gray-900">{stats.topDepartment.name}</span>
                    <span className="ml-2 px-3 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full shadow-sm">
                      {stats.topDepartment.count} students
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200/50">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Monthly Transactions</p>
                    <p className="text-xl font-bold text-gray-900">{stats.monthlyTransactions}</p>
                    {stats.transactionTrend !== 0 && (
                      <span className={`text-xs font-medium ${stats.transactionTrend > 0 ? 'text-emerald-600' : 'text-rose-600'} px-2 py-0.5 rounded-full ${stats.transactionTrend > 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        {stats.transactionTrend > 0 ? '+' : ''}{stats.transactionTrend}% from last month
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Return Rate</p>
                    <div className="flex items-center">
                      <p className="text-xl font-bold text-gray-900">{stats.returnRate}%</p>
                      <div className={`ml-2 w-3 h-3 rounded-full ${stats.returnRate > 75 ? 'bg-emerald-500' : stats.returnRate > 50 ? 'bg-yellow-500' : 'bg-rose-500'} shadow-sm`}></div>
                    </div>
                    <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${ /* Added mt-1 and inline-block */
                      stats.returnRate > 75
                        ? 'bg-emerald-50 text-emerald-700'
                        : stats.returnRate > 50
                          ? 'bg-yellow-50 text-yellow-700'
                          : 'bg-rose-50 text-rose-700'
                    }`}>
                      {stats.returnRate > 75 ? 'Excellent' : stats.returnRate > 50 ? 'Average' : 'Needs improvement'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-6">No department data available</p>
            )}
          </div>

          {/* Recent Activities */}
          <div className="backdrop-blur-md bg-white/40 rounded-xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl hover:bg-white/50 md:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>

            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="w-full text-left flex items-start space-x-3 p-3 rounded-lg bg-white/30 backdrop-blur-sm border border-white/40 shadow-sm"
                  >
                    <div className={`mt-1 p-2 rounded-lg ${
                      activity.type === 'Borrowed'
                        ? activity.isOverdue ? 'bg-rose-100' : 'bg-blue-100'
                        : 'bg-emerald-100'
                    } shadow-sm flex-shrink-0`}>
                      {activity.type === 'Borrowed' ? (
                        <BookUp className={`h-4 w-4 ${
                          activity.isOverdue ? 'text-rose-600' : 'text-blue-600'
                        }`} />
                      ) : (
                        <BookCheck className="h-4 w-4 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        <span className="font-semibold">{activity.studentName}</span>
                        {activity.type === 'Borrowed' ? ' borrowed ' : ' returned '}
                        <span className="font-semibold">{activity.bookName}</span>
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {activity.studentDepartment} • {activity.date.toLocaleDateString()}
                        </p>
                        {activity.isOverdue && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-800 rounded-full shadow-sm">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-10 w-10 text-gray-400 mb-3" />
                <p className="text-gray-500">No recent activities to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    
  </Suspense>
  
  );
  
}

export default Dashboard;
 