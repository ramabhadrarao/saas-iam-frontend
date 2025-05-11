// src/layouts/DashboardLayout.js
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  IconDashboard, 
  IconUsers, 
  IconShield, 
  IconHistory,
  IconBuildingSkyscraper,
  IconMenu2,
  IconLogout,
  IconChevronRight,
  IconAlertTriangle,
  IconBellRinging,
  IconSettings,
  IconUser
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = () => {
  const { 
    user, 
    logout, 
    hasPermission, 
    isMasterAdmin, 
    isTenantAdmin 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Get notifications count (could be fetched from an API)
  useEffect(() => {
    // Mock notification count for demo
    setNotificationsCount(3);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define menu items based on permissions
  const getMenuItems = () => {
    const items = [
      {
        title: 'Dashboard',
        icon: <IconDashboard size={20} stroke={1.5} />,
        path: '/',
        permission: 'read_dashboard',
        visibleFor: ['master_admin', 'tenant_admin', 'tenant_user']
      }
    ];

    // Tenant Management - Only for master admins and tenant admins (with restrictions)
    if (hasPermission('read_tenant')) {
      items.push({
        title: 'Tenant Management',
        icon: <IconBuildingSkyscraper size={20} stroke={1.5} />,
        path: '/tenants',
        permission: 'read_tenant',
        visibleFor: ['master_admin', 'tenant_admin']
      });
    }

    // User Management - Available to all admin types with permissions
    if (hasPermission('read_user')) {
      items.push({
        title: 'User Management',
        icon: <IconUsers size={20} stroke={1.5} />,
        path: '/users',
        permission: 'read_user',
        visibleFor: ['master_admin', 'tenant_admin', 'tenant_user']
      });
    }

    // Role Management - Available to admins with permissions
    if (hasPermission('read_role')) {
      items.push({
        title: 'Role Management',
        icon: <IconShield size={20} stroke={1.5} />,
        path: '/roles',
        permission: 'read_role',
        visibleFor: ['master_admin', 'tenant_admin']
      });
    }

    // Audit Logs - Available to authorized users
    if (hasPermission('read_audit')) {
      items.push({
        title: 'Audit Logs',
        icon: <IconHistory size={20} stroke={1.5} />,
        path: '/audit-logs',
        permission: 'read_audit',
        visibleFor: ['master_admin', 'tenant_admin', 'tenant_user']
      });
    }

    // Filter items based on user type
    if (user && user.userType) {
      return items.filter(item => 
        item.visibleFor.includes(user.userType) && 
        (item.permission ? hasPermission(item.permission) : true)
      );
    }

    return items;
  };

  const menuItems = getMenuItems();

  return (
    <div className="page">
      {/* Navbar */}
      <header className="navbar navbar-expand-md navbar-light d-print-none">
        <div className="container-xl">
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle navigation"
          >
            <IconMenu2 />
          </button>

          <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
            <Link to="/">
              <img src="/logo.svg" width="110" height="32" alt="Logo" className="navbar-brand-image" />
              Multi-Tenant SaaS
            </Link>
          </h1>

          <div className="navbar-nav flex-row order-md-last">
            {/* Notifications */}
            <div className="nav-item dropdown d-none d-md-flex me-3">
              <a 
                href="#" 
                className="nav-link px-0" 
                data-bs-toggle="dropdown" 
                tabIndex="-1"
                aria-label="Show notifications"
              >
                <IconBellRinging />
                {notificationsCount > 0 && (
                  <span className="badge bg-red">{notificationsCount}</span>
                )}
              </a>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-card">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title">Notifications</h3>
                  </div>
                  <div className="list-group list-group-flush list-group-hoverable">
                    <div className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <span className="status-dot status-dot-animated bg-red d-block"></span>
                        </div>
                        <div className="col text-truncate">
                          <a href="#" className="text-body d-block">Login attempt failed</a>
                          <div className="d-block text-muted text-truncate mt-n1">
                            Multiple failed login attempts from IP 192.168.1.1
                          </div>
                        </div>
                        <div className="col-auto">
                          <a href="#" className="list-group-item-actions">
                            <IconChevronRight />
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <span className="status-dot status-dot-animated bg-yellow d-block"></span>
                        </div>
                        <div className="col text-truncate">
                          <a href="#" className="text-body d-block">Resource usage alert</a>
                          <div className="d-block text-muted text-truncate mt-n1">
                            Your tenant is approaching API usage limits
                          </div>
                        </div>
                        <div className="col-auto">
                          <a href="#" className="list-group-item-actions">
                            <IconChevronRight />
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="list-group-item">
                      <div className="row align-items-center">
                        <div className="col-auto">
                          <span className="status-dot status-dot-animated bg-green d-block"></span>
                        </div>
                        <div className="col text-truncate">
                          <a href="#" className="text-body d-block">New user registered</a>
                          <div className="d-block text-muted text-truncate mt-n1">
                            User John Doe was added to your tenant
                          </div>
                        </div>
                        <div className="col-auto">
                          <a href="#" className="list-group-item-actions">
                            <IconChevronRight />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User dropdown */}
            <div className="nav-item dropdown">
              <a 
                href="#" 
                className="nav-link d-flex lh-1 text-reset p-0" 
                data-bs-toggle="dropdown" 
                aria-label="Open user menu"
              >
                <div className="d-none d-xl-block ps-2">
                  <div>{user?.firstName} {user?.lastName}</div>
                  <div className="mt-1 small text-muted">
                    {user?.userType === 'master_admin' ? 'Master Admin' : 
                     user?.userType === 'tenant_admin' ? 'Tenant Admin' : 'User'}
                    {user?.tenant && ` (${user.tenant.name})`}
                  </div>
                </div>
              </a>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <Link to="/profile" className="dropdown-item">
                  <IconUser className="dropdown-item-icon" />
                  Profile
                </Link>
                {(isMasterAdmin || isTenantAdmin) && (
                  <Link to="/settings" className="dropdown-item">
                    <IconSettings className="dropdown-item-icon" />
                    Settings
                  </Link>
                )}
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item" 
                  onClick={handleLogout}
                >
                  <IconLogout className="dropdown-item-icon" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="page-wrapper">
        <div className="page-body">
          <div className="container-xl">
            <div className="row">
              {/* Sidebar - Mobile Menu */}
              <div
                className={`offcanvas-md offcanvas-start ${showMobileMenu ? 'show' : ''}`}
                tabIndex="-1"
                id="sidebarMenu"
              >
                <div className="offcanvas-header">
                  <h5 className="offcanvas-title">Menu</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowMobileMenu(false)}
                  ></button>
                </div>
                <div className="offcanvas-body">
                  <ul className="nav nav-pills nav-vertical">
                    {menuItems.map((item, index) => (
                      <li key={index} className="nav-item">
                        <Link
                          to={item.path}
                          className={`nav-link ${
                            location.pathname === item.path ? 'active' : ''
                          }`}
                          onClick={() => setShowMobileMenu(false)}
                        >
                          <span className="nav-link-icon">{item.icon}</span>
                          <span className="nav-link-title">{item.title}</span>
                        </Link>
                      </li>
                    ))}
                    <li className="nav-item mt-auto">
                      <button
                        onClick={handleLogout}
                        className="nav-link w-100 text-start bg-transparent border-0"
                      >
                        <span className="nav-link-icon">
                          <IconLogout size={20} stroke={1.5} />
                        </span>
                        <span className="nav-link-title">Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Sidebar - Desktop */}
              <div className="col-md-3 col-lg-2 d-none d-md-block">
                <div className="card sticky-top" style={{ top: '1rem' }}>
                  <div className="card-body">
                    <div className="d-flex flex-column">
                      <ul className="nav nav-pills nav-vertical">
                        {menuItems.map((item, index) => (
                          <li key={index} className="nav-item">
                            <Link
                              to={item.path}
                              className={`nav-link ${
                                location.pathname === item.path ? 'active' : ''
                              }`}
                            >
                              <span className="nav-link-icon d-md-none d-lg-inline-block">
                                {item.icon}
                              </span>
                              <span className="nav-link-title">{item.title}</span>
                            </Link>
                          </li>
                        ))}
                        <li className="nav-item mt-auto">
                          <button
                            onClick={handleLogout}
                            className="nav-link w-100 text-start bg-transparent border-0"
                          >
                            <span className="nav-link-icon d-md-none d-lg-inline-block">
                              <IconLogout size={20} stroke={1.5} />
                            </span>
                            <span className="nav-link-title">Logout</span>
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="col-md-9 col-lg-10">
                {/* Show tenant context info if applicable */}
                {user?.tenant && (
                  <div className="alert alert-info mb-3 d-flex align-items-center">
                    <IconAlertTriangle className="me-2" />
                    <div>
                      <strong>Tenant Context:</strong> You are currently managing {user.tenant.name}
                      {isTenantAdmin && (
                        <> as a Tenant Administrator</>
                      )}
                    </div>
                  </div>
                )}

                <Outlet />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer footer-transparent d-print-none mt-4">
          <div className="container-xl">
            <div className="row text-center align-items-center flex-row-reverse">
              <div className="col-lg-auto ms-lg-auto">
                <ul className="list-inline list-inline-dots mb-0">
                  <li className="list-inline-item">
                    <a href="#" className="link-secondary">Documentation</a>
                  </li>
                  <li className="list-inline-item">
                    <a href="#" className="link-secondary">Help</a>
                  </li>
                </ul>
                </div>
              <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                <ul className="list-inline list-inline-dots mb-0">
                  <li className="list-inline-item">
                    &copy; 2025 Multi-Tenant SaaS Platform. All rights reserved.
                  </li>
                  <li className="list-inline-item">
                    Version 1.0.0
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;