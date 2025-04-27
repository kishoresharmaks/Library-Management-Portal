import React, { useMemo } from 'react';
import { 
  BookOpen, 
  Users, 
  BookUp, 
  Clock, 
  TrendingUp, 
  BookCheck,
  Building2,
  CalendarDays,
  ChevronRight,
  Loader2,
  BookCopy,
  GraduationCap,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useBooks, useStudents, useTransactions } from '../hooks/useSupabase';

const StatCard = ({ title, value, icon: Icon, color, subtext, trend }: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtext?: string;
  trend?: { value: number; positive: boolean };
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
    <div className="flex items-center justify-between mb-2">
      <p className="text-sm font-medium text-gray-600">{title}</p>
      <div className={`p-2 rounded-xl ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
    <div className="flex items-baseline">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {trend && (
        <span className={`ml-2 flex items-center text-xs font-medium ${
          trend.positive ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend.positive ? (
            <ArrowUpRight className="h-3 w-3 mr-0.5" />
          ) : (
            <ArrowDownRight className="h-3 w-3 mr-0.5" />
          )}
          {trend.value}%
        </span>
      )}
    </div>
    {subtext && (
      <p className="mt-1 text-sm text-gray-500">{subtext}</p>
    )}
  </div>
);

function Dashboard() {
  const { books, loading: booksLoading } = useBooks();
  const { students, loading: studentsLoading } = useStudents();
  const { transactions, loading: transactionsLoading } = useTransactions();

  const stats = useMemo(() => {
    const currentDate = new Date();
    
    const borrowedBooks = transactions.filter(transaction => 
      transaction.status === 'Borrowed' && !transactions.some(t => 
        t.book_id === transaction.book_id && 
        t.status === 'Returned' &&
        new Date(t.return_date!) > new Date(transaction.borrowed_date)
      )
    );

    const overdueBooks = borrowedBooks.filter(transaction => 
      new Date(transaction.due_date) < currentDate
    );

    // Calculate monthly transaction data for the last 6 months
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.borrowed_date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear();
      });

      return {
        name: `${month} ${year}`,
        borrowed: monthTransactions.filter(t => t.status === 'Borrowed').length,
        returned: monthTransactions.filter(t => t.status === 'Returned').length
      };
    }).reverse();

    // Department statistics
    const departmentStats = students.reduce((acc, student) => {
      const dept = student.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const departmentData = Object.entries(departmentStats).map(([name, value]) => ({
      name,
      value
    }));

    // Book status distribution
    const bookStatusData = [
      { name: 'Available', value: books.filter(b => b.is_available).length },
      { name: 'Borrowed', value: books.filter(b => !b.is_available).length }
    ];

    return {
      totalBooks: books.length,
      availableBooks: books.filter(b => b.is_available).length,
      borrowedBooks: borrowedBooks.length,
      overdueBooks: overdueBooks.length,
      monthlyData,
      departmentData,
      bookStatusData
    };
  }, [books, students, transactions]);

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  if (booksLoading || studentsLoading || transactionsLoading) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-lg font-medium text-gray-600">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white p-6">
      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Books"
          value={stats.totalBooks.toLocaleString()}
          icon={BookCopy}
          color="bg-blue-600"
          subtext={`${stats.availableBooks} available`}
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          title="Available Books"
          value={stats.availableBooks.toLocaleString()}
          icon={BookOpen}
          color="bg-emerald-600"
          subtext="Ready to borrow"
          trend={{ value: 3, positive: true }}
        />
        <StatCard
          title="Borrowed Books"
          value={stats.borrowedBooks.toLocaleString()}
          icon={BookUp}
          color="bg-violet-600"
          subtext="Currently in circulation"
        />
        <StatCard
          title="Overdue Books"
          value={stats.overdueBooks.toLocaleString()}
          icon={Clock}
          color="bg-red-600"
          subtext="Need attention"
          trend={{ value: 12, positive: false }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Transactions Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Transactions</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="borrowed" 
                  stackId="1"
                  stroke="#3B82F6" 
                  fill="#93C5FD" 
                  name="Borrowed"
                />
                <Area 
                  type="monotone" 
                  dataKey="returned" 
                  stackId="1"
                  stroke="#10B981" 
                  fill="#6EE7B7"
                  name="Returned"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Department Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={stats.departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8B5CF6" name="Students" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Book Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Book Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.bookStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.bookStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <div className="p-2 rounded-xl bg-gray-100">
              <CalendarDays className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div className="space-y-4">
            {transactions
              .sort((a, b) => new Date(b.borrowed_date).getTime() - new Date(a.borrowed_date).getTime())
              .slice(0, 5)
              .map((transaction) => {
                const isOverdue = transaction.status === 'Borrowed' && 
                  new Date(transaction.due_date) < new Date();
                
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50"
                  >
                    <div className={`p-2 rounded-lg ${
                      transaction.status === 'Borrowed'
                        ? isOverdue ? 'bg-red-100' : 'bg-blue-100'
                        : 'bg-green-100'
                    }`}>
                      {transaction.status === 'Borrowed' ? (
                        isOverdue ? (
                          <Clock className="h-5 w-5 text-red-600" />
                        ) : (
                          <BookUp className="h-5 w-5 text-blue-600" />
                        )
                      ) : (
                        <BookCheck className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.book?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {transaction.student?.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">
                        {new Date(transaction.borrowed_date).toLocaleDateString()}
                      </p>
                      <p className={`text-sm ${
                        isOverdue ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {isOverdue ? 'Overdue' : transaction.status}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;