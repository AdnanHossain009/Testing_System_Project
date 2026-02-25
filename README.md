# Adaptive Outcome-Based Education Assessment System

A comprehensive React-based web application for managing outcome-based education assessments.

## Features

- **Role-Based Access Control**: Separate dashboards for Admin, Faculty, and Students
- **Assessment Management**: Create and manage assessments with CLO mapping
- **Analytics & Reporting**: Visualize student performance with interactive charts
- **PLO/CLO Tracking**: Monitor Program Learning Outcomes and Course Learning Outcomes

## Tech Stack

- **React 18** - Modern React with hooks
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **Context API** - State management

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
/src
  /components      # Reusable components
  /pages          # Page components
  /context        # Context API providers
  /services       # API services
  /hooks          # Custom hooks
  /layouts        # Layout components
  /utils          # Utility functions
```

## Default Credentials

- **Admin**: admin@university.edu / admin123
- **Faculty**: faculty@university.edu / faculty123
- **Student**: student@university.edu / student123

## API Configuration

Update the API base URL in `/src/services/api.js`:

```javascript
baseURL: 'http://localhost:5000/api'
```

## License

MIT
