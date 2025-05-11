// src/components/dashboard/TenantComparisonWidget.js
import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  IconBuildingSkyscraper, 
  IconRefresh, 
  IconAlertTriangle,
  IconUsers,
  IconCheck
} from '@tabler/icons-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { dashboardAPI } from '../../services/dashboard.service';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Tenant Comparison Widget for dashboard
 * Displays tenant-related metrics and comparisons
 */
const TenantComparisonWidget = ({ refreshInterval = 60000 }) => {
  const { hasPermission, isMasterAdmin } = useAuth();
  const canViewDashboard = hasPermission('read_dashboard');
  
  // Only master admins should see tenant comparison data
  const enabled = canViewDashboard && isMasterAdmin;
  
  // Fetch tenant comparison data
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useQuery(
    ['tenant-comparison'],
    async () => {
      const res = await dashboardAPI.getTenantComparison();
      return res.data;
    },
    {
      enabled,
      refetchInterval: enabled ? refreshInterval : false,
      staleTime: refreshInterval / 2
    }
  );

  // Colors for pie charts
  const COLORS = ['#4ADE80', '#F87171', '#60A5FA', '#8B5CF6', '#EC4899'];

  // Format plan name for display
  const formatPlanName = (plan) => {
    if (!plan) return 'Unknown';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  if (!enabled) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <IconBuildingSkyscraper className="icon me-2" />
            Tenant Comparison
          </h3>
        </div>
        <div className="card-body d-flex flex-column align-items-center justify-content-center">
          <IconAlertTriangle className="text-muted mb-2" size={24} />
          <p className="text-muted text-center">
            Tenant comparison data is only available to master administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <IconBuildingSkyscraper className="icon me-2" />
          Tenant Comparison
        </h3>
        <div className="card-actions">
          <button 
            className="btn btn-sm btn-outline-primary me-2" 
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh"
          >
            <IconRefresh className={isFetching ? 'icon icon-tabler-refresh icon-spin' : 'icon'} />
          </button>
          <Link to="/tenants" className="btn btn-sm btn-primary">
            View All
          </Link>
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
            Failed to load tenant comparison metrics
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
            <div className="row">
              <div className="col-md-6">
                <h4 className="mb-3">Tenants by Plan</h4>
                <div style={{ height: 200 }}>
                  {data.tenantsByPlan && data.tenantsByPlan.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.tenantsByPlan.map(item => ({
                            name: formatPlanName(item._id),
                            value: item.count
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {data.tenantsByPlan.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} tenants`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <p className="text-muted">No plan distribution data available</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="col-md-6">
                <h4 className="mb-3">Tenants by Status</h4>
                <div style={{ height: 200 }}>
                  {data.tenantsByStatus && data.tenantsByStatus.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.tenantsByStatus.map(item => ({
                            name: item._id ? 'Active' : 'Inactive',
                            value: item.count
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {data.tenantsByStatus.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry._id ? '#22C55E' : '#EF4444'} 
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} tenants`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <p className="text-muted">No status distribution data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="row mt-4">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">User Distribution</h4>
                    <div className="d-flex align-items-baseline mt-3">
                      <div>
                        <div className="d-flex align-items-center mb-2">
                          <span className="legend me-2 bg-primary"></span>
                          <span>Average Users per Tenant</span>
                          <span className="ms-auto font-weight-bold">
                            {Math.round(data.userAverages?.avgUsers || 0)}
                          </span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <span className="legend me-2 bg-green"></span>
                          <span>Maximum Users</span>
                          <span className="ms-auto font-weight-bold">
                            {data.userAverages?.maxUsers || 0}
                          </span>
                        </div>
                        <div className="d-flex align-items-center mb-2">
                          <span className="legend me-2 bg-azure"></span>
                          <span>Minimum Users</span>
                          <span className="ms-auto font-weight-bold">
                            {data.userAverages?.minUsers || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card">
                  <div className="card-body">
                    <h4 className="card-title">
                      <IconUsers className="icon me-2" />
                      Top Tenants by Users
                    </h4>
                    {data.topTenantsByUsers && data.topTenantsByUsers.length > 0 ? (
                      <div className="mt-3">
                        <div style={{ height: 150 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={data.topTenantsByUsers.map(tenant => ({
                                name: tenant.tenantName,
                                users: tenant.userCount
                              }))}
                              layout="vertical"
                              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis type="number" />
                              <YAxis dataKey="name" type="category" width={100} />
                              <Tooltip />
                              <Bar dataKey="users" fill="#3B82F6" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-3">
                        No tenant user data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-muted py-3">
            No tenant comparison data available
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

export default TenantComparisonWidget;