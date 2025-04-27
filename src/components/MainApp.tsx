import React, { useState, useEffect, lazy, Suspense, memo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  LayoutDashboard, 
  RepeatIcon,
  Menu,
  X,
  LogOut,
  BookUp,
  AlertCircle,
  MessageSquare,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useIdleTimer } from '../hooks/useIdleTimer';

// Lazy-loaded components
const LoginPage = lazy(() => import('./LoginPage'));
const Dashboard = lazy(() => import('./Dashboard'));
const BooksManagement = lazy(() => import('./BooksManagement'));
const StudentsManagement = lazy(() => import('./StudentsManagement'));
const Transactions = lazy(() => import('./Transactions'));
const IssueReturn = lazy(() => import('./IssueReturn'));
const Overdue = lazy(() => import('./Overdue'));
const WhatsAppNotifications = lazy(() => import('./WhatsAppNotifications'));
const StaffTransactions = lazy(() => import('./StaffTransactions'));

// Loader component
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-full min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
  </div>
);

// Memoized navigation button component for better performance
const NavButton = memo(({ item, activeTab, onClick }) => {
  const Icon = item.icon;
  const isActive = activeTab === item.id;
  
  return (
    <button
      onClick={() => onClick(item.id)}
      className={`${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
      } group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg w-full transition-all duration-150`}
    >
      <div className="flex items-center">
        <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-blue-500'}`} />
        {item.name}
      </div>
      {isActive && <ChevronRight className="h-4 w-4" />}
    </button>
  );
});

function MainApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading, signOut } = useAuth();

  // Initialize idle timer
  useIdleTimer();

  // Memoized navigation data to prevent unnecessary re-renders
  const navigation = React.useMemo(() => [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'books', name: 'Books Management', icon: BookOpen },
    { id: 'students', name: 'Students Management', icon: Users },
    { id: 'issue-return', name: 'Issue/Return Books', icon: BookUp },
    { id: 'staff-issue-return', name: 'Staff Issue/Return', icon: BookUp },
    { id: 'transactions', name: 'Transactions', icon: RepeatIcon },
    { id: 'overdue', name: 'Overdue Books', icon: AlertCircle },
    { id: 'whatsapp', name: 'WhatsApp Notifications', icon: MessageSquare },
  ], []);

  // Debounced window resize handler for performance
  useEffect(() => {
    let resizeTimer;
    
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth >= 1024) {
          setIsSidebarOpen(false);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  // Preload active component when tab changes
  useEffect(() => {
    // Preload the next component based on activeTab
    const preloadMap = {
      'dashboard': () => import('./Dashboard'),
      'books': () => import('./BooksManagement'),
      'students': () => import('./StudentsManagement'),
      'issue-return': () => import('./IssueReturn'),
      'staff-issue-return': () => import('./StaffTransactions'),
      'transactions': () => import('./Transactions'),
      'overdue': () => import('./Overdue'),
      'whatsapp': () => import('./WhatsAppNotifications')
    };
    
    // If we have a preload function for this tab, call it
    if (preloadMap[activeTab]) {
      preloadMap[activeTab]();
    }
  }, [activeTab]);

  // Optimized tab change handler
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
  };

  // Optimized content rendering with memoization
  const renderContent = React.useMemo(() => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'books':
        return <BooksManagement />;
      case 'students':
        return <StudentsManagement />;
      case 'issue-return':
        return <IssueReturn />;
      case 'staff-issue-return':
        return <StaffTransactions />;
      case 'transactions':
        return <Transactions />;
      case 'overdue':
        return <Overdue />;
      case 'whatsapp':
        return <WhatsAppNotifications />;
      default:
        return <Dashboard />;
    }
  }, [activeTab]);

  // Current date - memoized to avoid recalculation on each render
  const currentDate = React.useMemo(() => {
    return new Date().toLocaleDateString();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      }>
        <LoginPage />
      </Suspense>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Optimized overlay with will-change */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 lg:hidden"
            style={{ willChange: 'opacity' }}
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Optimized sidebar with will-change */}
        <div 
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:relative lg:translate-x-0 z-30 transition-transform duration-300 ease-in-out w-72 min-h-screen bg-white shadow-lg flex flex-col`}
          style={{ willChange: 'transform' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">Sona - Library</h2>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center font-bold text-lg">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-medium text-gray-800">{/*{user?.name || 'User'}*/}Admin User</h3>
                <p className="text-xs text-gray-500">{user?.role || 'Staff'}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Main Menu
            </p>
            {navigation.map((item) => (
              <NavButton 
                key={item.id} 
                item={item} 
                activeTab={activeTab} 
                onClick={handleTabChange} 
              />
            ))}
          </nav>
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={signOut}
              className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg w-full transition-colors duration-150"
            >
              <LogOut className="h-5 w-5 mr-3 text-gray-500" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white shadow-sm h-16 flex items-center px-4 sticky top-0 z-10">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-600 mr-4 p-1 rounded-md hover:bg-gray-100"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                {navigation.find(item => item.id === activeTab)?.name}
              </h1>
              <span className="ml-2 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                {currentDate}
              </span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <Suspense fallback={<LoadingFallback />}>
                {renderContent}
              </Suspense>
            </div>
          </main>
          <footer className="bg-white border-t border-gray-200 py-3 px-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Library Management System
          </footer>
        </div>
      </div>
    </>
  );
}

export default MainApp;