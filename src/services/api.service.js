// File: frontend/src/services/api.service.js
import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't retried yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Call refresh token API
        const res = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, {
          refreshToken
        });
        
        // Update token in localStorage and auth header
        const newToken = res.data.token;
        localStorage.setItem('token', newToken);
        
        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => 
    apiClient.post('/api/v1/auth/login', { email, password }),
  
  logout: () => 
    apiClient.post('/api/v1/auth/logout'),
  
  refreshToken: (refreshToken) => 
    apiClient.post('/api/v1/auth/refresh-token', { refreshToken }),
  
  forgotPassword: (email) => 
    apiClient.post('/api/v1/auth/forgot-password', { email }),
  
  resetPassword: (token, password) => 
    apiClient.post('/api/v1/auth/reset-password', { token, password })
};

// User API
export const userAPI = {
  getCurrentUser: () => 
    apiClient.get('/api/v1/users/me'),
  
  getUsers: (params) => 
    apiClient.get('/api/v1/users', { params }),
  
  getUserById: (id) => 
    apiClient.get(`/api/v1/users/${id}`),
  
  createUser: (userData) => 
    apiClient.post('/api/v1/users', userData),
  
  updateUser: (id, userData) => 
    apiClient.put(`/api/v1/users/${id}`, userData),
  
  deleteUser: (id) => 
    apiClient.delete(`/api/v1/users/${id}`),
  
  assignRole: (userId, roleId) => 
    apiClient.post('/api/v1/users/assign-role', { userId, roleId }),
  
  removeRole: (userId, roleId) => 
    apiClient.post('/api/v1/users/remove-role', { userId, roleId })
};

// Role API
export const roleAPI = {
  getRoles: (params) => 
    apiClient.get('/api/v1/roles', { params }),
  
  getRoleById: (id) => 
    apiClient.get(`/api/v1/roles/${id}`),
  
  createRole: (roleData) => 
    apiClient.post('/api/v1/roles', roleData),
  
  updateRole: (id, roleData) => 
    apiClient.put(`/api/v1/roles/${id}`, roleData),
  
  deleteRole: (id) => 
    apiClient.delete(`/api/v1/roles/${id}`)
};

// Permission API
export const permissionAPI = {
  getPermissions: (params) => 
    apiClient.get('/api/v1/permissions', { params })
};

// Audit Log API
export const auditAPI = {
  getAuditLogs: (params) => 
    apiClient.get('/api/v1/audit-logs', { params }),
  
  exportAuditLogs: (params) => 
    apiClient.get('/api/v1/audit-logs/export', { 
      params,
      responseType: 'blob'
    })
};

// Dashboard API
export const dashboardAPI = {
  getMetrics: () => 
    apiClient.get('/api/v1/dashboard/metrics')
};

// File: frontend/src/services/api.service.js (addition to existing file)

// Tenant API
export const tenantAPI = {
  getTenants: (params) => 
    apiClient.get('/api/v1/tenants', { params }),
  
  getTenantById: (id) => 
    apiClient.get(`/api/v1/tenants/${id}`),
  
  createTenant: (tenantData) => 
    apiClient.post('/api/v1/tenants', tenantData),
  
  updateTenant: (id, tenantData) => 
    apiClient.patch(`/api/v1/tenants/${id}`, tenantData),
  
  deleteTenant: (id) => 
    apiClient.delete(`/api/v1/tenants/${id}`),
  
  suspendTenant: (id) => 
    apiClient.post(`/api/v1/tenants/${id}/suspend`),
  
  restoreTenant: (id) => 
    apiClient.post(`/api/v1/tenants/${id}/restore`),
  
  getTenantMetrics: (id) => 
    apiClient.get(`/api/v1/tenants/${id}/metrics`)
};