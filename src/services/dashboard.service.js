// src/services/dashboard.service.js
import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance with default config
const dashboardApiClient = axios.create({
  baseURL: `${API_URL}/api/v1/dashboard`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for token
dashboardApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Dashboard API service that aligns with the backend endpoints
 */
export const dashboardAPI = {
  /**
   * Get main dashboard metrics
   * @returns {Promise} Promise resolving to dashboard metrics
   */
  getMetrics: () => 
    dashboardApiClient.get('/metrics'),
  
  /**
   * Get system health metrics
   * @returns {Promise} Promise resolving to system health metrics
   */
  getSystemHealth: () => 
    dashboardApiClient.get('/system-health'),
  
  /**
   * Get tenant comparison metrics
   * @returns {Promise} Promise resolving to tenant comparison metrics
   */
  getTenantComparison: () => 
    dashboardApiClient.get('/tenant-comparison'),
  
  /**
   * Get security metrics
   * @returns {Promise} Promise resolving to security metrics
   */
  getSecurityMetrics: () => 
    dashboardApiClient.get('/security-metrics'),
  
  /**
   * Get dashboard metrics with all data combined (convenience method)
   * @returns {Promise} Promise resolving to all dashboard data
   */
  getAllDashboardData: async () => {
    try {
      const [metrics, systemHealth, tenantComparison, securityMetrics] = await Promise.all([
        dashboardApiClient.get('/metrics'),
        dashboardApiClient.get('/system-health'),
        dashboardApiClient.get('/tenant-comparison'),
        dashboardApiClient.get('/security-metrics')
      ]);
      
      return {
        metrics: metrics.data,
        systemHealth: systemHealth.data,
        tenantComparison: tenantComparison.data,
        securityMetrics: securityMetrics.data
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};

export default dashboardAPI;