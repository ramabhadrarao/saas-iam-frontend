// File: frontend/src/config.js
// API base URL configuration
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// App configuration
export const APP_CONFIG = {
  appName: 'SaaS Platform',
  appVersion: '1.0.0',
  defaultPageSize: 10,
  maxPageSize: 100,
  toastDuration: 3000,
  sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours in milliseconds
  refreshTokenInterval: 30 * 60 * 1000, // 30 minutes in milliseconds
  dateFormat: 'MMM DD, YYYY',
  timeFormat: 'hh:mm A',
  dateTimeFormat: 'MMM DD, YYYY hh:mm A'
};

// User roles and permissions
export const USER_TYPES = {
  MASTER_ADMIN: 'master_admin',
  TENANT_ADMIN: 'tenant_admin',
  TENANT_USER: 'tenant_user'
};

// Module names for consistency
export const MODULES = {
  AUTH: 'AUTH',
  USER: 'USER',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  TENANT: 'TENANT',
  BILLING: 'BILLING',
  SUPPORT: 'SUPPORT',
  DASHBOARD: 'DASHBOARD'
};

// Action types for audit logs
export const ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  ASSIGN: 'ASSIGN',
  REMOVE: 'REMOVE',
  EXPORT: 'EXPORT',
  IMPORT: 'IMPORT'
};