# 📚 Library Management System

<div align="center">
  <img src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&auto=format&fit=crop&q=90" width="100%" alt="Library Management System">

  ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
  ![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

  <p align="center">
    A modern, full-featured library management system built with React and Supabase
    <br />
    <a href="#-features"><strong>Explore Features »</strong></a>
    <br />
    <br />
    <a href="#-demo">View Demo</a>
    ·
    <a href="https://github.com/kishoresharmaks/Library-Management-Portal/issues">Report Bug</a>
    ·
    
  <a href="https://github.com/kishoresharmaks/Library-Management-Portal/issues">Request Feature</a>
  </p>
</div>

## 📋 Table of Contents
- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

## 🎯 About

The Library Management System is a comprehensive solution designed to streamline library operations. It offers powerful features for managing books, students, and transactions while providing real-time insights through an interactive dashboard.

### 🌟 Why Choose This System?

- **Modern Tech Stack**: Built with the latest technologies
- **Real-time Updates**: Live data synchronization
- **Mobile Responsive**: Works seamlessly on all devices
- **Scalable Architecture**: Designed for growth
- **Secure**: Implements industry-standard security practices

## 🚀 Features

### 📊 Interactive Dashboard
- Real-time statistics and metrics
- Visual data representation
- Activity monitoring
- Performance insights

### 📚 Book Management
- Comprehensive catalog system
- Advanced search & filtering
- Bulk operations support
- Import/Export functionality
- Real-time availability tracking

### 👥 Student Management
- Student registration system
- Department organization
- Contact information management
- Status tracking (Active/Inactive/Graduated)
- Bulk data operations

### 🔄 Issue/Return System
- Streamlined borrowing workflow
- Due date management
- Fine calculation
- Quick return processing
- Staff-specific workflows

### 📱 WhatsApp Integration
- Automated notifications
- Due date reminders
- Overdue alerts
- Batch message processing

### 📈 Analytics & Reporting
- Detailed transaction reports
- Usage statistics
- Department-wise analysis
- Custom report generation
- Data export capabilities

## 🛠 Tech Stack

### Frontend
- **React** (v18.3.1) - UI Framework
- **TypeScript** (v5.5.3) - Type Safety
- **Vite** (v5.4.2) - Build Tool
- **TailwindCSS** (v3.4.1) - Styling
- **Lucide React** (v0.344.0) - Icons
- **React Router DOM** (v6.22.3) - Routing
- **Recharts** (v2.12.2) - Charts

### Backend (Supabase)
- **PostgreSQL** - Database
- **Row Level Security** - Data Protection
- **Real-time Subscriptions** - Live Updates
- **Authentication** - User Management

## 💻 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Git
- Supabase Account

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/kishoresharmaks/Library-Management-Portal.git
   cd Library-Management-Portal
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start development server
   ```bash
   npm run dev
   ```

### Database Setup

1. Create a new Supabase project
2. Run the migration files from `/supabase/migrations`
3. Set up Row Level Security policies
4. Configure authentication

## 📱 Screenshots

<div align="center">
  <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop&q=90" width="45%" alt="Dashboard">
  <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=90" width="45%" alt="Book Management">
</div>

## 📦 Project Structure

```
/src
├── components/       # React components
│   ├── Dashboard/
│   ├── Books/
│   ├── Students/
│   └── Transactions/
├── hooks/           # Custom React hooks
├── lib/            # Utility functions
├── types/          # TypeScript types
└── assets/         # Static assets
/supabase
└── migrations/     # Database migrations
/docs              # Documentation
```

## 🔐 Security Features

### Authentication
- Secure login system
- Session management
- Idle timeout protection
- Role-based access control

### Data Protection
- Row Level Security
- Input validation
- SQL injection prevention
- XSS protection
- CSRF protection

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add proper documentation
- Test thoroughly
- Update relevant documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

Your Name - Kishoresharma 
krishkishoreks@gmail.com

Project Link: [Library-Management-Portal](https://github.com/kishoresharmaks/Library-Management-Portal)

## 🙏 Acknowledgments

- [React Documentation](https://reactjs.org/)
- [Supabase Documentation](https://supabase.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
