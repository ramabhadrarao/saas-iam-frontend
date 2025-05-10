// File: frontend/src/pages/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';  // Added useEffect import
import { useQuery } from 'react-query';
import axios from 'axios';
import io from 'socket.io-client';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { API_URL } from '../../config';

const Dashboard = () => {
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [socket, setSocket] = useState(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Initialize socket connection
  useEffect(() => {
    // Create socket connection
    const newSocket = io(API_URL);
    
    // Setup socket listeners
    newSocket.on('dashboard-update', (data) => {
      console.log('Received real-time dashboard update:', data);
      setRealTimeMetrics(data);
    });
    
    // Listen for audit log events
    newSocket.on('new-audit-log', (log) => {
      console.log('New audit log:', log);
      // Update local state to show the new log
      setAuditLogs(prevLogs => [log, ...prevLogs.slice(0, 4)]);
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);
  
  // Mock data for fallback when API fails
  const mockData = {
    totalUsers: 123,
    userGrowth: 7,
    activeSessions: 42,
    sessionIncrease: 5,
    customRoles: 15,
    failedLogins: 7,
    failedLoginIncrease: -3,
    activityTrend: Array(7).fill(0).map((_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
      count: Math.floor(Math.random() * 50) + 10
    })),
    userDistribution: [
      { name: 'Master Admin', value: 5 },
      { name: 'Tenant Admin', value: 15 },
      { name: 'Tenant User', value: 80 }
    ],
    roleUsage: [
      { name: 'Super Admin', count: 2 },
      { name: 'Admin', count: 8 },
      { name: 'Editor', count: 25 },
      { name: 'Viewer', count: 40 },
      { name: 'Custom', count: 15 }
    ],
    recentAuditLogs: Array(5).fill(0).map((_, i) => ({
      id: i,
      userName: `User ${i+1}`,
      action: ['LOGIN', 'UPDATE', 'CREATE', 'DELETE', 'VIEW'][i],
      module: ['AUTH', 'USER', 'ROLE', 'PERMISSION', 'TENANT'][i],
      createdAt: new Date(Date.now() - i * 3600000).toISOString()
    }))
  };

  // Fetch dashboard metrics with improved error handling
  const { data, isLoading, error } = useQuery(
    'dashboard-metrics',
    async () => {
      try {
        console.log("Fetching dashboard metrics from:", `${API_URL}/api/v1/dashboard/metrics`);
        const res = await axios.get(`${API_URL}/api/v1/dashboard/metrics`);
        console.log("Dashboard API response:", res.data);
        return res.data;
      } catch (err) {
        console.error("Dashboard API error:", err);
        // Re-throw the error for React Query to handle
        throw err;
      }
    },
    {
      retry: 1,  // Retry once if the request fails
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      onError: (err) => {
        console.error("Dashboard API error details:", {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data
        });
      }
    }
  );

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Create activity trend data
  const activityData = data?.activityTrend || mockData.activityTrend;

  // Create user distribution data
  const userDistributionData = data?.userDistribution || mockData.userDistribution;

  // Create role usage data
  const roleUsageData = data?.roleUsage || mockData.roleUsage;

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Determine if we should use mock data in production mode
  const useMockData = !data && !isLoading;

  // Use actual data, real-time data, or mockData if needed
  const displayData = realTimeMetrics || data || mockData;

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-3">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body text-center py-5">
          <div className="text-danger mb-3">Failed to load dashboard data</div>
          
          {useMockData ? (
            <div className="alert alert-warning">
              <strong>Using demo data.</strong> This is sample data for preview purposes.
            </div>
          ) : (
            <>
              <button 
                className="btn btn-outline-danger btn-sm" 
                onClick={() => setShowErrorDetails(!showErrorDetails)}
              >
                {showErrorDetails ? 'Hide Error Details' : 'Show Error Details'}
              </button>
              
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
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {useMockData && (
        <div className="alert alert-warning mb-4">
          <strong>Note:</strong> Using demo data. Connect to a backend API for real data.
        </div>
      )}
      
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="page-title">Dashboard</h2>
              <div className="text-muted mt-1">IAM Analytics Overview</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats row */}
      <div className="row row-deck row-cards mb-4">
        <div className="col-sm-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">Total Users</div>
              </div>
              <div className="h1 mb-3">{formatNumber(displayData?.totalUsers || 0)}</div>
              <div className="d-flex mb-2">
                <div>Active users in the system</div>
                <div className="ms-auto">
                  <span className="text-green d-inline-flex align-items-center lh-1">
                    {displayData?.userGrowth || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-sm-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">Active Sessions</div>
              </div>
              <div className="h1 mb-3">{formatNumber(displayData?.activeSessions || 0)}</div>
              <div className="d-flex mb-2">
                <div>Current online users</div>
                <div className="ms-auto">
                  <span className="text-green d-inline-flex align-items-center lh-1">
                    {displayData?.sessionIncrease || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-sm-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">Custom Roles</div>
              </div>
              <div className="h1 mb-3">{formatNumber(displayData?.customRoles || 0)}</div>
              <div className="d-flex mb-2">
                <div>User-defined roles</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-sm-6 col-lg-3">
          <div className="card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="subheader">Failed Logins</div>
              </div>
              <div className="h1 mb-3">{formatNumber(displayData?.failedLogins || 0)}</div>
              <div className="d-flex mb-2">
                <div>Last 24 hours</div>
                <div className="ms-auto">
                  <span className="text-red d-inline-flex align-items-center lh-1">
                    {displayData?.failedLoginIncrease || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts row */}
      <div className="row row-deck row-cards">
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">User Activity Trend</h3>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={activityData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Active Users" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">User Distribution</h3>
            </div>
            <div className="card-body">
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {userDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
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
              <h3 className="card-title">Recent Audit Logs</h3>
              <div className="card-actions">
                <a href="/audit-logs" className="btn btn-primary btn-sm">
                  View All
                </a>
              </div>
            </div>
            <div className="card-table table-responsive">
              <table className="table table-vcenter">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Use real-time audit logs if available, otherwise use from API or mock data */}
                  {(auditLogs.length > 0 ? auditLogs : displayData?.recentAuditLogs || []).map((log) => (
                    <tr key={log.id}>
                      <td>{typeof log.userName === 'string' ? log.userName : 'Unknown User'}</td>
                      <td>{log.action}</td>
                      <td>{log.module}</td>
                      <td className="text-muted">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Role Usage Distribution</h3>
            </div>
            <div className="card-body">
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={roleUsageData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Users" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;