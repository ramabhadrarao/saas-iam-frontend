// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
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
        const decoded = jwtDecode(token);
        
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
  }, [token]);

  // Setup token refresh interval
  useEffect(() => {
    if (!token) return;

    // Refresh token 5 minutes before it expires
    const decoded = jwtDecode(token);
    const expiryTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilRefresh = expiryTime - currentTime - (5 * 60 * 1000); // 5 minutes before expiry

    if (timeUntilRefresh <= 0) {
      // Token is already expired or about to expire
      refreshUserToken();
      return;
    }

    const refreshTimer = setTimeout(() => {
      refreshUserToken();
    }, timeUntilRefresh);

    return () => clearTimeout(refreshTimer);
  }, [token]);

  // Login function
  const login = async (email, password, tenantId = null, subdomain = null) => {
    try {
      setError('');
      setLoading(true);
      
      const loginPayload = { email, password };
      
      // Add tenant context if provided
      if (tenantId) {
        loginPayload.tenantId = tenantId;
      } else if (subdomain) {
        loginPayload.subdomain = subdomain;
      }
      
      const res = await axios.post(`${API_URL}/api/v1/auth/login`, loginPayload);
      
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
  const refreshUserToken = useCallback(async () => {
    if (!refreshToken) return false;
    
    try {
      const res = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, { refreshToken });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      
      // Update user if provided in response
      if (res.data.user) {
        setUser(res.data.user);
      }
      
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      logout();
      return false;
    }
  }, [refreshToken]);

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
  const hasPermission = useCallback((requiredPermission) => {
    if (!user) return false;
    
    // Master admin has all permissions
    if (user.userType === 'master_admin') {
      return true;
    }
    
    // Check user permissions array
    if (user.permissions?.includes(requiredPermission)) {
      return true;
    }
    
    // Check permissions in user roles
    if (user.roles && Array.isArray(user.roles)) {
      for (const role of user.roles) {
        if (role.permissions?.some(permission => 
          permission.name === requiredPermission || 
          permission === requiredPermission
        )) {
          return true;
        }
      }
    }
    
    return false;
  }, [user]);

  // Check if user can access tenant
  const canAccessTenant = useCallback((tenantId) => {
    if (!user) return false;
    
    // Master admin can access all tenants
    if (user.userType === 'master_admin') {
      return true;
    }
    
    // Tenant users can only access their own tenant
    return user.tenantId === tenantId || 
           (user.tenant && user.tenant.id === tenantId);
  }, [user]);

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
    hasPermission,
    canAccessTenant,
    isMasterAdmin: user?.userType === 'master_admin',
    isTenantAdmin: user?.userType === 'tenant_admin',
    isTenantUser: user?.userType === 'tenant_user'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};