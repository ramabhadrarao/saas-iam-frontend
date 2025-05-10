// File: frontend/src/pages/roles/RoleBuilder.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { API_URL } from '../../config';

const RoleBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedModule, setSelectedModule] = useState('all');
  
  // Fetch role data if editing
  const { 
    data: roleData, 
    isLoading: roleLoading,
    error: roleError 
  } = useQuery(
    ['role', id],
    async () => {
      if (!id) return null;
      const res = await axios.get(`${API_URL}/api/v1/roles/${id}`);
      return res.data.role;
    },
    {
      enabled: !!id
    }
  );
  // File: frontend/src/pages/roles/RoleBuilder.js (continued)
  // Fetch available permissions
  const { 
    data: permissionsData, 
    isLoading: permissionsLoading 
  } = useQuery(
    'permissions',
    async () => {
      const res = await axios.get(`${API_URL}/api/v1/permissions`);
      return res.data.permissions;
    }
  );
  
  // Group permissions by module
  const groupedPermissions = React.useMemo(() => {
    if (!permissionsData) return {};
    
    const groups = {
      all: permissionsData
    };
    
    permissionsData.forEach(permission => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }
      groups[permission.module].push(permission);
    });
    
    return groups;
  }, [permissionsData]);
  
  // Get available modules
  const modules = React.useMemo(() => {
    if (!permissionsData) return [];
    
    const modulesSet = new Set(permissionsData.map(p => p.module));
    return ['all', ...Array.from(modulesSet)];
  }, [permissionsData]);
  
  // Create or update role mutation
  const mutation = useMutation(
    (roleData) => {
      if (id) {
        return axios.put(`${API_URL}/api/v1/roles/${id}`, roleData);
      } else {
        return axios.post(`${API_URL}/api/v1/roles`, roleData);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('roles');
        navigate('/roles');
      }
    }
  );
  
  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Role name is required')
      .min(3, 'Role name must be at least 3 characters'),
    description: Yup.string()
      .required('Description is required'),
    permissions: Yup.array()
      .min(1, 'At least one permission must be selected')
  });
  
  // Form setup with Formik
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      permissions: [],
      isSystemRole: false,
      tenantId: null
    },
    validationSchema,
    onSubmit: (values) => {
      mutation.mutate(values);
    },
    enableReinitialize: true
  });
  
  // Update form values when role data is loaded
  useEffect(() => {
    if (roleData) {
      formik.setValues({
        name: roleData.name || '',
        description: roleData.description || '',
        permissions: roleData.permissions.map(p => p._id) || [],
        isSystemRole: roleData.isSystemRole || false,
        tenantId: roleData.tenantId || null
      });
    }
  }, [roleData]);
  
  // Handle permission selection
  const handlePermissionChange = (permissionId) => {
    const currentPermissions = [...formik.values.permissions];
    
    if (currentPermissions.includes(permissionId)) {
      // Remove permission
      formik.setFieldValue(
        'permissions',
        currentPermissions.filter(id => id !== permissionId)
      );
    } else {
      // Add permission
      formik.setFieldValue('permissions', [...currentPermissions, permissionId]);
    }
  };
  
  // Check if all permissions in a module are selected
  const isModuleFullySelected = (modulePermissions) => {
    return modulePermissions.every(permission => 
      formik.values.permissions.includes(permission._id)
    );
  };
  
  // Handle select all for a module
  const handleSelectAllModule = (modulePermissions) => {
    const permissionIds = modulePermissions.map(p => p._id);
    const currentPermissions = [...formik.values.permissions];
    
    if (isModuleFullySelected(modulePermissions)) {
      // Remove all permissions from this module
      formik.setFieldValue(
        'permissions',
        currentPermissions.filter(id => !permissionIds.includes(id))
      );
    } else {
      // Add all missing permissions from this module
      const newPermissions = [
        ...currentPermissions,
        ...permissionIds.filter(id => !currentPermissions.includes(id))
      ];
      formik.setFieldValue('permissions', newPermissions);
    }
  };
  
  if (roleLoading || permissionsLoading) {
    return (
      <div className="card">
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (roleError && id) {
    return (
      <div className="card">
        <div className="card-body text-center text-danger">
          Error loading role data
        </div>
      </div>
    );
  }
  
  return (
    <form onSubmit={formik.handleSubmit}>
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">{id ? 'Edit Role' : 'Create New Role'}</h3>
        </div>
        
        <div className="card-body">
          {mutation.isError && (
            <div className="alert alert-danger" role="alert">
              {mutation.error.response?.data?.message || 'Error saving role'}
            </div>
          )}
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label required">Role Name</label>
              <input
                type="text"
                className={`form-control ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''}`}
                placeholder="Enter role name"
                id="name"
                name="name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
              />
              {formik.touched.name && formik.errors.name && (
                <div className="invalid-feedback">{formik.errors.name}</div>
              )}
            </div>
            
            <div className="col-md-6">
              <label className="form-label">System Role</label>
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="isSystemRole"
                  name="isSystemRole"
                  checked={formik.values.isSystemRole}
                  onChange={formik.handleChange}
                />
                <label className="form-check-label" htmlFor="isSystemRole">
                  {formik.values.isSystemRole ? 'Yes' : 'No'}
                </label>
              </div>
              <small className="form-hint">
                System roles are applied across all tenants
              </small>
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label required">Description</label>
            <textarea
              className={`form-control ${formik.touched.description && formik.errors.description ? 'is-invalid' : ''}`}
              placeholder="Enter role description"
              rows="3"
              id="description"
              name="description"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.description}
            ></textarea>
            {formik.touched.description && formik.errors.description && (
              <div className="invalid-feedback">{formik.errors.description}</div>
            )}
          </div>
          
          <div className="mb-3">
            <label className="form-label required">Permissions</label>
            
            {formik.touched.permissions && formik.errors.permissions && (
              <div className="alert alert-danger" role="alert">
                {formik.errors.permissions}
              </div>
            )}
            
            <div className="row">
              <div className="col-md-3">
                <div className="list-group mb-3">
                  {modules.map((module) => (
                    <button
                      key={module}
                      type="button"
                      className={`list-group-item list-group-item-action ${selectedModule === module ? 'active' : ''}`}
                      onClick={() => setSelectedModule(module)}
                    >
                      {module === 'all' ? 'All Modules' : module}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="col-md-9">
                <div className="card">
                  <div className="card-header">
                    <div className="d-flex justify-content-between align-items-center">
                      <h4 className="card-title">
                        {selectedModule === 'all' ? 'All Permissions' : `${selectedModule} Permissions`}
                      </h4>
                      
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`select-all-${selectedModule}`}
                          checked={isModuleFullySelected(groupedPermissions[selectedModule] || [])}
                          onChange={() => handleSelectAllModule(groupedPermissions[selectedModule] || [])}
                        />
                        <label className="form-check-label" htmlFor={`select-all-${selectedModule}`}>
                          Select All
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body p-0">
                    <div className="list-group list-group-flush">
                      {groupedPermissions[selectedModule]?.map((permission) => (
                        <div key={permission._id} className="list-group-item">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`permission-${permission._id}`}
                                checked={formik.values.permissions.includes(permission._id)}
                                onChange={() => handlePermissionChange(permission._id)}
                              />
                            </div>
                            <div className="col-auto">
                              <span className={`badge bg-${permission.action === 'create' ? 'green' : 
                                permission.action === 'read' ? 'blue' : 
                                permission.action === 'update' ? 'orange' : 
                                permission.action === 'delete' ? 'red' : 'purple'}`}>
                                {permission.action}
                              </span>
                            </div>
                            <div className="col">
                              <label className="form-check-label" htmlFor={`permission-${permission._id}`}>
                                {permission.name}
                              </label>
                              <div className="text-muted small">{permission.description}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-footer text-end">
          <button 
            type="button" 
            className="btn btn-link" 
            onClick={() => navigate('/roles')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary ms-2" 
            disabled={mutation.isLoading}
          >
            {mutation.isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Saving...
              </>
            ) : (
              'Save Role'
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default RoleBuilder;