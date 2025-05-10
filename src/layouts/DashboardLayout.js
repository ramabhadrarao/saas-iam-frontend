// File: frontend/src/layouts/DashboardLayout.js
import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  IconDashboard, 
  IconUsers, 
  IconShield, 
  IconHistory,
  IconMenu2,
  IconBell,
  IconLogout
} from '@tabler/icons-react';
import { useAuth } from '../contexts/AuthContext';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Menu items configuration
  const menuItems = [
    {
      title: 'Dashboard',
      icon: <IconDashboard />,
      path: '/',
      permission: 'view_dashboard'
    },
    {
      title: 'User Management',
      icon: <IconUsers />,
      path: '/users',
      permission: 'view_users'
    },
    {
      title: 'Role Management',
      icon: <IconShield />,
      path: '/roles',
      permission: 'view_roles'
    },
    {
      title: 'Audit Logs',
      icon: <IconHistory />,
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
            <Link to="/">
              SaaS Platform
            </Link>
          </h1>
          
          <div className="navbar-nav flex-row order-md-last">
            <div className="nav-item dropdown">
              <a 
                href="#" 
                className="nav-link d-flex lh-1 text-reset p-0" 
                data-bs-toggle="dropdown"
              >
                <div className="d-none d-xl-block ps-2">
                  <div>{user?.firstName} {user?.lastName}</div>
                  <div className="mt-1 small text-muted">{user?.userType}</div>
                </div>
              </a>
              <div className="dropdown-menu dropdown-menu-end dropdown-menu-arrow">
                <a href="#" className="dropdown-item">Profile</a>
                <a href="#" className="dropdown-item">Settings</a>
                <div className="dropdown-divider"></div>
                <a 
                  href="#" 
                  className="dropdown-item" 
                  onClick={handleLogout}
                >
                  Logout
                </a>
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
                        ))}
                        <li className="nav-item mt-auto">
                          <a 
                            href="#" 
                            className="nav-link" 
                            onClick={handleLogout}
                          >
                            <span className="nav-link-icon">
                              <IconLogout />
                            </span>
                            <span className="nav-link-title">
                              Logout
                            </span>
                          </a>
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