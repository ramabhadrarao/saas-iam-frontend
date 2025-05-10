// File: frontend/src/pages/users/UserDetail.js
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { IconUserCheck, IconUserX } from '@tabler/icons-react';
import { userAPI, roleAPI } from '../../services/api.service';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRoles, setSelectedRoles] = useState([]);
  
  // Fetch user data
  const { 
    data: userData, 
    isLoading: userLoading,
    error: userError 
  } = useQuery(
    ['user', id],
    async () => {
      const res = await userAPI.getUserById(id);
      return res.data.user;
    }
  );
  
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
  
  // Initialize selected roles when user data is loaded
  React.useEffect(() => {
    if (userData && userData.roles) {
      setSelectedRoles(userData.roles.map(role => role._id));
    }
  }, [userData]);
  
  // Update user mutation
  const updateMutation = useMutation(
    (userData) => userAPI.updateUser(id, userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', id]);
        queryClient.invalidateQueries('users');
      }
    }
  );
  
  // Assign role mutation
  const assignRoleMutation = useMutation(
    ({ userId, roleId }) => userAPI.assignRole(userId, roleId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', id]);
      }
    }
  );
  
  // Remove role mutation
  const removeRoleMutation = useMutation(
    ({ userId, roleId }) => userAPI.removeRole(userId, roleId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user', id]);
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
      .required('Email is required')
  });
  
  // Form setup
  const formik = useFormik({
    initialValues: {
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      email: userData?.email || '',
      isActive: userData?.isActive ?? true
    },
    validationSchema,
    onSubmit: (values) => {
      updateMutation.mutate(values);
    },
    enableReinitialize: true
  });
  
  // Handle role selection
  const handleRoleChange = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      // Remove role
      removeRoleMutation.mutate({ userId: id, roleId });
      setSelectedRoles(selectedRoles.filter(id => id !== roleId));
    } else {
      // Add role
      assignRoleMutation.mutate({ userId: id, roleId });
      setSelectedRoles([...selectedRoles, roleId]);
    }
  };
  
  if (userLoading || rolesLoading) {
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
  
  if (userError) {
    return (
      <div className="card">
        <div className="card-body text-center text-danger">
          Error loading user data
        </div>
      </div>
    );
  }
  
  return (
    <div className="row">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">User Information</h3>
          </div>
          
          <form onSubmit={formik.handleSubmit}>
            <div className="card-body">
              {updateMutation.isError && (
                <div className="alert alert-danger" role="alert">
                  {updateMutation.error.response?.data?.message || 'Error updating user'}
                </div>
              )}
              
              {updateMutation.isSuccess && (
                <div className="alert alert-success" role="alert">
                  User updated successfully
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
              
              <div className="mb-3">
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
                    <span className="form-selectgroup-label">
                      <IconUserCheck className="icon me-2" />
                      Active
                    </span>
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
                    <span className="form-selectgroup-label">
                      <IconUserX className="icon me-2" />
                      Inactive
                    </span>
                  </label>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">User Type</label>
                <input
                  type="text"
                  className="form-control"
                  value={userData?.userType?.replace('_', ' ') || ''}
                  readOnly
                  disabled
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Last Login</label>
                <input
                  type="text"
                  className="form-control"
                  value={userData?.lastLogin ? new Date(userData.lastLogin).toLocaleString() : 'Never'}
                  readOnly
                  disabled
                />
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
                disabled={updateMutation.isLoading}
              >
                {updateMutation.isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="col-md-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Assigned Roles</h3>
          </div>
          
          <div className="card-body p-0">
            <div className="list-group list-group-flush">
              {rolesData?.map((role) => (
                <div key={role._id} className="list-group-item">
                  <div className="row align-items-center">
                    <div className="col-auto">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id={`role-${role._id}`}
                        checked={selectedRoles.includes(role._id)}
                        onChange={() => handleRoleChange(role._id)}
                        disabled={assignRoleMutation.isLoading || removeRoleMutation.isLoading}
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetail;