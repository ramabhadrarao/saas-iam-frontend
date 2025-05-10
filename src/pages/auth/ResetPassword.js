// File: frontend/src/pages/auth/ResetPassword.js
import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authAPI } from '../../services/api.service';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: ''
    },
    validationSchema: Yup.object({
      password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        ),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('password'), null], 'Passwords must match')
        .required('Confirm password is required')
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError('');
        await authAPI.resetPassword(token, values.password);
        setIsSubmitted(true);
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
  });

  return (
    <div>
      <h2 className="h2 text-center mb-4">Reset Password</h2>
      
      {isSubmitted ? (
        <div className="text-center">
          <div className="mb-3 text-success">
            <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-circle-check" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
              <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"></path>
              <path d="M9 12l2 2l4 -4"></path>
            </svg>
          </div>
          <p>Your password has been successfully reset.</p>
          <p>You will be redirected to the login page shortly...</p>
          <div className="mt-4">
            <Link to="/login" className="btn btn-primary w-100">
              Back to Login
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="text-muted text-center mb-4">
            Please enter your new password.
          </p>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          <form onSubmit={formik.handleSubmit}>
            <div className="mb-3">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className={`form-control ${formik.touched.password && formik.errors.password ? 'is-invalid' : ''}`}
                placeholder="New password"
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
            
            <div className="mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className={`form-control ${formik.touched.confirmPassword && formik.errors.confirmPassword ? 'is-invalid' : ''}`}
                placeholder="Confirm new password"
                id="confirmPassword"
                name="confirmPassword"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.confirmPassword}
              />
              {formik.touched.confirmPassword && formik.errors.confirmPassword && (
                <div className="invalid-feedback">{formik.errors.confirmPassword}</div>
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
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ResetPassword;