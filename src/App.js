// File: frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Dashboard Pages
import Dashboard from './pages/dashboard/Dashboard';
import UserManagement from './pages/users/UserManagement';
import UserDetail from './pages/users/UserDetail';
import UserCreate from './pages/users/UserCreate';
import RoleManagement from './pages/roles/RoleManagement';
import RoleBuilder from './pages/roles/RoleBuilder';
import AuditLogs from './pages/auditing/AuditLogs';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="page page-center">
        <div className="container container-slim py-4">
          <div className="text-center">
            <div className="mb-3">
              <div className="loader-dots"></div>
            </div>
            <h3>Loading...</h3>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Auth Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Route>
          
          {/* Dashboard Routes */}
          <Route 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            
            {/* User Management */}
            <Route path="/users" element={<UserManagement />} />
            <Route path="/users/create" element={<UserCreate />} />
            <Route path="/users/:id" element={<UserDetail />} />
            
            {/* Role Management */}
            <Route path="/roles" element={<RoleManagement />} />
            <Route path="/roles/create" element={<RoleBuilder />} />
            <Route path="/roles/:id" element={<RoleBuilder />} />
            
            {/* Audit Logs */}
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>
          
          {/* Redirect fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;