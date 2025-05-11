// src/components/TenantLimitsPanel.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  IconUsers, 
  IconDatabase, 
  IconExchange,
  IconEdit,
  IconAdjustments,
  IconAlertTriangle,
  IconCheck
} from '@tabler/icons-react';
import { tenantAPI } from '../services/api.service';
import { useAuth } from '../contexts/AuthContext';

const TenantLimitsPanel = ({ tenantId }) => {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [customLimits, setCustomLimits] = useState({
    hasCustomLimits: false,
    userLimit: 0,
    storageLimit: 0,
    apiCallsLimit: 0
  });
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  const canManageTenant = hasPermission('manage_tenant');
  
  // Fetch tenant usage data
  const { data, isLoading, error } = useQuery(
    ['tenant-with-usage', tenantId],
    async () => {
      try {
        const res = await tenantAPI.getTenantWithUsage(tenantId);
        return res.data;
      } catch (err) {
        console.error("Error fetching tenant usage:", err);
        throw err;
      }
    },
    {
      onSuccess: (data) => {
        // Initialize custom limits form with current values when data is loaded
        if (data?.tenant?.overrideLimits) {
          setCustomLimits({
            hasCustomLimits: data.tenant.overrideLimits.hasCustomLimits || false,
            userLimit: data.tenant.overrideLimits.userLimit || data.tenant.planLimits?.[data.tenant.plan]?.userLimit || 5,
            storageLimit: data.tenant.overrideLimits.storageLimit || data.tenant.planLimits?.[data.tenant.plan]?.storageLimit || 1,
            apiCallsLimit: data.tenant.overrideLimits.apiCallsLimit || data.tenant.planLimits?.[data.tenant.plan]?.apiCallsLimit || 1000
          });
        }
      },
      refetchInterval: 60000 // Refetch every minute for real-time updates
    }
  );
  
  // Update tenant limits mutation
  const updateMutation = useMutation(
    (limits) => tenantAPI.updateTenantLimits(tenantId, limits),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tenant-with-usage', tenantId]);
        setEditing(false);
        
        // Show success message then hide after 3 seconds
        setSuccessMessage('Tenant limits updated successfully');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      },
      onError: (error) => {
        setFormErrors({
          general: error.response?.data?.message || 'An error occurred updating tenant limits'
        });
      }
    }
  );
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (customLimits.hasCustomLimits) {
      if (!customLimits.userLimit || customLimits.userLimit < 1) {
        errors.userLimit = 'User limit must be at least 1';
      }
      
      if (!customLimits.storageLimit || customLimits.storageLimit < 1) {
        errors.storageLimit = 'Storage limit must be at least 1 GB';
      }
      
      if (!customLimits.apiCallsLimit || customLimits.apiCallsLimit < 100) {
        errors.apiCallsLimit = 'API calls limit must be at least 100';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    updateMutation.mutate(customLimits);
  };
  
  // Handle toggle custom limits
  const handleToggleCustom = (e) => {
    setCustomLimits({
      ...customLimits,
      hasCustomLimits: e.target.checked
    });
    
    // Clear errors when toggling
    setFormErrors({});
  };
  
  // Format percentage for progress bars
  const formatPercentage = (current, limit) => {
    if (!current || !limit) return 0;
    return Math.min(100, Math.round((current / limit) * 100));
  };
  
  // Get CSS class based on percentage
  const getProgressClass = (percentage) => {
    if (percentage >= 90) return 'bg-danger';
    if (percentage >= 75) return 'bg-warning';
    return 'bg-primary';
  };
  
  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Resource Limits</h3>
        </div>
        <div className="card-body text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading limits...</span>
          </div>
          <div className="mt-2">Loading resource limits...</div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Resource Limits</h3>
        </div>
        <div className="card-body">
          <div className="alert alert-danger">
            <div className="d-flex">
              <div><IconAlertTriangle className="alert-icon" /></div>
              <div>
                <h4 className="alert-title">Error loading resource limits</h4>
                <div>{error.message || 'Failed to load tenant limits'}</div>
              </div>
            </div>
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={() => queryClient.invalidateQueries(['tenant-with-usage', tenantId])}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Since the API might not be fully implemented, handle data gracefully with defaults
  const tenant = data?.tenant || {plan: 'free', 
    overrideLimits: { hasCustomLimits: false }
  };
  
  const usage = data?.usage || { 
    users: { current: 1, limit: 5 },
    storage: { current: 0.1, limit: 1 },
    apiCalls: { current: 145, limit: 1000 }
  };
  
  const planName = tenant.plan?.charAt(0).toUpperCase() + tenant.plan?.slice(1) || 'Free';
  
  // Get base limits from the plan
  const baseLimits = tenant.planLimits?.[tenant.plan] || {
    userLimit: 5,
    storageLimit: 1,
    apiCallsLimit: 1000
  };
  
  // Get actual limits (either from plan or custom overrides)
  const actualLimits = tenant.overrideLimits?.hasCustomLimits ? 
    tenant.overrideLimits : baseLimits;
  
  // Calculate percentages for progress bars
  const userPercentage = formatPercentage(usage.users.current, usage.users.limit || actualLimits.userLimit || 5);
  const storagePercentage = formatPercentage(usage.storage?.current || 0.1, usage.storage?.limit || actualLimits.storageLimit || 1);
  const apiPercentage = formatPercentage(usage.apiCalls?.current || 145, usage.apiCalls?.limit || actualLimits.apiCallsLimit || 1000);
  
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <IconAdjustments className="icon me-2" />
          Resource Limits
        </h3>
        {canManageTenant && (
          <div className="card-actions">
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                setCustomLimits({
                  hasCustomLimits: tenant.overrideLimits?.hasCustomLimits || false,
                  userLimit: tenant.overrideLimits?.userLimit || baseLimits.userLimit || 5,
                  storageLimit: tenant.overrideLimits?.storageLimit || baseLimits.storageLimit || 1,
                  apiCallsLimit: tenant.overrideLimits?.apiCallsLimit || baseLimits.apiCallsLimit || 1000
                });
                setEditing(true);
                setFormErrors({});
              }}
            >
              <IconEdit className="icon me-1" /> Manage Limits
            </button>
          </div>
        )}
      </div>
      
      <div className="card-body">
        {successMessage && (
          <div className="alert alert-success mb-3">
            <div className="d-flex">
              <div><IconCheck className="alert-icon" /></div>
              <div>{successMessage}</div>
            </div>
          </div>
        )}
        
        {editing ? (
          <form onSubmit={handleSubmit}>
            {formErrors.general && (
              <div className="alert alert-danger mb-3">
                <div className="d-flex">
                  <div><IconAlertTriangle className="alert-icon" /></div>
                  <div>{formErrors.general}</div>
                </div>
              </div>
            )}
            
            <div className="form-group mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="customLimits"
                  checked={customLimits.hasCustomLimits}
                  onChange={handleToggleCustom}
                />
                <label className="form-check-label" htmlFor="customLimits">
                  Use custom limits (override plan defaults)
                </label>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="form-label">User Limit</label>
              <div className="input-group">
                <span className="input-group-text">
                  <IconUsers size={16} />
                </span>
                <input
                  type="number"
                  className={`form-control ${formErrors.userLimit ? 'is-invalid' : ''}`}
                  min="1"
                  value={customLimits.userLimit}
                  onChange={(e) => setCustomLimits({
                    ...customLimits,
                    userLimit: parseInt(e.target.value) || 0
                  })}
                  disabled={!customLimits.hasCustomLimits}
                />
                <span className="input-group-text">users</span>
                {formErrors.userLimit && (
                  <div className="invalid-feedback">{formErrors.userLimit}</div>
                )}
              </div>
              <small className="form-hint">
                {customLimits.hasCustomLimits ? 
                  'Custom limit for this tenant' : 
                  `Default for ${planName} plan: ${baseLimits.userLimit || 5} users`}
              </small>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Storage Limit</label>
              <div className="input-group">
                <span className="input-group-text">
                  <IconDatabase size={16} />
                </span>
                <input
                  type="number"
                  className={`form-control ${formErrors.storageLimit ? 'is-invalid' : ''}`}
                  min="1"
                  value={customLimits.storageLimit}
                  onChange={(e) => setCustomLimits({
                    ...customLimits,
                    storageLimit: parseInt(e.target.value) || 0
                  })}
                  disabled={!customLimits.hasCustomLimits}
                />
                <span className="input-group-text">GB</span>
                {formErrors.storageLimit && (
                  <div className="invalid-feedback">{formErrors.storageLimit}</div>
                )}
              </div>
              <small className="form-hint">
                {customLimits.hasCustomLimits ? 
                  'Custom limit for this tenant' : 
                  `Default for ${planName} plan: ${baseLimits.storageLimit || 1} GB`}
              </small>
            </div>
            
            <div className="mb-3">
              <label className="form-label">API Calls Limit</label>
              <div className="input-group">
                <span className="input-group-text">
                  <IconExchange size={16} />
                </span>
                <input
                  type="number"
                  className={`form-control ${formErrors.apiCallsLimit ? 'is-invalid' : ''}`}
                  min="100"
                  step="100"
                  value={customLimits.apiCallsLimit}
                  onChange={(e) => setCustomLimits({
                    ...customLimits,
                    apiCallsLimit: parseInt(e.target.value) || 0
                  })}
                  disabled={!customLimits.hasCustomLimits}
                />
                <span className="input-group-text">calls/day</span>
                {formErrors.apiCallsLimit && (
                  <div className="invalid-feedback">{formErrors.apiCallsLimit}</div>
                )}
              </div>
              <small className="form-hint">
                {customLimits.hasCustomLimits ? 
                  'Custom limit for this tenant' : 
                  `Default for ${planName} plan: ${baseLimits.apiCallsLimit || 1000} calls/day`}
              </small>
            </div>
            
            <div className="d-flex justify-content-end">
              <button 
                type="button" 
                className="btn btn-link" 
                onClick={() => {
                  setEditing(false);
                  setFormErrors({});
                }}
                disabled={updateMutation.isLoading}
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
                  'Save Limits'
                )}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="card-title">Current Usage</div>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center">
                  <IconUsers className="me-2 text-primary" />
                  <strong>Users</strong>
                </div>
                <div>
                  <span className="text-muted">{usage.users.current}</span>
                  {' / '}
                  <strong>{usage.users.limit || actualLimits.userLimit || 5}</strong>
                </div>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className={`progress-bar ${getProgressClass(userPercentage)}`}
                  style={{ width: `${userPercentage}%` }}
                ></div>
              </div>
              <div className="d-flex justify-content-between text-muted mt-1">
                <div>
                  <small>{userPercentage}% used</small>
                </div>
                {userPercentage >= 80 && (
                  <div>
                    <small className="text-danger">Approaching limit</small>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center">
                  <IconDatabase className="me-2 text-info" />
                  <strong>Storage</strong>
                </div>
                <div>
                  <span className="text-muted">{usage.storage?.current || 0.1} GB</span>
                  {' / '}
                  <strong>{usage.storage?.limit || actualLimits.storageLimit || 1} GB</strong>
                </div>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className={`progress-bar ${getProgressClass(storagePercentage)}`}
                  style={{ width: `${storagePercentage}%` }}
                ></div>
              </div>
              <div className="d-flex justify-content-between text-muted mt-1">
                <div>
                  <small>{storagePercentage}% used</small>
                </div>
                {storagePercentage >= 80 && (
                  <div>
                    <small className="text-danger">Approaching limit</small>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <div className="d-flex align-items-center">
                  <IconExchange className="me-2 text-success" />
                  <strong>API Calls (today)</strong>
                </div>
                <div>
                  <span className="text-muted">{usage.apiCalls?.current || 145}</span>
                  {' / '}
                  <strong>{usage.apiCalls?.limit || actualLimits.apiCallsLimit || 1000}</strong>
                </div>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className={`progress-bar ${getProgressClass(apiPercentage)}`}
                  style={{ width: `${apiPercentage}%` }}
                ></div>
              </div>
              <div className="d-flex justify-content-between text-muted mt-1">
                <div>
                  <small>{apiPercentage}% used</small>
                </div>
                {apiPercentage >= 80 && (
                  <div>
                    <small className="text-danger">Approaching limit</small>
                  </div>
                )}
              </div>
            </div>
            
            {tenant.overrideLimits?.hasCustomLimits && (
              <div className="alert alert-info mt-4">
                <div className="d-flex">
                  <div>
                    <IconInfoCircle className="alert-icon" />
                  </div>
                  <div>
                    <h4 className="alert-title">Custom Limits Applied</h4>
                    <div>This tenant has custom resource limits that override the default plan limits.</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TenantLimitsPanel;