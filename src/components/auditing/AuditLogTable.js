// src/components/auditing/AuditLogTable.js
import React from 'react';
import PropTypes from 'prop-types';
import { 
  IconAlertTriangle,
  IconRefresh
} from '@tabler/icons-react';

/**
 * Reusable audit log table component that can be used across the application
 */
const AuditLogTable = ({ 
  logs, 
  isLoading, 
  error, 
  onRetry,
  formatUserName,
  formatTenantName,
  hideColumns = [] 
}) => {
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Get action badge class
  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN':
      case 'VIEW':
      case 'READ':
        return 'badge bg-blue';
      case 'CREATE':
        return 'badge bg-green';
      case 'UPDATE':
        return 'badge bg-yellow';
      case 'DELETE':
        return 'badge bg-red';
      case 'LOGOUT':
        return 'badge bg-gray';
      case 'ASSIGN':
      case 'REMOVE':
        return 'badge bg-purple';
      case 'EXPORT':
      case 'IMPORT':
        return 'badge bg-cyan';
      default:
        return 'badge bg-secondary';
    }
  };

  // Default formatters if not provided
  const defaultFormatUserName = (log) => {
    // If log has userId as an object with firstName and lastName
    if (log.userId && typeof log.userId === 'object' && log.userId.firstName) {
      return `${log.userId.firstName} ${log.userId.lastName}`;
    }
    
    // If log has user object with firstName and lastName
    if (log.user && typeof log.user === 'object' && log.user.firstName) {
      return `${log.user.firstName} ${log.user.lastName}`;
    }
    
    // If log has userName as a string
    if (log.userName) {
      return log.userName;
    }
    
    // Default fallback
    return 'Unknown User';
  };

  const defaultFormatTenantName = (log) => {
    // If log has tenantId as an object with name
    if (log.tenantId && typeof log.tenantId === 'object' && log.tenantId.name) {
      return log.tenantId.name;
    }
    
    // If log has tenant object with name
    if (log.tenant && typeof log.tenant === 'object' && log.tenant.name) {
      return log.tenant.name;
    }
    
    // If no tenant info at all
    return 'N/A';
  };

  // Use provided formatters or defaults
  const formatUser = formatUserName || defaultFormatUserName;
  const formatTenant = formatTenantName || defaultFormatTenantName;

  // Determine which columns to show
  const showUser = !hideColumns.includes('user');
  const showAction = !hideColumns.includes('action');
  const showModule = !hideColumns.includes('module');
  const showDescription = !hideColumns.includes('description');
  const showIpAddress = !hideColumns.includes('ipAddress');
  const showTenant = !hideColumns.includes('tenant');
  const showDateTime = !hideColumns.includes('dateTime');

  return (
    <div className="table-responsive">
      <table className="table card-table table-vcenter text-nowrap">
        <thead>
          <tr>
            {showUser && <th>User</th>}
            {showAction && <th>Action</th>}
            {showModule && <th>Module</th>}
            {showDescription && <th>Description</th>}
            {showIpAddress && <th>IP Address</th>}
            {showTenant && <th>Tenant</th>}
            {showDateTime && <th>Date/Time</th>}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={7} className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={7} className="text-center text-danger py-4">
                <IconAlertTriangle size={24} className="mb-2" />
                <div>Failed to load audit logs</div>
                {onRetry && (
                  <div className="mt-2">
                    <button 
                      className="btn btn-sm btn-outline-danger" 
                      onClick={onRetry}
                    >
                      <IconRefresh className="icon me-1" />
                      Retry
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ) : logs?.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center py-4">
                <div className="text-muted">No audit logs found</div>
              </td>
            </tr>
          ) : (
            logs?.map((log) => (
              <tr key={log._id || log.id}>
                {showUser && (
                  <td>
                    <div className="d-flex align-items-center">
                      <span className="avatar avatar-sm me-2 bg-blue-lt">
                        {formatUser(log).charAt(0).toUpperCase()}
                      </span>
                      {formatUser(log)}
                    </div>
                  </td>
                )}
                {showAction && (
                  <td>
                    <span className={getActionBadge(log.action)}>
                      {log.action}
                    </span>
                  </td>
                )}
                {showModule && <td>{log.module}</td>}
                {showDescription && (
                  <td>
                    <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'normal' }}>
                      {log.description}
                    </div>
                  </td>
                )}
                {showIpAddress && <td>{log.ipAddress || 'N/A'}</td>}
                {showTenant && <td>{formatTenant(log)}</td>}
                {showDateTime && <td>{formatDate(log.createdAt)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

AuditLogTable.propTypes = {
  logs: PropTypes.array,
  isLoading: PropTypes.bool,
  error: PropTypes.any,
  onRetry: PropTypes.func,
  formatUserName: PropTypes.func,
  formatTenantName: PropTypes.func,
  hideColumns: PropTypes.arrayOf(PropTypes.oneOf([
    'user', 'action', 'module', 'description', 'ipAddress', 'tenant', 'dateTime'
  ]))
};

export default AuditLogTable;