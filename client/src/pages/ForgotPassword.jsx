import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '../utils/api';
import { showToast } from '../utils/toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      showToast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
      showToast.success('Password reset email sent!');
    } catch (err) {
      showToast.error(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto var(--space-md)' }} />
            <h1>Check Your Email</h1>
            <p>We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions.</p>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 'var(--space-lg)' }}>
            Didn't receive the email? Check your spam folder or try again.
          </p>
          <button
            className="btn btn-secondary btn-block"
            onClick={() => setSent(false)}
          >
            Send Again
          </button>
          <div className="auth-footer">
            <p><Link to="/login"><ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> Back to Login</Link></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-wrapper">
            <Mail size={32} color="var(--color-primary-dark)" />
          </div>
          <h1>Forgot Password?</h1>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Remember your password? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
