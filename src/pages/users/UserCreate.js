// src/pages/users/UserCreate.js - Add tenant query
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, roleAPI, tenantAPI } from '../../services/api.service';

const UserCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  // Fetch available roles
  const { 
    data: rolesData,
    isLoading: rolesLoading
  } = useQuery(
    'roles',
    async () => {
      const res = await roleAPI.getRoles();
      return res.data.roles;
    }
  );
  
  // Fetch tenants if user is master_admin
  const { 
    data: tenantsData,
    isLoading: tenantsLoading
  } = useQuery(
    'tenants',
    async () => {
      const res = await tenantAPI.getTenants();
      return res.data.tenants;
    },
    {
      enabled: currentUser?.userType === 'master_admin'
    }
  );
  
  // Create user mutation
  const createMutation = useMutation(
    (userData) => userAPI.createUser(userData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('users');
        navigate(`/users/${data.data.user.id}`);
      }
    }
  );
  
  // Form validation schema
  const validationSchema = Yup.object({
    firstName: Yup.string()
      .required('First name is required'),
    lastName: Yup.string()
      .required('Last name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
    userType: Yup.string()
      .required('User type is required'),
    initialRoles: Yup.array()
      .min(1, 'At least one role must be selected'),
    tenantId: Yup.string()
      .when('userType', {
        is: (value) => value === 'tenant_admin' || value === 'tenant_user',
        then: Yup.string().required('Tenant is required for tenant users')
      })
  });
  
  // Form setup
  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'tenant_user',
      isActive: true,
      initialRoles: [],
      tenantId: currentUser?.userType !== 'master_admin' ? currentUser?.tenantId : ''
    },
    validationSchema,
    onSubmit: (values) => {
      // Prepare data for API
      const userData = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        userType: values.userType,
        isActive: values.isActive,
        initialRoles: values.initialRoles,
        tenantId: values.tenantId
      };
      
      createMutation.mutate(userData);
    }
  });
  
  // Handle role selection
  const handleRoleChange = (roleId) => {
    const currentRoles = [...formik.values.initialRoles];
    
    if (currentRoles.includes(roleId)) {
      // Remove role
      formik.setFieldValue(
        'initialRoles',
        currentRoles.filter(id => id !== roleId)
      );
    } else {
      // Add role
      formik.setFieldValue('initialRoles', [...currentRoles, roleId]);
    }
  };

  // Handle user type change - reset tenant and roles if needed
  const handleUserTypeChange = (e) => {
    const newUserType = e.target.value;
    formik.setFieldValue('userType', newUserType);
    
    // Reset roles when changing user type
    formik.setFieldValue('initialRoles', []);
    
    // Set tenant ID automatically for tenant users if current user is not master_admin
    if (currentUser?.userType !== 'master_admin' && 
       (newUserType === 'tenant_admin' || newUserType === 'tenant_user')) {
      formik.setFieldValue('tenantId', currentUser.tenantId);
    } else if (newUserType === 'master_admin') {
      formik.setFieldValue('tenantId', '');
    }
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Create New User</h3>
      </div>
      
      <form onSubmit={formik.handleSubmit}>
        <div className="card-body">
          {createMutation.isError && (
            <div className="alert alert-danger" role="alert">
              {createMutation.error.response?.data?.message || 'Error creating user'}
            </div>
          )}
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label required">First Name</label>
              <input
                type="text"
                className={`form-control ${formik.touched.firstName && formik.errors.firstName ? 'is-invalid' : ''}`}
                placeholder="First name"
                id="firstName"
                name="firstName"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.firstName}
              />
              {formik.touched.firstName && formik.errors.firstName && (
                <div className="invalid-feedback">{formik.errors.firstName}</div>
              )}
            </div>
            
            <div className="col-md-6">
              <label className="form-label required">Last Name</label>
              <input
                type="text"
                className={`form-control ${formik.touched.lastName && formik.errors.lastName ? 'is-invalid' : ''}`}
                placeholder="Last name"
                id="lastName"
                name="lastName"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.lastName}
              />
              {formik.touched.lastName && formik.errors.lastName && (
                <div className="invalid-feedback">{formik.errors.lastName}</div>
              )}
            </div>
          </div>
          
          <div className="mb-3">
            <label className="form-label required">Email</label>
            <input
              type="email"
              className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
              placeholder="Email address"
              id="email"
              name="email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="invalid-feedback">{formik.errors.email}</div>
            )}
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label required">Password</label>
              <input
                type="password"
                className={`form-control ${formik.touched.password && formik.errors.password ? 'is-invalid' : ''}`}
                placeholder="Password"
                id="password"
                name="password"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.password}
              />
              {formik.touched.password && formik.errors.password && (
                <div className="invalid-feedback">{formik.errors.password}</div>
              )}
            </div>
            
            <div className="col-md-6">
              <label className="form-label required">Confirm Password</label>
              <input
                type="password"
                className={`form-control ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Confirm password"
                id="confirmPassword"
                name="confirmPassword"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className="invalid-feedback">{formik.errors.confirmPassword}</div>
              )}
            </div>
          </div>
          
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label required">User Type</label>
              <select
                className={`form-select ${formik.touched.userType && formik.errors.userType ? 'is-invalid' : ''}`}
                id="userType"
                name="userType"
                onChange={handleUserTypeChange}
                onBlur={formik.handleBlur}
                value={formik.values.userType}
                disabled={currentUser?.userType !== 'master_admin'}
              >
                {currentUser?.userType === 'master_admin' && (
                  <option value="master_admin">Master Admin</option>
                )}
                <option value="tenant_admin">Tenant Admin</option>
                <option value="tenant_user">Tenant User</option>
              </select>
              {formik.touched.userType && formik.errors.userType && (
                <div className="invalid-feedback">{formik.errors.userType}</div>
              )}
            </div>
            
            <div className="col-md-6">
              <label className="form-label">Status</label>
              <div className="form-selectgroup">
                <label className="form-selectgroup-item">
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    className="form-selectgroup-input"
                    checked={formik.values.isActive}
                    onChange={() => formik.setFieldValue('isActive', true)}
                  />
                  <span className="form-selectgroup-label">Active</span>
                </label>
                <label className="form-selectgroup-item">
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    className="form-selectgroup-input"
                    checked={!formik.values.isActive}
                    onChange={() => formik.setFieldValue('isActive', false)}
                  />
                  <span className="form-selectgroup-label">Inactive</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Tenant selection for master admin */}
          {currentUser?.userType === 'master_admin' &&
           (formik.values.userType === 'tenant_admin' || formik.values.userType === 'tenant_user') && (
            <div className="mb-3">
              <label className="form-label required">Tenant</label>
              <select
                className={`form-select ${formik.touched.tenantId && formik.errors.tenantId ? 'is-invalid' : ''}`}
                id="tenantId"
                name="tenantId"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.tenantId}
              >
                <option value="">Select Tenant</option>
                {tenantsData?.map(tenant => (
                  <option key={tenant._id} value={tenant._id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              {formik.touched.tenantId && formik.errors.tenantId && (
                <div className="invalid-feedback">{formik.errors.tenantId}</div>
              )}
            </div>
          )}
          
          <div className="mb-3">
            <label className="form-label required">Assigned Roles</label>
            
            {formik.touched.initialRoles && formik.errors.initialRoles && (
              <div className="alert alert-danger" role="alert">
                {formik.errors.initialRoles}
              </div>
            )}
            
            <div className="card">
              <div className="card-body p-0">
                <div className="list-group list-group-flush">
                  {rolesLoading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    rolesData?.map((role) => {
                      // For tenant users, only show non-system roles or system roles that are specifically for tenants
                      const isTenantUser = formik.values.userType === 'tenant_admin' || formik.values.userType === 'tenant_user';
                      const isMasterAdmin = formik.values.userType === 'master_admin';
                      
                      // Filter roles based on user type
                      if ((isTenantUser && role.isSystemRole && role.name !== 'Tenant Admin' && role.name !== 'Tenant User') ||
                          (isMasterAdmin && !role.isSystemRole)) {
                        return null;
                      }
                      
                      return (
                        <div key={role._id} className="list-group-item">
                          <div className="row align-items-center">
                            <div className="col-auto">
                              <input
                                type="checkbox"
                                className="form-check-input"
                                id={`role-${role._id}`}
                                checked={formik.values.initialRoles.includes(role._id)}
                                onChange={() => handleRoleChange(role._id)}
                              />
                            </div>
                            <div className="col">
                              <label className="form-check-label" htmlFor={`role-${role._id}`}>
                                {role.name}
                              </label>
                              <div className="text-muted small">{role.description}</div>
                              {role.isSystemRole && (
                                <span className="badge bg-blue-lt">System Role</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-footer text-end">
          <button 
            type="button" 
            className="btn btn-link" 
            onClick={() => navigate('/users')}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary ms-2" 
            disabled={createMutation.isLoading}
          >
            {createMutation.isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserCreate;