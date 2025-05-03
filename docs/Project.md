# Library Management System Documentation

## Project Overview

The Library Management System is a modern web application built to manage library operations efficiently. It provides features for managing books, students, transactions, and generating insights through an interactive dashboard.

## Technology Stack

### Frontend
- **React** (v18.3.1) - Core UI framework
- **TypeScript** (v5.5.3) - Type safety and better developer experience
- **Vite** (v5.4.2) - Build tool and development server
- **TailwindCSS** (v3.4.1) - Utility-first CSS framework
- **Lucide React** (v0.344.0) - Icon library
- **React Router DOM** (v6.22.3) - Client-side routing
- **React Hot Toast** (v2.4.1) - Toast notifications
- **Recharts** (v2.12.2) - Interactive charts and graphs

### Backend
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL Database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions

## Project Structure

```
/src
  /components         # React components
  /hooks             # Custom React hooks
  /lib               # Utility functions and configurations
  /types             # TypeScript type definitions
/supabase
  /migrations        # Database migration files
/docs                # Project documentation
```

## Core Features

1. **Enhanced Authentication System**
   - Secure email/password login
   - Session management with idle timeout (15 minutes)
   - CAPTCHA verification for login attempts
   - Account lockout after multiple failed attempts
   - Remember me functionality
   - Password strength validation
   - Secure session storage

2. **Interactive Dashboard**
   - Real-time statistics with auto-refresh
   - Transaction trends visualization
   - Department-wise student distribution
   - Book status distribution charts
   - Recent activity feed with status indicators
   - Quick access to overdue and upcoming returns

3. **Books Management**
   - Add/Edit books with validation
   - Real-time availability tracking
   - Bulk operations support
   - Advanced search and filtering
   - Grid and list view options
   - CSV import/export functionality
   - Access number (ISBN) validation

4. **Students Management**
   - Comprehensive student registration
   - Department and section tracking
   - Multiple contact methods
   - Status management (active/inactive/graduated)
   - Bulk import/export capabilities
   - Advanced filtering options

5. **Staff Management**
   - Dedicated staff borrowing system
   - Extended borrowing periods
   - Special status tracking
   - Separate transaction history
   - Staff-specific notifications

6. **Issue/Return System**
   - Streamlined borrowing workflow
   - Due date management
   - Quick return processing
   - Real-time availability updates
   - Transaction validation
   - Separate staff borrowing interface

7. **Transaction History**
   - Complete borrowing records
   - Advanced filtering and sorting
   - Date range selection
   - Export capabilities
   - Status tracking
   - Detailed transaction views

8. **Overdue Management**
   - Automated overdue detection
   - Remarks system with timestamp
   - Staff attribution for remarks
   - WhatsApp notification integration
   - Bulk notification sending

9. **Upcoming Returns**
   - Proactive return tracking
   - Due date notifications
   - Student contact information
   - Priority-based sorting
   - Quick access to borrower details

10. **Public Book Catalog**
    - Public access to book availability
    - Real-time updates
    - Advanced search capabilities
    - Chatbot assistance
    - Mobile-responsive design

11. **WhatsApp Integration**
    - Automated notifications
    - Customizable message templates
    - Bulk message sending
    - Contact validation
    - Message tracking

## Database Schema

### Tables

1. **books**
   - `id`: UUID (Primary Key)
   - `isbn`: Text (Access Number)
   - `name`: Text
   - `author`: Text
   - `is_available`: Boolean
   - `created_at`: Timestamp
   - `updated_at`: Timestamp

2. **students**
   - `id`: UUID (Primary Key)
   - `reg_number`: Text (Unique)
   - `name`: Text
   - `department`: Text
   - `section`: Text
   - `year`: Integer
   - `semester`: Integer
   - `contact_number`: Text
   - `contact_info`: Text
   - `email`: Text
   - `status`: Text (active/inactive/graduated)

3. **transactions**
   - `id`: UUID (Primary Key)
   - `book_id`: UUID (Foreign Key)
   - `student_id`: UUID (Foreign Key)
   - `borrowed_date`: Timestamp
   - `due_date`: Timestamp
   - `return_date`: Timestamp
   - `status`: Text (Borrowed/Returned)
   - `remarks`: Text
   - `remarks_date`: Timestamp
   - `remarks_by`: Text
   - `renewals_count`: Integer
   - `last_renewed_at`: Timestamp

## Security Features

1. **Authentication**
   - Email/password authentication
   - Session management
   - CAPTCHA verification
   - Account lockout protection
   - Password strength requirements
   - Secure token storage

2. **Row Level Security (RLS)**
   - Table-level access control
   - User-based data isolation
   - Role-based permissions
   - Transaction validation

3. **Data Protection**
   - Input validation
   - SQL injection prevention
   - XSS protection
   - CSRF protection
   - Rate limiting

## Component Features

### LoginPage
- Secure authentication flow
- Password strength validation
- CAPTCHA integration
- Account lockout system
- Remember me functionality
- Error handling and feedback
- Responsive design

### Dashboard
- Real-time statistics
- Interactive charts
- Activity monitoring
- Performance optimizations
- Auto-refresh capability
- Responsive layout

### BooksManagement
- Grid/List view toggle
- Advanced search
- Bulk operations
- Import/Export
- Real-time updates
- Status tracking

### StudentsManagement
- Comprehensive registration
- Status management
- Contact tracking
- Bulk operations
- Advanced filtering
- Export capabilities

### IssueReturn
- Streamlined workflow
- Real-time validation
- Due date management
- Quick actions
- Status updates

### StaffTransactions
- Extended borrowing periods
- Special privileges
- Dedicated interface
- Status tracking

### Transactions
- Complete history
- Advanced filtering
- Date range selection
- Export functionality
- Status tracking

### Overdue
- Automated detection
- Remarks system
- Notification integration
- Bulk actions

### WhatsAppNotifications
- Automated messaging
- Template management
- Bulk sending
- Contact validation

### UpcomingReturns
- Proactive tracking
- Priority sorting
- Contact information
- Quick actions

## Development Guide

### Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

### Code Organization

- Components follow single responsibility principle
- Custom hooks for data management
- TypeScript interfaces for type safety
- Consistent file structure
- Modular design

### State Management
- React Context for global state
- Custom hooks for data operations
- Local state for UI components
- Real-time subscriptions

### Performance Optimizations
- Code splitting
- Lazy loading
- Memoization
- Debounced search
- Optimized renders

### Error Handling
- Comprehensive error states
- User feedback
- Error boundaries
- Loading states
- Fallback UI

## Deployment

The application can be deployed to any static hosting service. Current deployment uses Netlify with:
- Automatic deployments from main branch
- Environment variable management
- Build command: `npm run build`
- Output directory: `dist`

## Future Improvements

1. **Features**
   - Book reservation system
   - Fine management
   - Multiple library branches
   - Advanced reporting
   - Resource sharing

2. **Technical**
   - Unit testing
   - E2E testing
   - Performance monitoring
   - API documentation
   - Accessibility improvements

## Support

For technical support or questions:
1. Check existing documentation
2. Review common issues
3. Contact system administrator
4. Submit bug reports with detailed information