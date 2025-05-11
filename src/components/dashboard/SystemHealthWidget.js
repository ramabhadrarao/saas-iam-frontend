// src/components/dashboard/SystemHealthWidget.js
import React from 'react';
import { useQuery } from 'react-query';
import { 
  IconServer, 
  IconRefresh, 
  IconAlertTriangle,
  IconDatabase,
  IconCpu,
  IconDeviceDesktop,
  IconCheckbox
} from '@tabler/icons-react';
import { dashboardAPI } from '../../services/dashboard.service';
import { useAuth } from '../../contexts/AuthContext';

/**
 * System Health Widget for dashboard
 * Displays system health metrics from the backend
 */
const SystemHealthWidget = ({ refreshInterval = 60000 }) => {
  const { hasPermission } = useAuth();
  const canViewDashboard = hasPermission('read_dashboard');
  
  // Fetch system health metrics
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useQuery(
    ['system-health'],
    async () => {
      const res = await dashboardAPI.getSystemHealth();
      return res.data;
    },
    {
      enabled: canViewDashboard,
      refetchInterval: refreshInterval,
      staleTime: refreshInterval / 2
    }
  );

  // Format bytes for display
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get status indicator color based on value
  const getStatusColor = (value, thresholds) => {
    if (value >= thresholds.danger) return 'red';
    if (value >= thresholds.warning) return 'yellow';
    return 'green';
  };

  if (!canViewDashboard) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <IconServer className="icon me-2" />
            System Health
          </h3>
        </div>
        <div className="card-body d-flex flex-column align-items-center justify-content-center">
          <IconAlertTriangle className="text-muted mb-2" size={24} />
          <p className="text-muted text-center">
            You don't have permission to view system health metrics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <IconServer className="icon me-2" />
          System Health
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
            Failed to load system health metrics
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
            <h4 className="mb-3">
              <IconDatabase className="icon me-2" />
              Database Metrics
            </h4>
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card card-sm">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className={`status-dot status-dot-animated bg-${
                          data.dbMetrics?.connections > 50 ? 'yellow' : 'green'
                        } d-block`}></span>
                      </div>
                      <div className="col">
                        <div className="font-weight-medium">
                          MongoDB {data.dbMetrics?.version || 'N/A'}
                        </div>
                        <div className="text-muted">
                          {data.dbMetrics?.connections || 0} active connections
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card card-sm">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="status-dot status-green d-block"></span>
                      </div>
                      <div className="col">
                        <div className="font-weight-medium">
                          Database Memory
                        </div>
                        <div className="text-muted">
                          {data.dbMetrics?.memoryUsage || 0} MB used
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <h4 className="mb-3">
              <IconCpu className="icon me-2" />
              Server Metrics
            </h4>
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="card card-sm">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="status-dot status-green d-block"></span>
                      </div>
                      <div className="col">
                        <div className="font-weight-medium">
                          {data.serverMetrics?.platform || 'Unknown'} / {data.serverMetrics?.nodeVersion || 'N/A'}
                        </div>
                        <div className="text-muted">
                          Uptime: {data.serverMetrics?.uptime || 0} hours
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card card-sm">
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className={`status-dot status-${
                          data.serverMetrics?.memoryUsage?.heapUsed > 500000000 ? 'yellow' : 'green'
                        } d-block`}></span>
                      </div>
                      <div className="col">
                        <div className="font-weight-medium">
                          Memory Usage
                        </div>
                        <div className="text-muted">
                          {data.serverMetrics?.memoryUsage?.heapUsed 
                            ? formatBytes(data.serverMetrics.memoryUsage.heapUsed) 
                            : 'N/A'} / 
                          {data.serverMetrics?.memoryUsage?.heapTotal 
                            ? formatBytes(data.serverMetrics.memoryUsage.heapTotal) 
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <h4 className="mb-3">
              <IconDeviceDesktop className="icon me-2" />
              API Activity
            </h4>
            {data.apiMetrics && data.apiMetrics.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>API Calls (24h)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.apiMetrics.map((metric, index) => (
                      <tr key={index}>
                        <td>{metric._id}</td>
                        <td>{metric.count}</td>
                        <td>
                          <span className={`status-dot status-${
                            metric.count > 1000 ? 'yellow' : 'green'
                          } d-inline-block me-2`}></span>
                          {metric.count > 1000 ? 'High Traffic' : 'Normal'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-muted py-3">
                No API activity data available
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-muted py-3">
            No system health data available
          </div>
        )}
      </div>
      
      {data && data.timestamp && (
        <div className="card-footer text-muted">
          <div className="d-flex align-items-center">
            <IconCheckbox className="icon me-2" size={16} />
            Last updated: {new Date(data.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthWidget;