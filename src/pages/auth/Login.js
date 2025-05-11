// src/pages/auth/Login.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { 
  IconMail, 
  IconLock, 
  IconBuildingSkyscraper,
  IconAlertCircle
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTenantField, setShowTenantField] = useState(false);

  // Get subdomain from URL if present
  const getSubdomainFromUrl = () => {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // For local development
      return '';
    }
    
    const parts = hostname.split('.');
    if (parts.length > 2 && parts[0] !== 'www') {
      return parts[0];
    }
    
    return '';
  };

  const subdomain = getSubdomainFromUrl();

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Parse query parameters for potential subdomain or tenantId
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tenantParam = searchParams.get('tenant');
    
    if (tenantParam || subdomain) {
      setShowTenantField(false); // Don't show manual tenant field if we already have tenant context
    }
  }, [location.search, subdomain]);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      subdomain: subdomain || '',
      tenantId: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required'),
      subdomain: Yup.string()
        .matches(/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/, 'Invalid subdomain format')
        .when('tenantId', {
          is: (val) => !val, // Only validate when tenantId is empty
          then: (schema) => showTenantField ? schema.required('Subdomain is required when tenant ID is not provided') : schema
        }),
      tenantId: Yup.string()
        .when('subdomain', {
          is: (val) => !val, // Only validate when subdomain is empty
          then: (schema) => showTenantField ? schema.required('Tenant ID is required when subdomain is not provided') : schema
        })
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');
        
        let loginSubdomain = values.subdomain;
        let loginTenantId = values.tenantId;
        
        // If we have a subdomain from the URL and it's different from the form value
        if (subdomain && subdomain !== values.subdomain) {
          loginSubdomain = subdomain;
          loginTenantId = ''; // Clear tenant ID if subdomain is from URL
        }
        
        // Only pass tenant context if we're using tenant-specific login
        if (showTenantField || subdomain) {
          await login(
            values.email, 
            values.password, 
            loginTenantId || null,
            loginSubdomain || null
          );
        } else {
          // Standard login (no tenant context)
          await login(values.email, values.password);
        }
        
        navigate('/');
      } catch (err) {
        // Create user-friendly error message
        let errorMessage = err.response?.data?.message || 'Login failed';
        if (err.response?.status === 401) {
          errorMessage = 'Invalid email or password';
        } else if (err.response?.status === 404 && showTenantField) {
          errorMessage = 'Tenant not found. Please check your tenant information.';
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div>
      <h2 className="h2 text-center mb-4">Login to your account</h2>
      
      {/* Show tenant context banner if accessing via subdomain */}
      {subdomain && (
        <div className="alert alert-info mb-4" role="alert">
          <div className="d-flex">
            <div>
              <IconBuildingSkyscraper className="alert-icon" />
            </div>
            <div>
              <h4 className="alert-title">Tenant Login</h4>
              <div className="text-muted">
                You are logging in to tenant: <strong>{subdomain}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          <div className="d-flex">
            <div>
              <IconAlertCircle className="alert-icon" />
            </div>
            <div>
              {error}
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email address</label>
          <div className="input-icon mb-3">
            <span className="input-icon-addon">
              <IconMail size={16} />
            </span>
            <input
              type="email"
              className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
              placeholder="your@email.com"
              id="email"
              name="email"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.email}
              disabled={loading}
            />
          </div>
          {formik.touched.email && formik.errors.email && (
            <div className="invalid-feedback d-block">{formik.errors.email}</div>
          )}
        </div>
        
        <div className="mb-3">
          <label className="form-label">
            Password
            <span className="form-label-description">
              <Link to="/forgot-password">I forgot password</Link>
            </span>
          </label>
          <div className="input-icon mb-3">
            <span className="input-icon-addon">
              <IconLock size={16} />
            </span>
            <input
              type="password"
              className={`form-control ${formik.touched.password && formik.errors.password ? 'is-invalid' : ''}`}
              placeholder="Your password"
              id="password"
              name="password"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
              disabled={loading}
            />
          </div>
          {formik.touched.password && formik.errors.password && (
            <div className="invalid-feedback d-block">{formik.errors.password}</div>
          )}
        </div>
        
        {!subdomain && (
          <div className="mb-3">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="showTenantField"
                checked={showTenantField}
                onChange={() => setShowTenantField(!showTenantField)}
              />
              <label className="form-check-label" htmlFor="showTenantField">
                Login to a specific tenant
              </label>
            </div>
          </div>
        )}
        
        {(showTenantField || subdomain) && !formik.values.tenantId && (
          <div className="mb-3">
            <label className="form-label">Tenant Subdomain</label>
            <div className="input-icon mb-3">
              <span className="input-icon-addon">
                <IconBuildingSkyscraper size={16} />
              </span>
              <input
                type="text"
                className={`form-control ${formik.touched.subdomain && formik.errors.subdomain ? 'is-invalid' : ''}`}
                placeholder="tenant-subdomain"
                id="subdomain"
                name="subdomain"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={subdomain || formik.values.subdomain}
                disabled={loading || !!subdomain}
              />
            </div>
            {formik.touched.subdomain && formik.errors.subdomain && (
              <div className="invalid-feedback d-block">{formik.errors.subdomain}</div>
            )}
            <div className="form-hint">
              Enter your tenant subdomain (e.g., "acme" for acme.example.com)
            </div>
          </div>
        )}
        
        <div className="form-footer">
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;