// File: frontend/src/pages/roles/RoleManagement.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import { roleAPI } from '../../services/api.service';

const RoleManagement = () => {
  const queryClient = useQueryClient();
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    roleId: null,
    roleName: ''
  });
  
  // Fetch roles
  const { data, isLoading, error } = useQuery(
    'roles',
    async () => {
      const res = await roleAPI.getRoles();
      return res.data.roles;
    }
  );
  
  // Delete role mutation
  const deleteMutation = useMutation(
    (id) => roleAPI.deleteRole(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
        setDeleteConfirmation({
          show: false,
          roleId: null,
          roleName: ''
        });
      }
    }
  );
  
  // Open delete confirmation
  const handleDeleteClick = (role) => {
    setDeleteConfirmation({
      show: true,
      roleId: role._id,
      roleName: role.name
    });
  };
  
  // Close delete confirmation
  const handleCancelDelete = () => {
    setDeleteConfirmation({
      show: false,
      roleId: null,
      roleName: ''
    });
  };
  
  // Confirm delete
  const handleConfirmDelete = () => {
    if (deleteConfirmation.roleId) {
      deleteMutation.mutate(deleteConfirmation.roleId);
    }
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Role Management</h3>
        <div className="card-actions">
          <Link to="/roles/create" className="btn btn-primary">
            <IconPlus className="icon" />
            Add New Role
          </Link>
        </div>
      </div>
      
      {deleteConfirmation.show && (
        <div className="card mb-3 mx-3 mt-3">
          <div className="card-status-top bg-danger"></div>
          <div className="card-body">
            <h3 className="card-title text-danger">Confirm Delete</h3>
            <p>
              Are you sure you want to delete the role <strong>{deleteConfirmation.roleName}</strong>?
              This action cannot be undone.
            </p>
            <div className="d-flex justify-content-end">
              <button 
                className="btn btn-link" 
                onClick={handleCancelDelete}
                disabled={deleteMutation.isLoading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger ms-2" 
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isLoading}
              >
                {deleteMutation.isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete Role'
                )}
              </button>
            </div>
            {deleteMutation.isError && (
              <div className="alert alert-danger mt-3" role="alert">
                {deleteMutation.error.response?.data?.message || 'Error deleting role'}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="table-responsive">
        <table className="table card-table table-vcenter text-nowrap">
          <thead>
            <tr>
              <th>Role Name</th>
              <th>Description</th>
              <th>Type</th>
              <th>Permissions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="5" className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="5" className="text-center text-danger">
                  Failed to load roles
                </td>
              </tr>
            ) : data?.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  No roles found
                </td>
              </tr>
            ) : (
              data?.map((role) => (
                <tr key={role._id}>
                  <td>
                    <Link to={`/roles/${role._id}`} className="text-reset">
                      {role.name}
                    </Link>
                  </td>
                  <td>{role.description}</td>
                  <td>
                    {role.isSystemRole ? (
                      <span className="badge bg-blue">System Role</span>
                    ) : (
                      <span className="badge bg-green">Custom Role</span>
                    )}
                  </td>
                  <td>
                    <span className="badge bg-purple">{role.permissions?.length || 0} permissions</span>
                  </td>
                  <td>
                    <Link 
                      to={`/roles/${role._id}`} 
                      className="btn btn-sm btn-primary me-2"
                    >
                      <IconEdit className="icon" />
                      Edit
                    </Link>
                    {!role.isSystemRole && (
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteClick(role)}
                      >
                        <IconTrash className="icon" />
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoleManagement;