// src/pages/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  IconUsers, 
  IconActivity,
  IconBuildingSkyscraper,
  IconShieldLock,
  IconAlertTriangle,
  IconArrowUpRight,
  IconArrowDownRight,
  IconInfoCircle
} from '@tabler/icons-react';
import { API_URL } from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../services/api.service';

// Custom metric card component
const MetricCard = ({ title, value, icon, change, changeType, suffix = '', tooltip }) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <div className="subheader">{title}</div>
          {tooltip && (
            <div className="ms-auto" title={tooltip}>
              <IconInfoCircle size={16} />
            </div>
          )}
        </div>
        <div className="d-flex align-items-baseline">
          <div className="h1 mb-0 me-2">{value}{suffix}</div>
          {change !== undefined && (
            <div className={`me-2 ${changeType === 'increase' ? 'text-green' : 'text-red'}`}>
              <span className="text-nowrap d-inline-flex align-items-center">
                {changeType === 'increase' ? (
                  <IconArrowUpRight size={16} className="me-1" />
                ) : (
                  <IconArrowDownRight size={16} className="me-1" />
                )}
                {change}%
              </span>
            </div>
          )}
          <div className="ms-auto">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, isMasterAdmin, hasPermission } = useAuth();
  const [socket, setSocket] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [recentAuditLogs, setRecentAuditLogs] = useState([]);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  
  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(API_URL);
    
    // Setup socket listeners
    newSocket.on('dashboard-update', (data) => {
      console.log('Received real-time dashboard update:', data);
      setRealTimeMetrics(data);
    });
    
    // Listen for audit log events
    newSocket.on('new-audit-log', (log) => {
      setRecentAuditLogs(prevLogs => [log, ...prevLogs.slice(0, 4)]);
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // Fetch dashboard metrics
  const { 
    data: dashboardData, 
    isLoading, 
    error 
  } = useQuery(
    'dashboard-metrics',
    () => dashboardAPI.getMetrics(),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      onSuccess: (data) => {
        // If no real-time data yet, use this as initial data
        if (!realTimeMetrics) {
          setRealTimeMetrics(data.data);
        }
        
        // Initialize audit logs if empty
        if (recentAuditLogs.length === 0 && data.data.recentAuditLogs) {
          setRecentAuditLogs(data.data.recentAuditLogs);
        }
      }
    }
  );

  // Colors for charts
  const COLORS = ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0'];

  // Use real-time data or fallback to API data
  const metricsData = realTimeMetrics || (dashboardData?.data) || {};

  // Format numbers for display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (isLoading) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="mt-3">Loading dashboard data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="text-danger mb-3">
                <IconAlertTriangle size={40} />
              </div>
              <h3 className="text-danger">Failed to load dashboard data</h3>
              
              <div className="mt-3">
                <button 
                  className="btn btn-outline-danger btn-sm" 
                  onClick={() => setShowErrorDetails(!showErrorDetails)}
                >
                  {showErrorDetails ? 'Hide Error Details' : 'Show Error Details'}
                </button>
              </div>
              
              {showErrorDetails && (
                <div className="mt-3 text-start">
                  <div className="alert alert-danger">
                    <h4 className="alert-heading">Error Details</h4>
                    <p><strong>Message:</strong> {error.message}</p>
                    <p><strong>Status:</strong> {error.response?.status} {error.response?.statusText}</p>
                    <hr />
                    <p className="mb-0"><strong>API URL:</strong> {API_URL}/api/v1/dashboard/metrics</p>
                    {error.response?.data && (
                      <pre className="mt-2">
                        {JSON.stringify(error.response.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      <div className="container-xl">
        {/* Page header */}
        <div className="page-header d-print-none">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="page-title">Dashboard</h2>
              <div className="text-muted mt-1">
                {isMasterAdmin 
                  ? 'Master Administration Dashboard'
                  : `${user?.tenant?.name} Tenant Dashboard`}
              </div>
            </div>
          </div>
        </div>
        
        {/* Key metrics row */}
        <div className="row row-deck row-cards mb-4">
          <div className="col-sm-6 col-lg-3">
            <MetricCard
              title="Total Users"
              value={formatNumber(metricsData.totalUsers)}
              icon={<IconUsers size={24} stroke={1.5} className="text-primary" />}
              change={metricsData.userGrowth}
              changeType="increase"
              tooltip="Total number of active users in the system"
            />
          </div>
          
          <div className="col-sm-6 col-lg-3">
            <MetricCard
              title="Active Sessions"
              value={formatNumber(metricsData.activeSessions)}
              icon={<IconActivity size={24} stroke={1.5} className="text-green" />}
              change={metricsData.sessionIncrease}
              changeType={metricsData.sessionIncrease >= 0 ? "increase" : "decrease"}
              tooltip="Number of active user sessions in the last 24 hours"
            />
          </div>
          
          <div className="col-sm-6 col-lg-3">
            <MetricCard
              title={isMasterAdmin ? "Custom Roles" : "Assigned Roles"}
              value={formatNumber(metricsData.customRoles)}
              icon={<IconShieldLock size={24} stroke={1.5} className="text-purple" />}
              tooltip="Number of user-defined roles in the system"
            />
          </div>
          
          <div className="col-sm-6 col-lg-3">
            <MetricCard
              title="Failed Logins"
              value={formatNumber(metricsData.failedLogins)}
              icon={<IconAlertTriangle size={24} stroke={1.5} className="text-orange" />}
              change={Math.abs(metricsData.failedLoginIncrease)}
              changeType={metricsData.failedLoginIncrease <= 0 ? "increase" : "decrease"}
              tooltip="Number of failed login attempts in the last 24 hours"
            />
          </div>
        </div>
        
        {/* Charts row */}
        <div className="row row-deck row-cards">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">User Activity Trend</h3>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={metricsData.activityTrend || []}
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Active Users"
                        stroke="#4361ee"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">User Distribution</h3>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metricsData.userDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {(metricsData.userDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} users`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Audit logs and role usage */}
        <div className="row row-deck row-cards mt-4">
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Activity</h3>
                {hasPermission('read_audit') && (
                  <div className="card-actions">
                    <Link to="/audit-logs" className="btn btn-primary btn-sm">
                      View All
                    </Link>
                  </div>
                )}
              </div>
              <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: '320px' }}>
                {recentAuditLogs.length > 0 ? (
                  recentAuditLogs.map((log, index) => (
                    <div key={log.id || index} className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <span className={`avatar bg-${
                            log.action === 'LOGIN' ? 'blue' : 
                            log.action === 'CREATE' ? 'green' : 
                            log.action === 'UPDATE' ? 'orange' : 
                            log.action === 'DELETE' ? 'red' : 'gray'
                          }`}>
                            {log.userName ? log.userName.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                        <div className="col text-truncate">
                          <span className="text-body d-block">{log.userName || 'Unknown User'}</span>
                          <div className="d-block text-muted text-truncate">
                            <span className={`badge bg-${
                              log.action === 'LOGIN' ? 'blue' : 
                              log.action === 'CREATE' ? 'green' : 
                              log.action === 'UPDATE' ? 'orange' : 
                              log.action === 'DELETE' ? 'red' : 'gray'
                            }-lt me-1`}>
                              {log.action}
                            </span>
                            <span className="badge bg-secondary-lt me-1">{log.module}</span>
                            {log.description}
                          </div>
                        </div>
                        <div className="col-auto">
                          <div className="text-muted">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="list-group-item text-center py-4">
                    <div className="text-muted">No recent activity</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-6">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Role Usage Distribution</h3>
              </div>
              <div className="card-body">
                <div style={{ height: '280px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={metricsData.roleUsage || []}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip formatter={(value) => `${value} users`} />
                      <Legend />
                      <Bar dataKey="count" name="Users" fill="#7209b7" barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {hasPermission('read_role') && (
                <div className="card-footer text-center">
                  <Link to="/roles" className="btn btn-link">Manage Roles</Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Tenant section - Only show for master admin */}
        {isMasterAdmin && hasPermission('read_tenant') && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">
                    <IconBuildingSkyscraper className="icon me-2" />
                    Tenant Management
                  </h3>
                  <div className="card-actions">
                    <Link to="/tenants" className="btn btn-primary btn-sm">
                      View All Tenants
                    </Link>
                  </div>
                </div>
                <div className="card-table table-responsive">
                  <table className="table table-vcenter card-table">
                    <thead>
                      <tr>
                        <th>Tenant</th>
                        <th>Plan</th>
                        <th>Status</th>
                        <th>Users</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(metricsData.tenantsByStatus || []).slice(0, 5).map((tenant, index) => (
                        <tr key={tenant.id || index}>
                          <td>
                            <Link to={`/tenants/${tenant.id}`} className="text-reset">
                              <div className="d-flex align-items-center">
                                <span className="avatar me-2 bg-blue-lt">
                                  {tenant.name ? tenant.name.charAt(0).toUpperCase() : 'T'}
                                </span>
                                <div>
                                  <span className="text-body d-block">{tenant.name}</span>
                                  <div className="text-muted">{tenant.subdomain}.example.com</div>
                                </div>
                              </div>
                            </Link>
                          </td>
                          <td>
                            <span className={`badge bg-${
                              tenant.plan === 'free' ? 'secondary' : 
                              tenant.plan === 'starter' ? 'info' : 
                              tenant.plan === 'professional' ? 'primary' : 
                              'purple'
                            }`}>
                              {tenant.plan?.charAt(0).toUpperCase() + tenant.plan?.slice(1) || 'Free'}
                            </span>
                          </td>
                          <td>
                            {tenant.isActive ? (
                              <span className="badge bg-success">Active</span>
                            ) : (
                              <span className="badge bg-danger">Suspended</span>
                            )}
                          </td>
                          <td>{tenant.userCount || 0}</td>
                          <td>
                           <Link to={`/tenants/${tenant.id}`} className="btn btn-sm btn-primary">
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;