# Development Guide

## Architecture Overview

This document provides detailed information about the application architecture and how to work with the codebase.

---

## 🏗️ Architecture Patterns

### 1. Component Architecture

#### Functional Components
All components use React functional components with hooks:

```javascript
import React, { useState, useEffect } from 'react';

const MyComponent = () => {
  const [state, setState] = useState(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return <div>Component JSX</div>;
};

export default MyComponent;
```

#### Component Types

**Pages** (`src/pages/`)
- Full page components
- Route destinations
- Connect to services
- Manage page-level state

**Layouts** (`src/layouts/`)
- Page structure components
- Navbar, Sidebar, etc.
- Shared across pages
- Handle navigation

**Components** (`src/components/`)
- Reusable UI elements
- Presentational components
- Minimal logic
- Props-driven

---

### 2. State Management

#### Context API Structure

**AuthContext**
```javascript
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  
  // Auth methods
  const login = async (email, password) => { /* ... */ };
  const logout = () => { /* ... */ };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

**Usage in Components**
```javascript
import { useAuth } from '../context/AuthContext';

const MyComponent = () => {
  const { user, login, logout } = useAuth();
  // Use authentication state and methods
};
```

#### Local State
Use `useState` for component-specific state:
```javascript
const [loading, setLoading] = useState(false);
const [data, setData] = useState([]);
const [error, setError] = useState(null);
```

---

### 3. Custom Hooks

#### useFetch Hook
```javascript
const { data, loading, error, refetch } = useFetch(
  () => serviceFunction(),
  [dependencies]
);
```

**Use Cases:**
- Fetching data on component mount
- Automatic loading states
- Error handling
- Data refetching

#### useForm Hook
```javascript
const { values, errors, handleChange, handleSubmit } = useForm(
  initialValues,
  onSubmit
);
```

**Use Cases:**
- Form state management
- Validation handling
- Submit processing
- Error display

---

### 4. Routing Structure

#### Route Configuration
```javascript
<Routes>
  <Route path="/public" element={<PublicPage />} />
  
  <Route
    path="/protected"
    element={
      <PrivateRoute allowedRoles={['admin']}>
        <ProtectedPage />
      </PrivateRoute>
    }
  />
</Routes>
```

#### Route Protection
```javascript
const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" />;
  
  return children;
};
```

---

### 5. API Service Layer

#### Service Structure
```javascript
// src/services/api.js
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Request interceptor - Add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Global error handling
    return Promise.reject(error);
  }
);
```

#### Service Functions
```javascript
// src/services/index.js
export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};
```

---

## 🔧 Development Workflow

### Adding a New Feature

#### 1. Create Service Functions
```javascript
// src/services/index.js
export const newFeatureService = {
  getAll: () => api.get('/new-feature'),
  create: (data) => api.post('/new-feature', data),
};
```

#### 2. Create Page Component
```javascript
// src/pages/NewFeaturePage.jsx
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { newFeatureService } from '../services';

const NewFeaturePage = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    const response = await newFeatureService.getAll();
    setData(response.data);
  };
  
  return (
    <DashboardLayout>
      <div>Your content</div>
    </DashboardLayout>
  );
};

export default NewFeaturePage;
```

#### 3. Add Route
```javascript
// src/App.jsx
<Route
  path="/new-feature"
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <NewFeaturePage />
    </PrivateRoute>
  }
/>
```

#### 4. Add Navigation Link
```javascript
// src/layouts/Sidebar.jsx
const links = [
  { path: '/new-feature', icon: '...', label: 'New Feature' }
];
```

---

### Creating Reusable Components

#### Component Template
```javascript
// src/components/MyComponent.jsx
import React from 'react';
import PropTypes from 'prop-types';

const MyComponent = ({ title, data, onAction }) => {
  return (
    <div className="component-wrapper">
      <h2>{title}</h2>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={onAction}>Action</button>
    </div>
  );
};

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  data: PropTypes.array.isRequired,
  onAction: PropTypes.func,
};

