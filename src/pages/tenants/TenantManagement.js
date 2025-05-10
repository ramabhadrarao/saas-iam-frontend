// File: frontend/src/pages/tenants/TenantManagement.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  IconEdit, 
  IconTrash, 
  IconPlus, 
  IconSearch, 
  IconFilter,
  IconPlayerPause,
  IconPlayerPlay
} from '@tabler/icons-react';
import { tenantAPI } from '../../services/api.service';

const TenantManagement = () => {
     const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    plan: '',
    isActive: ''
  });
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [actionModal, setActionModal] = useState({
    show: false,
    type: null, // 'suspend', 'restore', 'delete'
    tenantId: null,
    tenantName: ''
  });

  // Fetch tenants
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
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

  // Suspend tenant mutation
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

  // Restore tenant mutation
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

  // Delete tenant mutation
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

  return (
    <div className="card">
       <div className="card-header">
    <h3 className="card-title">Tenant Management</h3>
    <div className="card-actions">
      {/* Only show Add New Tenant button for master admins */}
      {user?.userType === 'master_admin' && (
        <Link to="/tenants/create" className="btn btn-primary">
          <IconPlus className="icon" />
          Add New Tenant
        </Link>
      )}
    </div>
  </div>
      
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
              {actionModal.type === 'delete' && 
                <div className="mt-2 text-danger">
                  This action cannot be undone.
                </div>
              }
              {actionModal.type === 'suspend' && 
                <div className="mt-2">
                  Users will not be able to access this tenant while it's suspended.
                </div>
              }
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
              onClick={() => {
                setFilter({
                  plan: '',
                  isActive: ''
                });
              }}
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
        <table className="table card-table table-vcenter">
          <thead>
            <tr>
              <th>Name</th>
              <th>Subdomain</th>
              <th>Plan</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="text-center text-danger">
                  Failed to load tenants
                </td>
              </tr>
            ) : data?.tenants?.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">
                  No tenants found
                </td>
              </tr>
            ) : (
              data?.tenants?.map((tenant) => (
                <tr key={tenant._id}>
                  <td>
                    <Link to={`/tenants/${tenant._id}`} className="text-reset">
                      {tenant.name}
                    </Link>
                  </td>
                  <td>
                    <span className="text-muted">{tenant.subdomain}</span>
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
                  <td className="text-muted">{formatDate(tenant.createdAt)}</td>
                  <td>
                    <Link 
                      to={`/tenants/${tenant._id}`} 
                      className="btn btn-sm btn-primary me-1"
                    >
                      <IconEdit className="icon" />
                      Edit
                    </Link>
                    
                    {tenant.isActive ? (
                      <button 
                        className="btn btn-sm btn-warning me-1"
                        onClick={() => openActionModal('suspend', tenant)}
                      >
                        <IconPlayerPause className="icon" />
                        Suspend
                      </button>
                    ) : (
                      <button 
                        className="btn btn-sm btn-success me-1"
                        onClick={() => openActionModal('restore', tenant)}
                      >
                        <IconPlayerPlay className="icon" />
                        Restore
                      </button>
                    )}
                    
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => openActionModal('delete', tenant)}
                    >
                      <IconTrash className="icon" />
                      Delete
                    </button>
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
  );
};

export default TenantManagement;