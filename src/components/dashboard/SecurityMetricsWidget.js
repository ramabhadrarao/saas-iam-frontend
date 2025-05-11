// src/components/dashboard/SecurityMetricsWidget.js
import React from 'react';
import { useQuery } from 'react-query';
import { 
  IconShieldLock, 
  IconRefresh, 
  IconAlertTriangle,
  IconAlertCircle,
  IconCheck,
  IconX
} from '@tabler/icons-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { dashboardAPI } from '../../services/dashboard.service';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Security Metrics Widget for dashboard
 * Displays security-related metrics from the backend
 */
const SecurityMetricsWidget = ({ refreshInterval = 60000 }) => {
  const { hasPermission } = useAuth();
  const canViewDashboard = hasPermission('read_dashboard');
  
  // Fetch security metrics
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useQuery(
    ['security-metrics'],
    async () => {
      const res = await dashboardAPI.getSecurityMetrics();
      return res.data;
    },
    {
      enabled: canViewDashboard,
      refetchInterval: refreshInterval,
      staleTime: refreshInterval / 2
    }
  );

  if (!canViewDashboard) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <IconShieldLock className="icon me-2" />
            Security Metrics
          </h3>
        </div>
        <div className="card-body d-flex flex-column align-items-center justify-content-center">
          <IconAlertTriangle className="text-muted mb-2" size={24} />
          <p className="text-muted text-center">
            You don't have permission to view security metrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <IconShieldLock className="icon me-2" />
          Security Metrics
        </h3>
        <div className="card-actions">
          <button 
            className="btn btn-sm btn-outline-primary" 
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <IconRefresh className={isFetching ? 'icon icon-tabler-refresh icon-spin' : 'icon'} />
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {isLoading ? (
          <div className="d-flex justify-content-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">
            <IconAlertTriangle className="icon me-2" />
            Failed to load security metrics
            <div className="mt-2">
              <button 
                className="btn btn-sm btn-outline-danger" 
                onClick={() => refetch()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : data ? (
          <>
            <h4 className="mb-3">Login Success vs. Failure</h4>
            <div style={{ height: 300 }}>
              {data.loginMetrics && data.loginMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.loginMetrics}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" name="Successful Logins" fill="#4ADE80" />
                    <Bar dataKey="failure" name="Failed Logins" fill="#F87171" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <p className="text-muted">No login metrics available</p>
                </div>
              )}
            </div>
            
            <div className="row mt-4">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-stamp">
                    <div className="card-stamp-icon bg-yellow">
                      <IconAlertCircle />
                    </div>
                  </div>
                  <div className="card-body">
                    <h4 className="card-title">Recent Failed Logins</h4>
                    {data.recentFailedLogins && data.recentFailedLogins.length > 0 ? (
                      <div className="list-group list-group-flush mt-3">
                        {data.recentFailedLogins.slice(0, 5).map((login, index) => (
                          <div key={index} className="list-group-item px-0">
                            <div className="row align-items-center">
                              <div className="col-auto">
                                <span className="avatar bg-red-lt">
                                  {login.userId && login.userId.email 
                                    ? login.userId.email.charAt(0).toUpperCase() 
                                    : 'U'}
                                </span>
                              </div>
                              <div className="col">
                                <div className="text-truncate">
                                  {login.userId && login.userId.email
                                    ? login.userId.email
                                    : 'Unknown User'}
                                </div>
                                <div className="text-muted text-truncate small">
                                  {login.ipAddress || 'Unknown IP'} - {login.description || 'Login failed'}
                                </div>
                              </div>
                              <div className="col-auto">
                                <span className="text-muted">
                                  {new Date(login.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-3">
                        No failed logins in the last 24 hours
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card">
                  <div className="card-stamp">
                    <div className="card-stamp-icon bg-green">
                      <IconCheck />
                    </div>
                  </div>
                  <div className="card-body">
                    <h4 className="card-title">Password Security</h4>
                    <div className="mt-3">
                      <div className="d-flex align-items-center mb-3">
                        <span className="legend me-2 bg-primary"></span>
                        <span>Password Resets (Last 7 Days)</span>
                        <span className="ms-auto">{data.passwordResets || 0}</span>
                      </div>
                      
                      <div className="d-flex align-items-center mb-3">
                        <span className="legend me-2 bg-azure"></span>
                        <span>Active Sessions</span>
                        <span className="ms-auto">{data.activeSessions || 0}</span>
                      </div>
                      
                      <div className="progress mb-2">
                        <div className="progress-bar bg-primary" style={{ width: '25%' }} role="progressbar">
                          Strong
                        </div>
                        <div className="progress-bar bg-green" style={{ width: '55%' }} role="progressbar">
                          Medium
                        </div>
                        <div className="progress-bar bg-danger" style={{ width: '20%' }} role="progressbar">
                          Weak
                        </div>
                      </div>
                      <div className="text-muted small">
                        Password strength distribution (estimated)
                      </div>
                      
                      <div className="alert alert-info mt-3">
                        <div className="d-flex">
                          <div>
                            <IconAlertCircle className="alert-icon" />
                          </div>
                          <div>
                            <h4 className="alert-title">Security Tip</h4>
                            <div className="text-muted">
                              Encourage users to enable strong passwords and consider implementing multi-factor authentication.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted py-3">
            No security metrics data available
          </div>
        )}
      </div>
      
      {data && data.timestamp && (
        <div className="card-footer text-muted">
          <div className="d-flex align-items-center">
            <IconCheck className="icon me-2" size={16} />
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityMetricsWidget;