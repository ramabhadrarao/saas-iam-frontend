// src/pages/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  IconUsers, 
  IconActivity,
  IconShieldLock,
  IconAlertTriangle,
  IconArrowUpRight,
  IconArrowDownRight,
  IconBuildingSkyscraper
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../services/dashboard.service';

// Import widgets
import AuditLogWidget from '../../components/dashboard/AuditLogWidget';
import SystemHealthWidget from '../../components/dashboard/SystemHealthWidget';
import SecurityMetricsWidget from '../../components/dashboard/SecurityMetricsWidget';
import TenantComparisonWidget from '../../components/dashboard/TenantComparisonWidget';

// Custom metric card component
const MetricCard = ({ title, value, icon, change, changeType, suffix = '', tooltip }) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex align-items-center mb-3">
          <div className="subheader">{title}</div>
          {tooltip && (
            <div className="ms-auto" title={tooltip}>
              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-info-circle" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path>
                <path d="M12 8l.01 0"></path>
                <path d="M11 12l1 0l0 4l1 0"></path>
              </svg>
            </div>
          )}
        </div>
        <div className="d-flex align-items-baseline">
          <div className="h1 mb-0 me-2">{value}{suffix}</div>
          {change !== undefined && (
            <div className={`me-2 ${changeType === 'increase' ? 'text-green' : 'text-red'}`}>
              <span className="text-nowrap d-inline-flex align-items-center">
                {changeType === 'increase' ? (
                  <IconArrowUpRight size={16} className="me-1" />
                ) : (
                  <IconArrowDownRight size={16} className="me-1" />
                )}
                {change}%
              </span>
            </div>
          )}
          <div className="ms-auto">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, isMasterAdmin, hasPermission } = useAuth();

  // Fetch dashboard metrics
  const { 
    data: dashboardData, 
    isLoading, 
    error 
  } = useQuery(
    'dashboard-metrics',
    () => dashboardAPI.getMetrics(),
    {
      refetchInterval: 300000, // Refetch every 5 minutes
      staleTime: 60000 // Consider data stale after 1 minute
    }
  );

  // Extract metrics data
  const metricsData = dashboardData?.data || {};

  // Format numbers for display
  const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (isLoading) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <div className="mt-3">Loading dashboard data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="card">
            <div className="card-body text-center py-5">
              <div className="text-danger mb-3">
                <IconAlertTriangle size={40} />
              </div>
              <h3 className="text-danger">Failed to load dashboard data</h3>
              <div className="mt-3">
                <p>{error.message || 'An error occurred while loading dashboard data'}</p>
                <button 
                  className="btn btn-outline-danger"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-body">
      <div className="container-xl">
        {/* Page header */}
        <div className="page-header d-print-none">
          <div className="row align-items-center">
            <div className="col">
              <h2 className="page-title">Dashboard</h2>
              <div className="text-muted mt-1">
                {isMasterAdmin 
                  ? 'Master Administration Dashboard'
                  : `${user?.tenant?.name} Tenant Dashboard`}
              </div>
            </div>
          </div>
        </div>
        
        {/* Key metrics row */}
        <div className="row row-deck row-cards mb-4">
          <div className="col-sm-6 col-lg-3">
            <MetricCard
              title="Total Users"
              value={formatNumber(metricsData.totalUsers)}
              icon={<IconUsers size={24} stroke={1.5} className="text-primary" />}
              change={metricsData.userGrowth}
              changeType="increase"
              tooltip="Total number of active users in the system"
            />
          </div>
          
          <div className="col-sm-6 col-lg-3">
            <MetricCard
              title="Active Sessions"
              value={formatNumber(metricsData.activeSessions)}
              icon={<IconActivity size={24} stroke={1.5} className="text-green" />}
              change={metricsData.sessionIncrease}
              changeType={metricsData.sessionIncrease >= 0 ? "increase" : "decrease"}
              tooltip="Number of active user sessions in the last 24 hours"
            />
          </div>
          
          <div className="col-sm-6 col-lg-3">
            <MetricCard
              title={isMasterAdmin ? "Custom Roles" : "Assigned Roles"}
              value={formatNumber(metricsData.customRoles)}
              icon={<IconShieldLock size={24} stroke={1.5} className="text-purple" />}
              tooltip="Number of user-defined roles in the system"
            />
          </div>
          
          <div className="col-sm-6 col-lg-3">
            <MetricCard
              title="Failed Logins"
              value={formatNumber(metricsData.failedLogins)}
              icon={<IconAlertTriangle size={24} stroke={1.5} className="text-orange" />}
              change={Math.abs(metricsData.failedLoginIncrease)}
              changeType={metricsData.failedLoginIncrease <= 0 ? "increase" : "decrease"}
              tooltip="Number of failed login attempts in the last 24 hours"
            />
          </div>
        </div>
        
        {/* Main dashboard content */}
        <div className="row row-deck row-cards">
          {/* Audit logs and security metrics - left column */}
          <div className="col-md-6">
            {/* Audit Logs Widget */}
            <div className="mb-4">
              <AuditLogWidget limit={5} />
            </div>
            
            {/* Security Metrics Widget - only for master admins or users with permission */}
            {(isMasterAdmin || hasPermission('read_dashboard')) && (
              <div className="mb-4">
                <SecurityMetricsWidget />
              </div>
            )}
          </div>
          
          {/* System health and tenant comparison - right column */}
          <div className="col-md-6">
            {/* System Health Widget - only for master admins */}
            {isMasterAdmin && (
              <div className="mb-4">
                <SystemHealthWidget />
              </div>
            )}
            
            {/* Tenant Comparison Widget - only for master admins */}
            {isMasterAdmin && (
              <div className="mb-4">
                <TenantComparisonWidget />
              </div>
            )}
            
            {/* For tenant users, show tenant-specific information */}
            {!isMasterAdmin && user?.tenant && (
              <div className="card mb-4">
                <div className="card-header">
                  <h3 className="card-title">
                    <IconBuildingSkyscraper className="icon me-2" />
                    Your Tenant Information
                  </h3>
                </div>
                <div className="card-body">
                  <div className="datagrid">
                    <div className="datagrid-item">
                      <div className="datagrid-title">Tenant Name</div>
                      <div className="datagrid-content">{user.tenant.name}</div>
                    </div>
                    <div className="datagrid-item">
                      <div className="datagrid-title">Subdomain</div>
                      <div className="datagrid-content">{user.tenant.subdomain}</div>
                    </div>
                    <div className="datagrid-item">
                      <div className="datagrid-title">Plan</div>
                      <div className="datagrid-content">
                        <span className="badge bg-primary">
                          {user.tenant.plan ? user.tenant.plan.charAt(0).toUpperCase() + user.tenant.plan.slice(1) : 'Free'}
                        </span>
                      </div>
                    </div>
                    <div className="datagrid-item">
                      <div className="datagrid-title">Access URL</div>
                      <div className="datagrid-content">
                        <a 
                          href={`https://${user.tenant.subdomain}.example.com`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {user.tenant.subdomain}.example.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;