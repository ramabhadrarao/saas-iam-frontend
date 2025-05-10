// File: frontend/src/layouts/AuthLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="page page-center">
      <div className="container container-tight py-4">
        <div className="text-center mb-4">
          <h1 className="navbar-brand navbar-brand-autodark">
            SaaS Platform
          </h1>
        </div>
        <div className="card card-md">
          <div className="card-body">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;