// src/pages/auditing/AuditLogs.js
import React, { useState } from 'react';
import { 
  IconSearch, 
  IconFilter, 
  IconDownload, 
  IconRefresh, 
  IconCalendar,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronUp,
  IconAdjustments
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { MODULES, ACTIONS } from '../../config';
import useAuditLogs from '../../hooks/useAuditLogs';
import AuditLogTable from '../../components/auditing/AuditLogTable';

/**
 * AuditLogs component for displaying and managing audit logs
 */
const AuditLogs = () => {
  const { hasPermission } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  
  // Use the custom hook with auto-refresh if user has permission
  const {
    logs,
    pagination,
    isLoading,
    isFetching,
    error,
    exportLoading,
    page,
    limit,
    search,
    filter,
    dateRange,
    setSearch,
    setLimit,
    updateFilter,
    updateDateRange,
    handlePageChange,
    applyFilters,
    resetFilters,
    exportLogs,
    refetch,
    retry
  } = useAuditLogs({
    autoRefresh: hasPermission('read_audit'),
    refreshInterval: 30000, // 30 seconds
    defaultLimit: 15
  });

  // Format moduleNames for filter dropdown
  const moduleNames = Object.entries(MODULES).map(([key, value]) => ({
    key: value,
    name: key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')
  }));

  // Format actionNames for filter dropdown
  const actionNames = Object.entries(ACTIONS).map(([key, value]) => ({
    key: value,
    name: key.charAt(0) + key.slice(1).toLowerCase()
  }));

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  // Handle search form submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    updateFilter(e.target.name, e.target.value);
  };

  // Handle date range change
  const handleDateRangeChange = (e) => {
    updateDateRange(e.target.name, e.target.value);
  };

  return (
    <div className="card">
      {/* Card header with title and actions */}
      <div className="card-header">
        <h3 className="card-title">
          <IconAdjustments className="icon me-2" />
          Audit Logs
        </h3>
        <div className="card-actions">
          <button 
            className="btn btn-outline-primary btn-icon me-2"
            onClick={refetch}
            disabled={isFetching}
            title="Refresh data"
          >
            <IconRefresh className={isFetching ? 'icon icon-tabler-refresh icon-spin' : 'icon'} />
          </button>
          
          <button 
            className="btn btn-outline-primary btn-icon" 
            onClick={exportLogs}
            disabled={exportLoading}
            title="Export to CSV"
          >
            {exportLoading ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <IconDownload className="icon" />
            )}
          </button>
        </div>
      </div>
      
      <div className="card-body border-bottom py-3">
        <div className="d-flex">
          {/* Length selector */}
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
          
          {/* Search and filter controls */}
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
                onClick={() => setShowFilters(!showFilters)}
              >
                <IconFilter className="icon me-1" />
                Filter
                {showFilters ? (
                  <IconChevronUp className="icon ms-2" size={16} />
                ) : (
                  <IconChevronDown className="icon ms-2" size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3">
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
                  {actionNames.map(action => (
                    <option key={action.key} value={action.key}>
                      {action.name}
                    </option>
                  ))}
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
                  {moduleNames.map(module => (
                    <option key={module.key} value={module.key}>
                      {module.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-3 mb-3">
                <label className="form-label">Start Date</label>
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <IconCalendar size={16} />
                  </span>
                  <input
                    type="date"
                    className="form-control"
                    name="startDate"
                    value={dateRange.startDate}
                    onChange={handleDateRangeChange}
                  />
                </div>
              </div>
              
              <div className="col-md-3 mb-3">
                <label className="form-label">End Date</label>
                <div className="input-icon">
                  <span className="input-icon-addon">
                    <IconCalendar size={16} />
                  </span>
                  <input
                    type="date"
                    className="form-control"
                    name="endDate"
                    value={dateRange.endDate}
                    onChange={handleDateRangeChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="d-flex justify-content-end">
              <button 
                type="button" 
                className="btn btn-link" 
                onClick={resetFilters}
              >
                <IconX className="icon me-1" />
                Reset Filters
              </button>
              <button 
                type="button" 
                className="btn btn-primary ms-2" 
                onClick={applyFilters}
              >
                <IconCheck className="icon me-1" />
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Audit logs table using our reusable component */}
      <AuditLogTable 
        logs={logs}
        isLoading={isLoading}
        error={error}
        onRetry={retry}
      />
      
      {/* Pagination */}
      {pagination && (
        <div className="card-footer d-flex align-items-center">
          <p className="m-0 text-muted">
            Showing <span>{(page - 1) * limit + 1}</span> to <span>{Math.min(page * limit, pagination.total)}</span> of <span>{pagination.total}</span> entries
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
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              // Show pages around current page
              const totalPages = pagination.pages;
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
            <li className={`page-item ${page === pagination.pages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pagination.pages}
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