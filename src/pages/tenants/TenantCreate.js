// File: frontend/src/pages/tenants/TenantCreate.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { tenantAPI } from '../../services/api.service';

const TenantCreate = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createAdmin, setCreateAdmin] = useState(true);
  
  // Create tenant mutation
  const createMutation = useMutation(
    (tenantData) => tenantAPI.createTenant(tenantData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('tenants');
        navigate(`/tenants/${data.data.tenant.id}`);
      }
    }
  );
  
  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Tenant name is required')
      .min(3, 'Tenant name must be at least 3 characters'),
    subdomain: Yup.string()
      .required('Subdomain is required')
      .min(3, 'Subdomain must be at least 3 characters')
      .matches(
        /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
        'Subdomain must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen'
      ),
    plan: Yup.string().required('Plan is required'),
    contactEmail: Yup.string().email('Invalid email address'),
    contactPhone: Yup.string(),
    address: Yup.object().shape({
      street: Yup.string(),
      city: Yup.string(),
      state: Yup.string(),
      zipCode: Yup.string(),
      country: Yup.string(),
    }),
    adminEmail: Yup.string()
      .when('createAdmin', {
        is: true,
        then: () => Yup.string()
          .required('Admin email is required')
          .email('Invalid email address')
      }),
    adminPassword: Yup.string()
      .when('createAdmin', {
        is: true,
        then: () => Yup.string()
          .required('Admin password is required')
          .min(8, 'Password must be at least 8 characters')
          .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
          )
      }),
    adminFirstName: Yup.string()
      .when('createAdmin', {
        is: true,
        then: () => Yup.string().required('Admin first name is required')
      }),
    adminLastName: Yup.string()
      .when('createAdmin', {
        is: true,
        then: () => Yup.string().required('Admin last name is required')
      })
  });
  
  // Initial form values
  const initialValues = {
    name: '',
    subdomain: '',
    plan: 'free',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: ''
  };
  
  // Form setup
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: (values) => {
      // Prepare tenant data
      const tenantData = {
        name: values.name,
        subdomain: values.subdomain,
        plan: values.plan,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone,
        address: values.address
      };
      
      // Add admin data if creating admin
      if (createAdmin) {
        tenantData.adminEmail = values.adminEmail;
        tenantData.adminPassword = values.adminPassword;
        tenantData.adminFirstName = values.adminFirstName;
        tenantData.adminLastName = values.adminLastName;
      }
      
      // Submit to API
      createMutation.mutate(tenantData);
    }
  });
  
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Create New Tenant</h3>
      </div>
      
      <form onSubmit={formik.handleSubmit}>
        <div className="card-body">
          {createMutation.isError && (
            <div className="alert alert-danger" role="alert">
              {createMutation.error.response?.data?.message || 'Error creating tenant'}
            </div>
          )}
          
          <div className="row">
            <div className="col-md-6">
              <h4 className="mb-4">Tenant Information</h4>
              
              <div className="mb-3">
                <label className="form-label required">Tenant Name</label>
                <input
                  type="text"
                  className={`form-control ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''}`}
                  placeholder="Acme Inc."
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
              
              <div className="mb-3">
                <label className="form-label required">Subdomain</label>
                <div className="input-group">
                  <input
                    type="text"
                    className={`form-control ${formik.touched.subdomain && formik.errors.subdomain ? 'is-invalid' : ''}`}
                    placeholder="acme"
                    id="subdomain"
                    name="subdomain"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.subdomain}
                  />
                  <span className="input-group-text">.example.com</span>
                  {formik.touched.subdomain && formik.errors.subdomain && (
                    <div className="invalid-feedback">{formik.errors.subdomain}</div>
                  )}
                </div>
                <small className="form-hint">
                  This will be used for tenant-specific access URL
                </small>
              </div>
              
              <div className="mb-3">
                <label className="form-label required">Subscription Plan</label>
                <select
                  className={`form-select ${formik.touched.plan && formik.errors.plan ? 'is-invalid' : ''}`}
                  id="plan"
                  name="plan"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.plan}
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
                {formik.touched.plan && formik.errors.plan && (
                  <div className="invalid-feedback">{formik.errors.plan}</div>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className={`form-control ${formik.touched.contactEmail && formik.errors.contactEmail ? 'is-invalid' : ''}`}
                  placeholder="contact@acme.com"
                  id="contactEmail"
                  name="contactEmail"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.contactEmail}
                />
                {formik.touched.contactEmail && formik.errors.contactEmail && (
                  <div className="invalid-feedback">{formik.errors.contactEmail}</div>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label">Contact Phone</label>
                <input
                  type="text"
                  className={`form-control ${formik.touched.contactPhone && formik.errors.contactPhone ? 'is-invalid' : ''}`}
                  placeholder="+1 (123) 456-7890"
                  id="contactPhone"
                  name="contactPhone"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.contactPhone}
                />
                {formik.touched.contactPhone && formik.errors.contactPhone && (
                  <div className="invalid-feedback">{formik.errors.contactPhone}</div>
                )}
              </div>
              
              <div className="mb-3">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Street"
                  id="address.street"
                  name="address.street"
                  onChange={formik.handleChange}
                  value={formik.values.address.street}
                />
                <div className="row">
                  <div className="col-6 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="City"
                      id="address.city"
                      name="address.city"
                      onChange={formik.handleChange}
                      value={formik.values.address.city}
                    />
                  </div>
                  <div className="col-6 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="State/Province"
                      id="address.state"
                      name="address.state"
                      onChange={formik.handleChange}
                      value={formik.values.address.state}
                    />
                  </div>
                </div>
                <div className="row">
                  <div className="col-6 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Zip/Postal Code"
                      id="address.zipCode"
                      name="address.zipCode"
                      onChange={formik.handleChange}
                      value={formik.values.address.zipCode}
                    />
                  </div>
                  <div className="col-6 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Country"
                      id="address.country"
                      name="address.country"
                      onChange={formik.handleChange}
                      value={formik.values.address.country}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>Tenant Admin</h4>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="createAdmin"
                    checked={createAdmin}
                    onChange={() => setCreateAdmin(!createAdmin)}
                  />
                  <label className="form-check-label" htmlFor="createAdmin">
                    Create Admin User
                  </label>
                </div>
              </div>
              
              {createAdmin && (
                <>
                  <div className="mb-3">
                    <label className="form-label required">Email</label>
                    <input
                      type="email"
                      className={`form-control ${formik.touched.adminEmail && formik.errors.adminEmail ? 'is-invalid' : ''}`}
                      placeholder="admin@acme.com"
                      id="adminEmail"
                      name="adminEmail"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.adminEmail}
                    />
                    {formik.touched.adminEmail && formik.errors.adminEmail && (
                      <div className="invalid-feedback">{formik.errors.adminEmail}</div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label required">Password</label>
                    <input
                      type="password"
                      className={`form-control ${formik.touched.adminPassword && formik.errors.adminPassword ? 'is-invalid' : ''}`}
                      placeholder="••••••••"
                      id="adminPassword"
                      name="adminPassword"
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      value={formik.values.adminPassword}
                    />
                    {formik.touched.adminPassword && formik.errors.adminPassword && (
                      <div className="invalid-feedback">{formik.errors.adminPassword}</div>
                    )}
                    <small className="form-hint">
                      Password must be at least 8 characters with uppercase, lowercase, number, and special character
                    </small>
                  </div>
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label required">First Name</label>
                      <input
                        type="text"
                        className={`form-control ${formik.touched.adminFirstName && formik.errors.adminFirstName ? 'is-invalid' : ''}`}
                        placeholder="First name"
                        id="adminFirstName"
                        name="adminFirstName"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.adminFirstName}
                      />
                      {formik.touched.adminFirstName && formik.errors.adminFirstName && (
                        <div className="invalid-feedback">{formik.errors.adminFirstName}</div>
                      )}
                    </div>
                    
                    <div className="col-md-6">
                      <label className="form-label required">Last Name</label>
                      <input
                        type="text"
                        className={`form-control ${formik.touched.adminLastName && formik.errors.adminLastName ? 'is-invalid' : ''}`}
                        placeholder="Last name"
                        id="adminLastName"
                        name="adminLastName"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.adminLastName}
                      />
                      {formik.touched.adminLastName && formik.errors.adminLastName && (
                        <div className="invalid-feedback">{formik.errors.adminLastName}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="alert alert-info mt-4" role="alert">
                    <h4 className="alert-heading">Tenant Admin Access</h4>
                    <p>
                      The tenant admin will have full management access to this tenant. They will be able to:
                    </p>
                    <ul>
                      <li>Manage users within the tenant</li>
                      <li>Configure tenant-specific settings</li>
                      <li>Access all tenant features based on the subscription plan</li>
                    </ul>
                    <p className="mb-0">
                      An email with login instructions will be sent to the admin email address.
                    </p>
                  </div>
                </>
              )}
              
              {!createAdmin && (
                <div className="alert alert-warning" role="alert">
                  <h4 className="alert-heading">No Admin User</h4>
                  <p>
                    You've chosen not to create an admin user for this tenant. You'll need to manually assign users to this tenant later.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="card-footer text-end">
          <button 
            type="button" 
            className="btn btn-link" 
            onClick={() => navigate('/tenants')}
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
              'Create Tenant'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TenantCreate;