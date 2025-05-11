// src/services/audit.service.js
import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance with default config
const auditApiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for token
auditApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for handling common errors
auditApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Create standardized error object
    const errorObj = {
      message: error.response?.data?.message || 'An unknown error occurred',
      status: error.response?.status || 500,
      details: error.response?.data || {},
      originalError: error
    };

    // Log error (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error('Audit API Error:', errorObj);
    }

    // Specific handling for different error codes
    switch (errorObj.status) {
      case 401:
        // Unauthorized - token issues
        console.warn('Authentication error in audit logs. You may need to login again.');
        break;
      case 403:
        // Forbidden - permission issues
        console.warn('You do not have permission to access audit logs.');
        break;
      case 404:
        // Not found
        console.warn('The requested audit log resource was not found.');
        break;
      case 429:
        // Rate limiting
        console.warn('Too many requests. Please try again later.');
        break;
      default:
        // Any other error
        if (errorObj.status >= 500) {
          console.error('Server error in audit logs API. Please contact support if this persists.');
        }
    }

    return Promise.reject(errorObj);
  }
);

/**
 * Enhanced Audit Log API with more detailed options 
 */
export const auditAPI = {
  /**
   * Get audit logs with pagination and filtering
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @param {string} params.search - Search term
   * @param {string} params.action - Filter by action
   * @param {string} params.module - Filter by module
   * @param {string} params.userId - Filter by user ID
   * @param {string} params.tenantId - Filter by tenant ID
   * @param {string} params.startDate - Filter by start date
   * @param {string} params.endDate - Filter by end date
   * @returns {Promise} - Promise resolving to audit logs data
   */
  getAuditLogs: (params = {}) => 
    auditApiClient.get('/audit-logs', { params }),
  
  /**
   * Export audit logs to CSV
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term
   * @param {string} params.action - Filter by action 
   * @param {string} params.module - Filter by module
   * @param {string} params.userId - Filter by user ID
   * @param {string} params.tenantId - Filter by tenant ID
   * @param {string} params.startDate - Filter by start date
   * @param {string} params.endDate - Filter by end date
   * @returns {Promise} - Promise resolving to CSV file blob
   */
  exportAuditLogs: (params = {}) => 
    auditApiClient.get('/audit-logs/export', { 
      params,
      responseType: 'blob'
    }),
  
  /**
   * Get audit log statistics
   * @param {Object} params - Query parameters
   * @param {string} params.startDate - Start date for statistics
   * @param {string} params.endDate - End date for statistics
   * @param {string} params.tenantId - Filter by tenant ID
   * @returns {Promise} - Promise resolving to audit log statistics
   */
  getAuditStats: (params = {}) =>
    auditApiClient.get('/audit-logs/stats', { params }),
  
  /**
   * Get recent audit logs (last 24 hours)
   * @param {number} limit - Number of logs to return
   * @returns {Promise} - Promise resolving to recent audit logs
   */
  getRecentAuditLogs: (limit = 5) =>
    auditApiClient.get('/audit-logs/recent', { 
      params: { limit } 
    }),
    
  /**
   * Get audit logs by user
   * @param {string} userId - User ID
   * @param {Object} params - Additional query parameters
   * @returns {Promise} - Promise resolving to user audit logs
   */
  getUserAuditLogs: (userId, params = {}) =>
    auditApiClient.get(`/audit-logs/user/${userId}`, { params })
};

export default auditAPI;