MyComponent.defaultProps = {
  onAction: () => {},
};

export default MyComponent;
```

---

## 📊 Working with Charts

### Using Recharts

#### Bar Chart Example
```javascript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const MyChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value" fill="#0ea5e9" />
    </BarChart>
  </ResponsiveContainer>
);
```

#### Data Format
```javascript
const chartData = [
  { name: 'Item 1', value: 85 },
  { name: 'Item 2', value: 92 },
  { name: 'Item 3', value: 78 },
];
```

---

## 🎨 Styling Guidelines

### Tailwind CSS Usage

#### Utility Classes
```jsx
<div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Title</h2>
  <p className="text-gray-600">Content</p>
</div>
```

#### Responsive Design
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Responsive grid: 1 col mobile, 2 tablet, 3 desktop */}
</div>
```

#### Common Patterns
```jsx
// Card
<div className="bg-white rounded-lg shadow p-6">

// Button
<button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">

// Input
<input className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">

// Badge
<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
```

---

## 🔍 Error Handling

### API Error Handling
```javascript
try {
  const response = await api.get('/endpoint');
  setData(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error
    toast.error(error.response.data.message);
  } else if (error.request) {
    // No response received
    toast.error('Network error');
  } else {
    // Other errors
    toast.error('An error occurred');
  }
}
```

### Component Error Boundaries
```javascript
<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

---

## 🧪 Testing Patterns

### Component Testing Structure
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
  
  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### API Mocking
```javascript
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([{ id: 1, name: 'User' }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 🚀 Performance Optimization

### Code Splitting
```javascript
import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./LazyComponent'));

<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

### Memoization
```javascript
import { useMemo, useCallback } from 'react';

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

---

## 📝 Code Standards

### Naming Conventions
- **Components:** PascalCase (`MyComponent.jsx`)
- **Hooks:** camelCase with 'use' prefix (`useFetch.js`)
- **Utilities:** camelCase (`helpers.js`)
- **Constants:** UPPER_SNAKE_CASE (`API_BASE_URL`)

### File Structure
```javascript
// 1. Imports
import React from 'react';
import { dependency } from 'package';

// 2. Constants
const CONSTANT_VALUE = 'value';

// 3. Component
const Component = () => {
  // State
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {}, []);
  
  // Handlers
  const handleAction = () => {};
  
  // Render
  return <div>JSX</div>;
};

// 4. Export
export default Component;
```

---

## 🔄 Git Workflow

### Branch Naming
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Urgent fixes
- `refactor/what-changed` - Code refactoring

### Commit Messages
```
feat: Add user authentication
fix: Resolve chart rendering issue
docs: Update API documentation
style: Format code with Prettier
refactor: Simplify data fetching logic
test: Add tests for UserService
```

---

## 📚 Best Practices

1. **Keep Components Small** - Single responsibility
2. **Use Custom Hooks** - Reusable logic
3. **Prop Validation** - TypeScript or PropTypes
4. **Error Boundaries** - Graceful error handling
5. **Loading States** - Better UX
6. **Consistent Naming** - Clear and descriptive
7. **Comment Complex Logic** - Help future developers
8. **Avoid Inline Styles** - Use Tailwind classes
9. **Separate Concerns** - Logic vs Presentation
10. **Test Critical Paths** - Ensure reliability

---

## 🛠️ Debugging Tips

### React DevTools
- Install React Developer Tools extension
- Inspect component tree
- Check props and state
- Profile performance

### Network Debugging
- Use browser DevTools Network tab
- Check API requests/responses
- Verify headers and payloads
- Monitor status codes

### Console Logging
```javascript
console.log('State:', state);
console.table(arrayData);
console.error('Error:', error);
```

---

## 📖 Additional Resources

- [React Documentation](https://react.dev)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Recharts Documentation](https://recharts.org)
- [Axios Documentation](https://axios-http.com)

---

**Last Updated:** February 2026  
**Version:** 1.0.0
