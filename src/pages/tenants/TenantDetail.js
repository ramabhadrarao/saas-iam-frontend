// File: frontend/src/pages/tenants/TenantDetail.js
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useFormik } from 'formik';
import TenantLimitsPanel from '../../components/TenantLimitsPanel';
import * as Yup from 'yup';
import { 
  IconBuildingSkyscraper, 
  IconWorld, 
  IconMail, 
  IconPhone,
  IconMapPin,
  IconUsers,
  IconPlayerPause,
  IconPlayerPlay,
  IconTrash
} from '@tabler/icons-react';
import { tenantAPI } from '../../services/api.service';

const TenantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionModal, setActionModal] = useState({
    show: false,
    type: null, // 'suspend', 'restore', 'delete'
  });
  
  // Fetch tenant data
  const { 
    data: tenantData, 
    isLoading: tenantLoading,
    error: tenantError 
  } = useQuery(
    ['tenant', id],
    async () => {
      const res = await tenantAPI.getTenantById(id);
      return res.data.tenant;
    }
  );
  
  // Fetch tenant metrics
  const { 
    data: metricsData, 
    isLoading: metricsLoading
  } = useQuery(
    ['tenant-metrics', id],
    async () => {
      const res = await tenantAPI.getTenantMetrics(id);
      return res.data.metrics;
    },
    {
      enabled: !!id
    }
  );
  
  // Update tenant mutation
  const updateMutation = useMutation(
    (data) => tenantAPI.updateTenant(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tenant', id]);
        queryClient.invalidateQueries('tenants');
      }
    }
  );
  
  // Suspend tenant mutation
  const suspendMutation = useMutation(
    () => tenantAPI.suspendTenant(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tenant', id]);
        queryClient.invalidateQueries('tenants');
        setActionModal({
          show: false,
          type: null,
        });
      }
    }
  );
  
  // Restore tenant mutation
  const restoreMutation = useMutation(
    () => tenantAPI.restoreTenant(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tenant', id]);
        queryClient.invalidateQueries('tenants');
        setActionModal({
          show: false,
          type: null,
        });
      }
    }
  );
  
  // Delete tenant mutation
  const deleteMutation = useMutation(
    () => tenantAPI.deleteTenant(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tenants');
        navigate('/tenants');
      }
    }
  );
  
  // Open action modal (suspend, restore, delete)
  const openActionModal = (type) => {
    setActionModal({
      show: true,
      type,
    });
  };
  
  // Close action modal
  const closeActionModal = () => {
    setActionModal({
      show: false,
      type: null,
    });
  };
  
  // Handle action confirmation
  const handleActionConfirm = () => {
    const { type } = actionModal;
    
    if (type === 'suspend') {
      suspendMutation.mutate();
    } else if (type === 'restore') {
      restoreMutation.mutate();
    } else if (type === 'delete') {
      deleteMutation.mutate();
    }
  };
  
  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required('Tenant name is required'),
    subdomain: Yup.string()
      .required('Subdomain is required')
      .matches(
        /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/,
        'Subdomain must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen'
      ),
    plan: Yup.string().required('Plan is required'),
    contactEmail: Yup.string().email('Invalid email address'),
    contactPhone: Yup.string(),
  });
  
  // Form setup
  const formik = useFormik({
    initialValues: {
      name: tenantData?.name || '',
      subdomain: tenantData?.subdomain || '',
      plan: tenantData?.plan || 'free',
      contactEmail: tenantData?.contactEmail || '',
      contactPhone: tenantData?.contactPhone || '',
      address: {
        street: tenantData?.address?.street || '',
        city: tenantData?.address?.city || '',
        state: tenantData?.address?.state || '',
        zipCode: tenantData?.address?.zipCode || '',
        country: tenantData?.address?.country || '',
      },
    },
    validationSchema,
    onSubmit: (values) => {
      updateMutation.mutate(values);
    },
    enableReinitialize: true,
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  if (tenantLoading) {
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
  
  if (tenantError) {
    return (
      <div className="card">
        <div className="card-body text-center text-danger">
          Error loading tenant data
        </div>
      </div>
    );
  }
  
  return (
    <div className="row">
      <div className="col-md-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Tenant Information</h3>
            <div className="card-actions">
              {tenantData.isActive ? (
                <button 
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => openActionModal('suspend')}
                >
                  <IconPlayerPause className="icon me-1" />
                  Suspend
                </button>
              ) : (
                <button 
                  className="btn btn-success btn-sm me-2"
                  onClick={() => openActionModal('restore')}
                >
                  <IconPlayerPlay className="icon me-1" />
                  Restore
                </button>
              )}
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => openActionModal('delete')}
              >
                <IconTrash className="icon me-1" />
                Delete
              </button>
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
                  the tenant <strong>{tenantData.name}</strong>?
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
          
          <form onSubmit={formik.handleSubmit}>
            <div className="card-body">
              {updateMutation.isError && (
                <div className="alert alert-danger" role="alert">
                  {updateMutation.error.response?.data?.message || 'Error updating tenant'}
                </div>
              )}
              
              {updateMutation.isSuccess && (
                <div className="alert alert-success" role="alert">
                  Tenant updated successfully
                </div>
              )}
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label required">Tenant Name</label>
                    <div className="input-icon">
                      <span className="input-icon-addon">
                        <IconBuildingSkyscraper size={16} />
                      </span>
                      <input
                        type="text"
                        className={`form-control ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''}`}
                        placeholder="Tenant name"
                        id="name"
                        name="name"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.name}
                      />
                    </div>
                    {formik.touched.name && formik.errors.name && (
                      <div className="invalid-feedback d-block">{formik.errors.name}</div>
                    )}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label required">Subdomain</label>
                    <div className="input-icon">
                      <span className="input-icon-addon">
                        <IconWorld size={16} />
                      </span>
                      <input
                        type="text"
                        className={`form-control ${formik.touched.subdomain && formik.errors.subdomain ? 'is-invalid' : ''}`}
                        placeholder="Subdomain"
                        id="subdomain"
                        name="subdomain"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.subdomain}
                      />
                    </div>
                    {formik.touched.subdomain && formik.errors.subdomain && (
                      <div className="invalid-feedback d-block">{formik.errors.subdomain}</div>
                    )}
                    <small className="form-hint">
                      Access URL: {formik.values.subdomain}.example.com
                    </small>
                  </div>
                </div>
                
                <div className="col-md-6">
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
                    <label className="form-label">Status</label>
                    <div className="form-control-plaintext">
                      {tenantData.isActive ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-danger">Suspended</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <h4 className="mb-3">Contact Information</h4>
              
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Contact Email</label>
                    <div className="input-icon">
                      <span className="input-icon-addon">
                        <IconMail size={16} />
                      </span>
                      <input
                        type="email"
                        className={`form-control ${formik.touched.contactEmail && formik.errors.contactEmail ? 'is-invalid' : ''}`}
                        placeholder="Contact email"
                        id="contactEmail"
                        name="contactEmail"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.contactEmail}
                      />
                    </div>
                    {formik.touched.contactEmail && formik.errors.contactEmail && (
                      <div className="invalid-feedback d-block">{formik.errors.contactEmail}</div>
                    )}
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Contact Phone</label>
                    <div className="input-icon">
                      <span className="input-icon-addon">
                        <IconPhone size={16} />
                      </span>
                      <input
                        type="text"
                        className={`form-control ${formik.touched.contactPhone && formik.errors.contactPhone ? 'is-invalid' : ''}`}
                        placeholder="Contact phone"
                        id="contactPhone"
                        name="contactPhone"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.contactPhone}
                      />
                    </div>
                    {formik.touched.contactPhone && formik.errors.contactPhone && (
                      <div className="invalid-feedback d-block">{formik.errors.contactPhone}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">Address</label>
                <div className="input-icon mb-2">
                  <span className="input-icon-addon">
                    <IconMapPin size={16} />
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Street"
                    id="address.street"
                    name="address.street"
                    onChange={formik.handleChange}
                    value={formik.values.address.street}
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-2">
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
                  <div className="col-md-6 mb-2">
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
                  <div className="col-md-6 mb-2">
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
                  <div className="col-md-6 mb-2">
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
              
              <div className="row mt-4">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Created Date</label>
                    <div className="form-control-plaintext">
                      {formatDate(tenantData.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Created By</label>
                    <div className="form-control-plaintext">
                      {tenantData.createdBy ? `${tenantData.createdBy.firstName} ${tenantData.createdBy.lastName}` : 'System'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-footer text-end">
              <button 
                type="button" 
                className="btn btn-link" 
                onClick={() => navigate('/tenants')}
              >
                Back to Tenants
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
        {/* User Limits Panel */}
        <div className="mb-3">
          <TenantLimitsPanel tenantId={id} />
        </div>
        
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">
              <IconUsers className="icon me-2" />
              User Statistics
            </h3>
          </div>
          <div className="card-body">
            {metricsLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="d-flex align-items-center mb-3">
                  <div className="flex-fill">Total Users</div>
                  <div>
                    <span className="h3 mb-0">{metricsData?.userStats?.total || 0}</span>
                  </div>
                </div>
                
                <div className="progress mb-3">
                  <div 
                    className="progress-bar bg-primary" 
                    style={{ width: `${(metricsData?.userStats?.admins / metricsData?.userStats?.total) * 100 || 0}%` }}
                  ></div>
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${(metricsData?.userStats?.users / metricsData?.userStats?.total) * 100 || 0}%` }}
                  ></div>
                </div>
                
                <div className="row text-center">
                  <div className="col">
                    <div className="text-muted">Admins</div>
                    <strong>{metricsData?.userStats?.admins || 0}</strong>
                  </div>
                  <div className="col">
                    <div className="text-muted">Users</div>
                    <strong>{metricsData?.userStats?.users || 0}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent User Activity</h3>
          </div>
          <div className="card-body p-0">
            {metricsLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : metricsData?.recentActivity?.length > 0 ? (
              <div className="list-group list-group-flush">
                {metricsData.recentActivity.map((user) => (
                  <div key={user._id} className="list-group-item">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <span className="avatar">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="col">
                        <div className="d-block text-truncate">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-muted text-truncate mt-n1">
                          {user.email}
                        </div>
                      </div>
                      <div className="col-auto">
                        <div className="text-muted">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3">
                <span className="text-muted">No recent activity</span>
              </div>
            )}
          </div>
          <div className="card-footer">
            <div className="text-center">
              <Link to="/users" className="btn btn-link">View All Users</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDetail;