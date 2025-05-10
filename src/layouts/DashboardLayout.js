import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  IconDashboard, 
  IconUsers, 
  IconShield, 
  IconHistory,
  IconBuildingSkyscraper,
  IconMenu2,
  IconLogout
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <IconDashboard size={24} stroke={1.5} />,
      path: '/',
      permission: 'view_dashboard'
    },
    {
      title: 'Tenant Management',
      icon: <IconBuildingSkyscraper size={24} stroke={1.5} />,
      path: '/tenants',
      permission: 'view_tenant',
      requiredUserType: 'master_admin'
    },
    {
      title: 'User Management',
      icon: <IconUsers size={24} stroke={1.5} />,
      path: '/users',
      permission: 'view_users'
    },
    {
      title: 'Role Management',
      icon: <IconShield size={24} stroke={1.5} />,
      path: '/roles',
      permission: 'view_roles'
    },
    {
      title: 'Audit Logs',
      icon: <IconHistory size={24} stroke={1.5} />,
      path: '/audit-logs',
      permission: 'view_audit_logs'
    }
  ];

  return (
    <div className="page">
      {/* Navbar */}
      <header className="navbar navbar-expand-md navbar-light d-print-none">
        <div className="container-xl">
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={() => setCollapsed(!collapsed)}
          >
            <IconMenu2 />
          </button>

          <h1 className="navbar-brand navbar-brand-autodark d-none-navbar-horizontal pe-0 pe-md-3">
            <Link to="/">SaaS Platform</Link>
          </h1>

          <div className="navbar-nav flex-row order-md-last">
            <div className="nav-item dropdown">
              <button
                type="button"
                className="nav-link d-flex lh-1 text-reset p-0 bg-transparent border-0"
                data-bs-toggle="dropdown"
              >
                <div className="d-none d-xl-block ps-2 text-start">
                  <div>{user?.firstName} {user?.lastName}</div>
                  <div className="mt-1 small text-muted">{user?.userType?.replace('_', ' ')}</div>
                </div>
              </button>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <Link to="/profile" className="dropdown-item">Profile</Link>
                <Link to="/settings" className="dropdown-item">Settings</Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="page-wrapper">
        <div className="page-body">
          <div className="container-xl">
            <div className="row">
              {/* Sidebar */}
              <div className="col-md-3 col-lg-2">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex flex-column">
                      <ul className="nav nav-pills nav-vertical">
                       {menuItems.map((item, index) => (
                        // Only show menu items for the appropriate user type
                        (!item.requiredUserType || user.userType === item.requiredUserType) && (
                            <li 
                            key={index} 
                            className="nav-item"
                            >
                            <Link 
                                to={item.path} 
                                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                <span className="nav-link-icon">
                                {item.icon}
                                </span>
                                <span className="nav-link-title">
                                {item.title}
                                </span>
                            </Link>
                            </li>
                        )
                        ))}
                        <li className="nav-item mt-auto">
                          <button 
                            onClick={handleLogout}
                            className="nav-link w-100 text-start bg-transparent border-0"
                          >
                            <span className="nav-link-icon">
                              <IconLogout size={24} stroke={1.5} />
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
                <Outlet />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="footer footer-transparent d-print-none">
          <div className="container-xl">
            <div className="row text-center align-items-center flex-row-reverse">
              <div className="col-12 col-lg-auto mt-3 mt-lg-0">
                <ul className="list-inline list-inline-dots mb-0">
                  <li className="list-inline-item">
                    &copy; 2025 SaaS Platform. All rights reserved.
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
