// src/components/dashboard/AuditLogWidget.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  IconHistory, 
  IconRefresh, 
  IconExclamationCircle 
} from '@tabler/icons-react';
import { auditAPI } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Dashboard widget to display recent audit logs
 * @param {Object} props - Component props
 * @param {number} props.limit - Number of logs to display
 * @param {string} props.height - Height of the widget
 * @param {boolean} props.showRefresh - Whether to show refresh button
 * @returns {JSX.Element} - Component JSX
 */
const AuditLogWidget = ({ 
  limit = 5, 
  height = '320px',
  showRefresh = true 
}) => {
  const { hasPermission } = useAuth();
  const canViewAuditLogs = hasPermission('read_audit');

  // Fetch recent audit logs
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useQuery(
    ['recent-audit-logs', limit],
    async () => {
      const res = await auditAPI.getRecentAuditLogs(limit);
      return res.data;
    },
    {
      enabled: canViewAuditLogs,
      refetchInterval: 60000,
      staleTime: 30000
    }
  );

  // Format date for display
  const formatDate = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric' 
    }) + ', ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Format user name
  const formatUserName = (log) => {
    if (log.userId && typeof log.userId === 'object' && log.userId.firstName) {
      return `${log.userId.firstName} ${log.userId.lastName}`;
    }
    if (log.user && typeof log.user === 'object' && log.user.firstName) {
      return `${log.user.firstName} ${log.user.lastName}`;
    }
    if (log.userName) {
      return log.userName;
    }
    return 'Unknown User';
  };

  // Get action badge class
  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN':
      case 'VIEW':
      case 'READ':
        return 'badge bg-blue-lt';
      case 'CREATE':
        return 'badge bg-green-lt';
      case 'UPDATE':
        return 'badge bg-yellow-lt';
      case 'DELETE':
        return 'badge bg-red-lt';
      case 'LOGOUT':
        return 'badge bg-gray-lt';
      case 'ASSIGN':
      case 'REMOVE':
        return 'badge bg-purple-lt';
      default:
        return 'badge bg-secondary-lt';
    }
  };

  // Get user avatar initials
  const getUserInitials = (log) => {
    const name = formatUserName(log);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  if (!canViewAuditLogs) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <IconHistory className="icon me-2" />
            Recent Activity
          </h3>
        </div>
        <div className="card-body d-flex flex-column align-items-center justify-content-center" style={{ height }}>
          <IconExclamationCircle className="text-muted mb-2" size={24} />
          <p className="text-muted text-center">
            You don't have permission to view audit logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <IconHistory className="icon me-2" />
          Recent Activity
        </h3>
        {canViewAuditLogs && (
          <div className="card-actions">
            {showRefresh && (
              <button 
                className="btn btn-sm btn-outline-primary me-2" 
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh"
              >
                <IconRefresh className={isFetching ? 'icon icon-tabler-refresh icon-spin' : 'icon'} />
              </button>
            )}
            <Link to="/audit-logs" className="btn btn-sm btn-primary">
              View All
            </Link>
          </div>
        )}
      </div>
      <div className="list-group list-group-flush overflow-auto" style={{ maxHeight: height || '320px' }}>
        {isLoading ? (
          <div className="list-group-item d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="list-group-item text-center py-5">
            <IconExclamationCircle className="text-danger mb-2" size={24} />
            <p className="text-danger">Failed to load audit logs</p>
            <button 
              className="btn btn-sm btn-outline-danger" 
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="list-group-item text-center py-5">
            <p className="text-muted">No recent activity</p>
          </div>
        ) : (
          data.map((log) => (
            <div key={log._id || log.id} className="list-group-item">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="avatar bg-blue-lt">
                    {getUserInitials(log)}
                  </span>
                </div>
                <div className="col text-truncate">
                  <span className="text-body d-block">{formatUserName(log)}</span>
                  <div className="d-block text-muted text-truncate">
                    <span className={getActionBadge(log.action)} style={{ marginRight: '5px' }}>
                      {log.action}
                    </span>
                    <span className="badge bg-secondary-lt me-1">{log.module}</span>
                    {log.description}
                  </div>
                </div>
                <div className="col-auto">
                  <div className="text-muted">
                    {formatDate(log.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="card-footer text-center">
        <Link to="/audit-logs" className="btn btn-link btn-sm">
          View all audit logs
        </Link>
      </div>
    </div>
  );
};

export default AuditLogWidget;
