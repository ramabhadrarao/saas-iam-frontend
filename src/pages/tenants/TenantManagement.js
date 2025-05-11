// src/pages/tenants/TenantManagement.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  IconEdit, 
  IconTrash, 
  IconPlus, 
  IconSearch, 
  IconFilter,
  IconPlayerPause,
  IconPlayerPlay,
  IconAlertTriangle,
  IconInfoCircle,
  IconUsers,
  IconBuildingSkyscraper,
  IconRefresh,
  IconChecks
} from '@tabler/icons-react';
import { tenantAPI } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

const TenantManagement = () => {
  const { user, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    plan: '',
    isActive: ''
  });
  const [actionModal, setActionModal] = useState({
    show: false,
    type: null, // 'suspend', 'restore', 'delete'
    tenantId: null,
    tenantName: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tenants
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useQuery(
    ['tenants', page, limit, search, filter],
    async () => {
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(filter.plan && { plan: filter.plan }),
        ...(filter.isActive !== '' && { isActive: filter.isActive })
      });
      
      const res = await tenantAPI.getTenants(params);
      return res.data;
    },
    {
      keepPreviousData: true
    }
  );

  // Mutations
  const suspendMutation = useMutation(
    (id) => tenantAPI.suspendTenant(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        setActionModal({
          show: false,
          type: null,
          tenantId: null,
          tenantName: ''
        });
      }
    }
  );

  const restoreMutation = useMutation(
    (id) => tenantAPI.restoreTenant(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        setActionModal({
          show: false,
          type: null,
          tenantId: null,
          tenantName: ''
        });
      }
    }
  );

  const deleteMutation = useMutation(
    (id) => tenantAPI.deleteTenant(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        setActionModal({
          show: false,
          type: null,
          tenantId: null,
          tenantName: ''
        });
      }
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
    setShowFilters(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilter({
      plan: '',
      isActive: ''
    });
    setPage(1);
    setShowFilters(false);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.pagination?.pages || 1)) {
      setPage(newPage);
    }
  };

  // Open action modal (suspend, restore, delete)
  const openActionModal = (type, tenant) => {
    setActionModal({
      show: true,
      type,
      tenantId: tenant._id,
      tenantName: tenant.name
    });
  };

  // Close action modal
  const closeActionModal = () => {
    setActionModal({
      show: false,
      type: null,
      tenantId: null,
      tenantName: ''
    });
  };

  // Handle action confirmation
  const handleActionConfirm = () => {
    const { type, tenantId } = actionModal;
    
    if (type === 'suspend') {
      suspendMutation.mutate(tenantId);
    } else if (type === 'restore') {
      restoreMutation.mutate(tenantId);
    } else if (type === 'delete') {
      deleteMutation.mutate(tenantId);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Get plan badge based on plan type
  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'free':
        return 'badge bg-secondary';
      case 'starter':
        return 'badge bg-info';
      case 'professional':
        return 'badge bg-primary';
      case 'enterprise':
        return 'badge bg-purple';
      default:
        return 'badge bg-secondary';
    }
  };

  const canManageTenant = hasPermission('manage_tenant');
  const canCreateTenant = hasPermission('create_tenant');
  const canDeleteTenant = hasPermission('delete_tenant');

  return (
    <div className="page-body">
      <div className="container-xl">
        {/* Page header */}
        <div className="page-header d-print-none">
          <div className="row align-items-center">
            <div className="col">
              <div className="page-pretitle">Administration</div>
              <h2 className="page-title">Tenant Management</h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <button 
                  className="btn btn-primary d-none d-sm-inline-block"
                  onClick={refetch}
                  disabled={isFetching}
                >
                  <IconRefresh className="icon me-2" />
                  Refresh
                </button>
                {canCreateTenant && (
                  <Link to="/tenants/create" className="btn btn-primary d-none d-sm-inline-block">
                    <IconPlus className="icon me-2" />
                    Add New Tenant
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      
        <div className="card">
          {actionModal.show && (
            <div className="card mb-3 mx-3 mt-3">
              <div className={`card-status-top ${
                actionModal.type === 'delete' ? 'bg-danger' : 
                actionModal.type === 'suspend' ? 'bg-warning' : 
                'bg-success'
              }`}></div>
              <div className="card-body">
                <h3 className={`card-title ${
                  actionModal.type === 'delete' ? 'text-danger' : 
                  actionModal.type === 'suspend' ? 'text-warning' : 
                  'text-success'
                }`}>
                  {actionModal.type === 'delete' ? 'Confirm Delete' : 
                  actionModal.type === 'suspend' ? 'Confirm Suspend' : 
                  'Confirm Restore'}
                </h3>
                <p>
                  Are you sure you want to 
                  {actionModal.type === 'delete' ? ' delete ' : 
                  actionModal.type === 'suspend' ? ' suspend ' : 
                  ' restore '}
                  the tenant <strong>{actionModal.tenantName}</strong>?
                  {actionModal.type === 'delete' && (
                    <div className="alert alert-danger mt-2">
                      <div className="d-flex">
                        <div>
                          <IconAlertTriangle className="alert-icon" />
                        </div>
                        <div>
                          <h4 className="alert-title">Warning!</h4>
                          <div>
                            This action cannot be undone. All tenant data will be permanently deleted.
                            Users will no longer be able to access this tenant.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {actionModal.type === 'suspend' && (
                    <div className="alert alert-warning mt-2">
                      <div className="d-flex">
                        <div>
                          <IconInfoCircle className="alert-icon" />
                        </div>
                        <div>
                          <h4 className="alert-title">Suspension Notice</h4>
                          <div>
                            Users will not be able to access this tenant while it's suspended.
                            All data will remain intact and can be restored later.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {actionModal.type === 'restore' && (
                    <div className="alert alert-success mt-2">
                      <div className="d-flex">
                        <div>
                          <IconChecks className="alert-icon" />
                        </div>
                        <div>
                          <h4 className="alert-title">Restore Access</h4>
                          <div>
                            This will restore access to all users of this tenant.
                            All previously configured settings will be restored.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </p>
                <div className="d-flex justify-content-end">
                  <button 
                    className="btn btn-link" 
                    onClick={closeActionModal}
                    disabled={
                      suspendMutation.isLoading || 
                      restoreMutation.isLoading || 
                      deleteMutation.isLoading
                    }
                  >
                    Cancel
                  </button>
                  <button 
                    className={`btn ms-2 ${
                      actionModal.type === 'delete' ? 'btn-danger' : 
                      actionModal.type === 'suspend' ? 'btn-warning' : 
                      'btn-success'
                    }`} 
                    onClick={handleActionConfirm}
                    disabled={
                      suspendMutation.isLoading || 
                      restoreMutation.isLoading || 
                      deleteMutation.isLoading
                    }
                  >
                    {suspendMutation.isLoading || 
                      restoreMutation.isLoading || 
                      deleteMutation.isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Processing...
                      </>
                    ) : (
                      actionModal.type === 'delete' ? 'Delete Tenant' : 
                      actionModal.type === 'suspend' ? 'Suspend Tenant' : 
                      'Restore Tenant'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
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
                    <option value="10">10</option>
                    <option value="25">25</option>
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
                        placeholder="Search tenants..."
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
                    <IconFilter className="icon" />
                    Filter
                  </button>
                </div>
              </div>
            </div>
            
            {showFilters && (
              <div className="mt-3">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Plan</label>
                    <select 
                      className="form-select" 
                      name="plan"
                      value={filter.plan}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Plans</option>
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-select" 
                      name="isActive"
                      value={filter.isActive}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Statuses</option>
                      <option value="true">Active</option>
                      <option value="false">Suspended</option>
                    </select>
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
            )}
          </div>
          
          <div className="table-responsive">
            <table className="table card-table table-vcenter text-nowrap">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subdomain</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <div className="mt-2">Loading tenants...</div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="text-center text-danger py-4">
                      <IconAlertTriangle size={24} className="mb-2" />
                      <div>Failed to load tenants</div>
                      <button 
                        className="btn btn-sm btn-outline-danger mt-2"
                        onClick={() => refetch()}
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : data?.tenants?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <IconBuildingSkyscraper size={24} className="text-muted mb-2" />
                      <div className="text-muted">No tenants found</div>
                      {canCreateTenant && (
                        <Link to="/tenants/create" className="btn btn-sm btn-primary mt-2">
                          <IconPlus className="icon me-1" />
                          Add Tenant
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  data?.tenants?.map((tenant) => (
                    <tr key={tenant._id}>
                      <td>
                        <Link to={`/tenants/${tenant._id}`} className="text-reset d-flex align-items-center">
                          <span className="avatar me-2 bg-blue-lt">
                            {tenant.name.charAt(0).toUpperCase()}
                          </span>
                          {tenant.name}
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <span className="text-muted">{tenant.subdomain}</span>
                          <a 
                            href={`https://${tenant.subdomain}.example.com`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ms-2 btn btn-sm btn-outline-secondary btn-icon"
                            title="Visit tenant site"
                          >
                            <IconBuildingSkyscraper size={16} />
                          </a>
                        </div>
                      </td>
                      <td>
                        <span className={getPlanBadge(tenant.plan)}>
                          {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                        </span>
                      </td>
                      <td>
                        {tenant.isActive ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-danger">Suspended</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <IconUsers size={16} className="me-1 text-muted" />
                          {tenant.userCount || 0}
                        </div>
                      </td>
                      <td className="text-muted">{formatDate(tenant.createdAt)}</td>
                      <td>
                        <div className="btn-list">
                          <Link 
                            to={`/tenants/${tenant._id}`} 
                            className="btn btn-sm btn-primary"
                          >
                            <IconEdit className="icon me-1" />
                            Manage
                          </Link>
                          
                          {canManageTenant && tenant.isActive && (
                            <button 
                              className="btn btn-sm btn-warning"
                              onClick={() => openActionModal('suspend', tenant)}
                            >
                              <IconPlayerPause className="icon me-1" />
                              Suspend
                            </button>
                          )}
                          
                          {canManageTenant && !tenant.isActive && (
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => openActionModal('restore', tenant)}
                            >
                              <IconPlayerPlay className="icon me-1" />
                              Restore
                            </button>
                          )}
                          
                          {canDeleteTenant && (
                            <button 
                              className="btn btn-sm btn-danger"
                              onClick={() => openActionModal('delete', tenant)}
                            >
                              <IconTrash className="icon me-1" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
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
      </div>
    </div>
  );
};

export default TenantManagement;