// File: frontend/src/pages/auth/ForgotPassword.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authAPI } from '../../services/api.service';

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: ''
    },
    validationSchema: Yup.object({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');
        await authAPI.forgotPassword(values.email);
        setIsSubmitted(true);
      } catch (err) {
        setError('An error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div>
      <h2 className="h2 text-center mb-4">Forgot Password</h2>
      
      {isSubmitted ? (
        <div className="text-center">
          <div className="mb-3 text-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-circle-check" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path>
              <path d="M9 12l2 2l4 -4"></path>
            </svg>
          </div>
          <p>If the email exists in our system, we've sent a password reset link.</p>
          <p>Please check your email for further instructions.</p>
          <div className="mt-4">
            <Link to="/login" className="btn btn-primary w-100">
              Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-muted text-center mb-4">
            Enter your email address and we'll send you a password reset link.
          </p>
          
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
            
            <div className="form-footer">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
            
            <div className="text-center text-muted mt-3">
              <Link to="/login">Back to login</Link>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ForgotPassword;