// File: frontend/src/pages/users/UserManagement.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import { IconEdit, IconTrash, IconPlus, IconSearch, IconFilter } from '@tabler/icons-react';
import { API_URL } from '../../config';

const UserManagement = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    userType: '',
    isActive: ''
  });

  // Fetch users with React Query
  const { data, isLoading, error, refetch } = useQuery(
    ['users', page, limit, search, filter],
    async () => {
      const params = new URLSearchParams({
        page,
        limit,
        ...(search && { search }),
        ...(filter.userType && { userType: filter.userType }),
        ...(filter.isActive !== '' && { isActive: filter.isActive })
      });
      
      const res = await axios.get(`${API_URL}/api/v1/users?${params}`);
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
    setPage(1); // Reset to first page
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

  // Determine user badge class based on userType
  const getUserTypeBadge = (userType) => {
    switch (userType) {
      case 'master_admin':
        return 'badge bg-red';
      case 'tenant_admin':
        return 'badge bg-blue';
      case 'tenant_user':
        return 'badge bg-green';
      default:
        return 'badge bg-secondary';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">User Management</h3>
        <div className="card-actions">
          <Link to="/users/create" className="btn btn-primary">
            <IconPlus className="icon" />
            Add New User
          </Link>
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
                    placeholder="Search users..."
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
                className="btn btn-outline-secondary dropdown-toggle" 
                type="button" 
                data-bs-toggle="dropdown"
              >
                <IconFilter className="icon" />
                Filter
              </button>
              <div className="dropdown-menu dropdown-menu-end">
                <div className="dropdown-item">
                  <div className="mb-3">
                    <label className="form-label">User Type</label>
                    <select 
                      className="form-select" 
                      name="userType"
                      value={filter.userType}
                      onChange={handleFilterChange}
                    >
                      <option value="">All</option>
                      <option value="master_admin">Master Admin</option>
                      <option value="tenant_admin">Tenant Admin</option>
                      <option value="tenant_user">Tenant User</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-select" 
                      name="isActive"
                      value={filter.isActive}
                      onChange={handleFilterChange}
                    >
                      <option value="">All</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="mt-3">
                    <button 
                      className="btn btn-primary btn-sm w-100" 
                      onClick={() => refetch()}
                    >
                      Apply Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap datatable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>User Type</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Created At</th>
              <th>Actions</th>
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
                  Failed to load users
                </td>
              </tr>
            ) : data?.users?.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  No users found
                </td>
              </tr>
            ) : (
              data?.users?.map((user) => (
                <tr key={user._id}>
                  <td>
                    <Link to={`/users/${user._id}`} className="text-reset">
                      {user.firstName} {user.lastName}
                    </Link>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={getUserTypeBadge(user.userType)}>
                      {user.userType.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {user.isActive ? (
                      <span className="badge bg-success">Active</span>
                    ) : (
                      <span className="badge bg-danger">Inactive</span>
                    )}
                  </td>
                  <td>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>
                    <Link 
                      to={`/users/${user._id}`} 
                      className="btn btn-sm btn-primary me-2"
                    >
                      <IconEdit className="icon" />
                      Edit
                    </Link>
                    <button className="btn btn-sm btn-danger">
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
            {Array.from({ length: data.pagination.pages }, (_, i) => i + 1).map((p) => (
              <li 
                key={p} 
                className={`page-item ${p === page ? 'active' : ''}`}
              >
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(p)}
                >
                  {p}
                </button>
              </li>
            ))}
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

export default UserManagement;