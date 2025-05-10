// File: frontend/src/pages/auth/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .required('Password is required')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');
        await login(values.email, values.password);
        navigate('/');
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div>
      <h2 className="h2 text-center mb-4">Login to your account</h2>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      <form onSubmit={formik.handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Email address</label>
          <input
            type="email"
            className={`form-control ${formik.touched.email && formik.errors.email ? 'is-invalid' : ''}`}
            placeholder="your@email.com"
            id="email"
            name="email"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.email}
          />
          {formik.touched.email && formik.errors.email && (
            <div className="invalid-feedback">{formik.errors.email}</div>
          )}
        </div>
        
        <div className="mb-3">
          <label className="form-label">
            Password
            <span className="form-label-description">
              <Link to="/forgot-password">I forgot password</Link>
            </span>
          </label>
          <input
            type="password"
            className={`form-control ${formik.touched.password && formik.errors.password ? 'is-invalid' : ''}`}
            placeholder="Your password"
            id="password"
            name="password"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.password}
          />
          {formik.touched.password && formik.errors.password && (
            <div className="invalid-feedback">{formik.errors.password}</div>
          )}
        </div>
        
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