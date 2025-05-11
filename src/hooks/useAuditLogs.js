// src/hooks/useAuditLogs.js
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { auditAPI } from '../services/api.service';

/**
 * Custom hook for managing audit logs
 * @param {Object} options - Hook options
 * @param {number} options.defaultLimit - Default number of items per page
 * @param {boolean} options.autoRefresh - Whether to automatically refresh data
 * @param {number} options.refreshInterval - Refresh interval in milliseconds
 * @param {boolean} options.keepPreviousData - Whether to keep previous data while fetching
 * @returns {Object} - Audit logs data and methods
 */
const useAuditLogs = ({
  defaultLimit = 15,
  autoRefresh = false,
  refreshInterval = 30000,
  keepPreviousData = true
} = {}) => {
  const queryClient = useQueryClient();
  
  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [filter, setFilter] = useState({
    action: '',
    module: '',
    userId: '',
    tenantId: ''
  });
  const [exportLoading, setExportLoading] = useState(false);
  
  // Create query key based on current filters
  const queryKey = ['audit-logs', page, limit, search, filter, dateRange];
  
  // Fetch audit logs
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery(
    queryKey,
    async () => {
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(filter.action && { action: filter.action }),
        ...(filter.module && { module: filter.module }),
        ...(filter.userId && { userId: filter.userId }),
        ...(filter.tenantId && { tenantId: filter.tenantId }),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });
      
      const res = await auditAPI.getAuditLogs(params);
      return res.data;
    },
    {
      keepPreviousData,
      refetchInterval: autoRefresh ? refreshInterval : false
    }
  );
  
  // Handle pagination
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= (data?.pagination?.pages || 1)) {
      setPage(newPage);
    }
  }, [data?.pagination?.pages]);
  
  // Apply filters
  const applyFilters = useCallback(() => {
    setPage(1); // Reset to first page
    refetch();
  }, [refetch]);
  
  // Reset filters
  const resetFilters = useCallback(() => {
    setFilter({
      action: '',
      module: '',
      userId: '',
      tenantId: ''
    });
    setDateRange({
      startDate: '',
      endDate: ''
    });
    setSearch('');
    setPage(1);
  }, []);
  
  // Update a specific filter
  const updateFilter = useCallback((name, value) => {
    setFilter(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Update date range
  const updateDateRange = useCallback((name, value) => {
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Export logs
  const exportLogs = useCallback(async () => {
    try {
      setExportLoading(true);
      
      // Create params based on current filters
      const params = new URLSearchParams({
        ...(search && { search }),
        ...(filter.action && { action: filter.action }),
        ...(filter.module && { module: filter.module }),
        ...(filter.userId && { userId: filter.userId }),
        ...(filter.tenantId && { tenantId: filter.tenantId }),
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      });
      
      const res = await auditAPI.exportAuditLogs(params);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename with current date
      const today = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `audit-logs-${today}.csv`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (err) {
      console.error('Export failed:', err);
      return { 
        success: false, 
        error: err.message || 'Failed to export audit logs'
      };
    } finally {
      setExportLoading(false);
    }
  }, [search, filter, dateRange]);
  
  // Retry on error
  const retry = useCallback(() => {
    queryClient.invalidateQueries(queryKey);
  }, [queryClient, queryKey]);
  
  return {
    // Data
    logs: data?.logs || [],
    pagination: data?.pagination,
    isLoading,
    isFetching,
    error,
    exportLoading,
    
    // Filter state
    page,
    limit,
    search,
    filter,
    dateRange,
    
    // Methods
    setPage,
    setLimit,
    setSearch,
    updateFilter,
    updateDateRange,
    handlePageChange,
    applyFilters,
    resetFilters,
    exportLogs,
    refetch,
    retry
  };
};

export default useAuditLogs;