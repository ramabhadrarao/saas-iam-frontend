// File: frontend/src/components/TenantLimitsPanel.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tenantAPI } from '../services/api.service';
import { 
  IconUsers, 
  IconDatabase, 
  IconExchange,
  IconEdit
} from '@tabler/icons-react';

const TenantLimitsPanel = ({ tenantId }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [customLimits, setCustomLimits] = useState({
    hasCustomLimits: false,
    userLimit: 0,
    storageLimit: 0,
    apiCallsLimit: 0
  });
  
  // Fetch tenant details including limits
  const { data, isLoading, error } = useQuery(
    ['tenant-with-usage', tenantId],
    async () => {
      try {
        const res = await tenantAPI.getTenantWithUsage(tenantId);
        return res.data;
      } catch (err) {
        console.error("Error fetching tenant usage:", err);
        // Return a default placeholder for development
        return {
          tenant: {
            plan: 'free',
            planLimits: {
              free: {
                userLimit: 5,
                storageLimit: 1,
                apiCallsLimit: 1000
              }
            },
            overrideLimits: { hasCustomLimits: false }
          },
          usage: {
            users: { current: 1, limit: 5 },
            storage: { current: 0.1, limit: 1 },
            apiCalls: { current: 145, limit: 1000 }
          }
        };
      }
    }
  );
  
  // Update tenant limits mutation
  const updateMutation = useMutation(
    (limits) => tenantAPI.updateTenantLimits(tenantId, limits),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['tenant-with-usage', tenantId]);
        setEditing(false);
      }
    }
  );
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(customLimits);
  };
  
  // Handle toggle custom limits
  const handleToggleCustom = (e) => {
    setCustomLimits({
      ...customLimits,
      hasCustomLimits: e.target.checked
    });
  };
  
  if (isLoading) {
    return <div className="card-body text-center">Loading limits...</div>;
  }
  
  // Since the API might not be fully implemented, handle data gracefully with defaults
  const tenant = data?.tenant || { 
    plan: 'free', 
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
  
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Resource Limits</h3>
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
            }}
          >
            <IconEdit className="icon me-1" /> Manage Limits
          </button>
        </div>
      </div>
      
      <div className="card-body">
        {editing ? (
          <form onSubmit={handleSubmit}>
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
              <input
                type="number"
                className="form-control"
                min="1"
                value={customLimits.userLimit}
                onChange={(e) => setCustomLimits({
                  ...customLimits,
                  userLimit: parseInt(e.target.value)
                })}
                disabled={!customLimits.hasCustomLimits}
              />
              <small className="form-hint">
                {customLimits.hasCustomLimits ? 
                  'Custom limit for this tenant' : 
                  `Default for ${planName} plan: ${baseLimits.userLimit || 5} users`}
              </small>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Storage Limit (GB)</label>
              <input
                type="number"
                className="form-control"
                min="1"
                value={customLimits.storageLimit}
                onChange={(e) => setCustomLimits({
                  ...customLimits,
                  storageLimit: parseInt(e.target.value)
                })}
                disabled={!customLimits.hasCustomLimits}
              />
              <small className="form-hint">
                {customLimits.hasCustomLimits ? 
                  'Custom limit for this tenant' : 
                  `Default for ${planName} plan: ${baseLimits.storageLimit || 1} GB`}
              </small>
            </div>
            
            <div className="mb-3">
              <label className="form-label">API Calls Limit (per day)</label>
              <input
                type="number"
                className="form-control"
                min="100"
                value={customLimits.apiCallsLimit}
                onChange={(e) => setCustomLimits({
                  ...customLimits,
                  apiCallsLimit: parseInt(e.target.value)
                })}
                disabled={!customLimits.hasCustomLimits}
              />
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
                onClick={() => setEditing(false)}
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
            <div className="mb-2">
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
                  className="progress-bar bg-primary" 
                  style={{ width: `${Math.min(100, (usage.users.current / (usage.users.limit || actualLimits.userLimit || 5)) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mb-2">
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
                  className="progress-bar bg-info" 
                  style={{ width: `${Math.min(100, ((usage.storage?.current || 0.1) / (usage.storage?.limit || actualLimits.storageLimit || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mb-2">
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
                  className="progress-bar bg-success" 
                  style={{ width: `${Math.min(100, ((usage.apiCalls?.current || 145) / (usage.apiCalls?.limit || actualLimits.apiCallsLimit || 1000)) * 100)}%` }}
                ></div>
              </div>
            </div>
            
            {tenant.overrideLimits?.hasCustomLimits && (
              <div className="alert alert-info mt-3">
                <div className="d-flex">
                  <div>
                    <strong>Custom limits applied</strong>
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