// File: frontend/src/pages/auditing/AuditLogs.js
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { IconSearch, IconFilter, IconDownload } from '@tabler/icons-react';
import { API_URL } from '../../config';

const AuditLogs = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    action: '',
    module: '',
    startDate: '',
    endDate: ''
  });

  // Fetch audit logs with React Query
  const { data, isLoading, error, refetch } = useQuery(
    ['audit-logs', page, limit, search, filter],
    async () => {
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(filter.action && { action: filter.action }),
        ...(filter.module && { module: filter.module }),
        ...(filter.startDate && { startDate: filter.startDate }),
        ...(filter.endDate && { endDate: filter.endDate })
      });
      
      const res = await axios.get(`${API_URL}/api/v1/audit-logs?${params}`);
      return res.data;
    },
    {
      keepPreviousData: true
    }
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    refetch();
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value
    });
  };

  // Apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page
    refetch();
  };

  // Reset filters
  const resetFilters = () => {
    setFilter({
      action: '',
      module: '',
      startDate: '',
      endDate: ''
    });
    setPage(1);
    refetch();
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.pagination?.pages || 1)) {
      setPage(newPage);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get action badge class
  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN':
      case 'VIEW':
        return 'badge bg-blue';
      case 'CREATE':
        return 'badge bg-green';
      case 'UPDATE':
        return 'badge bg-yellow';
      case 'DELETE':
        return 'badge bg-red';
      case 'LOGOUT':
        return 'badge bg-gray';
      default:
        return 'badge bg-secondary';
    }
  };

  // Export logs to CSV
  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        export: 'csv',
        ...(search && { search }),
        ...(filter.action && { action: filter.action }),
        ...(filter.module && { module: filter.module }),
        ...(filter.startDate && { startDate: filter.startDate }),
        ...(filter.endDate && { endDate: filter.endDate })
      });
      
      const res = await axios.get(`${API_URL}/api/v1/audit-logs/export?${params}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export audit logs');
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Audit Logs</h3>
        <div className="card-actions">
          <button 
            className="btn btn-outline-primary btn-icon" 
            onClick={exportLogs}
            title="Export to CSV"
          >
            <IconDownload />
          </button>
        </div>
      </div>
      
      <div className="card-body border-bottom py-3">
        <div className="d-flex">
          <div className="text-muted">
            Show
            <div className="mx-2 d-inline-block">
              <select 
                className="form-select form-select-sm" 
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
              >
                <option value="15">15</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            entries
          </div>
          
          <div className="ms-auto d-flex">
            <div className="me-2">
              <form onSubmit={handleSearchSubmit}>
                <div className="input-icon">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search logs..."
                    value={search}
                    onChange={handleSearchChange}
                  />
                  <span className="input-icon-addon">
                    <IconSearch className="icon" />
                  </span>
                </div>
              </form>
            </div>
            <div>
              <button 
                className="btn btn-outline-secondary" 
                type="button" 
                data-bs-toggle="collapse"
                data-bs-target="#filterPanel"
              >
                <IconFilter className="icon" />
                Filter
              </button>
            </div>
          </div>
        </div>
        
        <div className="collapse mt-3" id="filterPanel">
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">Action</label>
              <select 
                className="form-select" 
                name="action"
                value={filter.action}
                onChange={handleFilterChange}
              >
                <option value="">All Actions</option>
                <option value="LOGIN">Login</option>
                <option value="LOGOUT">Logout</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="VIEW">View</option>
              </select>
            </div>
            
            <div className="col-md-3 mb-3">
              <label className="form-label">Module</label>
              <select 
                className="form-select" 
                name="module"
                value={filter.module}
                onChange={handleFilterChange}
              >
                <option value="">All Modules</option>
                <option value="AUTH">Authentication</option>
                <option value="USER">User</option>
                <option value="ROLE">Role</option>
                <option value="PERMISSION">Permission</option>
                <option value="TENANT">Tenant</option>
              </select>
            </div>
            // File: frontend/src/pages/auditing/AuditLogs.js (continued)
            <div className="col-md-3 mb-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                name="startDate"
                value={filter.startDate}
                onChange={handleFilterChange}
              />
            </div>
            
            <div className="col-md-3 mb-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                name="endDate"
                value={filter.endDate}
                onChange={handleFilterChange}
              />
            </div>
          </div>
          
          <div className="d-flex justify-content-end">
            <button 
              type="button" 
              className="btn btn-link" 
              onClick={resetFilters}
            >
              Reset
            </button>
            <button 
              type="button" 
              className="btn btn-primary ms-2" 
              onClick={applyFilters}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Module</th>
              <th>Description</th>
              <th>IP Address</th>
              <th>Tenant</th>
              <th>Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7" className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="7" className="text-center text-danger">
                  Failed to load audit logs
                </td>
              </tr>
            ) : data?.logs?.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  No audit logs found
                </td>
              </tr>
            ) : (
              data?.logs?.map((log) => (
                <tr key={log._id}>
                  <td>{log.user?.fullName || log.userId}</td>
                  <td>
                    <span className={getActionBadge(log.action)}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.module}</td>
                  <td>{log.description}</td>
                  <td>{log.ipAddress}</td>
                  <td>{log.tenant?.name || (log.tenantId ? log.tenantId : 'N/A')}</td>
                  <td>{formatDate(log.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {data?.pagination && (
        <div className="card-footer d-flex align-items-center">
          <p className="m-0 text-muted">
            Showing <span>{(page - 1) * limit + 1}</span> to <span>{Math.min(page * limit, data.pagination.total)}</span> of <span>{data.pagination.total}</span> entries
          </p>
          <ul className="pagination m-0 ms-auto">
            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                <span>&laquo;</span>
              </button>
            </li>
            {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
              // Show pages around current page
              const totalPages = data.pagination.pages;
              const startPage = Math.max(1, Math.min(page - 2, totalPages - 4));
              const pageNumber = startPage + i;
              
              return pageNumber <= totalPages ? (
                <li 
                  key={pageNumber} 
                  className={`page-item ${pageNumber === page ? 'active' : ''}`}
                >
                  <button 
                    className="page-link" 
                    onClick={() => handlePageChange(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                </li>
              ) : null;
            })}
            <li className={`page-item ${page === data.pagination.pages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.pagination.pages}
              >
                <span>&raquo;</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;