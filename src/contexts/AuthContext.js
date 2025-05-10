// File: frontend/src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { API_URL } from '../config';

// Create context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Configure axios with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if token is valid on load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Decode token to check expiration
        const decoded = jwt_decode(token);
        
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          // Try to refresh token
          await refreshUserToken();
        } else {
          // Get user data
          const res = await axios.get(`${API_URL}/api/v1/users/me`);
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      
      const res = await axios.post(`${API_URL}/api/v1/auth/login`, { email, password });
      
      // Save tokens and user data
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('refreshToken', res.data.refreshToken);
      
      setToken(res.data.token);
      setRefreshToken(res.data.refreshToken);
      setUser(res.data.user);
      
      return res.data.user;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Refresh token function
  const refreshUserToken = async () => {
    if (!refreshToken) return false;
    
    try {
      const res = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, { refreshToken });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API_URL}/api/v1/auth/logout`);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setToken(null);
      setRefreshToken(null);
      setUser(null);
    }
  };

  // Check if user has permission
  const hasPermission = (requiredPermission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(requiredPermission);
  };

  // Value to be provided by the context
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUserToken,
    hasPermission
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};