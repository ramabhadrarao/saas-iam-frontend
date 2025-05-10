// File: frontend/src/pages/users/UserCreate.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { userAPI, roleAPI } from '../../services/api.service';

const UserCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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
      .min(1, 'At least one role must be selected')
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
      initialRoles: []
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
        initialRoles: values.initialRoles
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
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.userType}
              >
                <option value="master_admin">Master Admin</option>
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
          
// File: frontend/src/pages/users/UserCreate.js (continued)
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
                    rolesData?.map((role) => (
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
                    ))
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