import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Users from './pages/Users';
import ProjectDetails from './pages/ProjectDetails';

// API 3 Verification Logic: Ensures token is valid
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // If token is missing, force redirect to Login
  return token ? children : <Navigate to="/login" replace />;
};

const Layout = ({ children }) => {
  const location = useLocation();
  // Safe parsing to avoid crashes if localStorage is empty
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    // API 4: Clear local data and redirect
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className="sidebar" style={{ width: '260px', background: '#111827', color: 'white', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '2rem', color: '#3b82f6' }}>SaaS Project Pro</h1>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'nav-active' : ''}`}>
            📊 Dashboard
          </Link>
          <Link to="/projects" className={`nav-item ${location.pathname.startsWith('/projects') ? 'nav-active' : ''}`}>
            📂 Projects
          </Link>
          
          {/* Role-Based UI: Restrict User Management */}
          {(user?.role === 'tenant_admin' || user?.role === 'super_admin') && (
            <Link to="/users" className={`nav-item ${location.pathname === '/users' ? 'nav-active' : ''}`}>
              👥 Team Members
            </Link>
          )}
        </nav>

        <div style={{ borderTop: '1px solid #374151', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.875rem', marginBottom: '1rem', color: '#9ca3af' }}>
            Logged in as: <br />
            <strong style={{ color: 'white' }}>{user?.full_name || 'User'}</strong>
          </div>
          <button onClick={handleLogout} className="logout-btn" style={{ width: '100%', padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content" style={{ flex: 1, background: '#f3f4f6', padding: '2rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Layout><Projects /></Layout></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute><Layout><ProjectDetails /></Layout></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Layout><Users /></Layout></ProtectedRoute>} />

        {/* Catch-all Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;