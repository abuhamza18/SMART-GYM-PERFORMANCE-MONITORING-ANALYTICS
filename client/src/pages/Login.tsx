import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/auth';

interface LoginProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!password) {
      setError('Please enter your password.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const data = await authService.login(email.trim(), password, rememberMe);
      onLoginSuccess(data.token, data.username);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">

        {/* ── Top Animated Login Icon & Typography ─────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '34px' }}>
          <div className="auth-icon-badge-wrapper">
            <div className="auth-icon-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="3" ry="3" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1.5" fill="#FF7A00" stroke="none" />
                <path d="M12 17.5v1.5" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <h1 className="auth-title">
            Welcome Back
          </h1>
          <p className="auth-subtitle">
            Sign in to access your workout metrics & live telemetry.
          </p>
        </div>

        {/* ── Error Banner ─────────────────────────────────────────────── */}
        {error && (
          <div className="auth-error" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF4D5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#FF4D5A', lineHeight: 1.5 }}>
              {error}
            </span>
          </div>
        )}

        {/* ── Form ─────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Email Address */}
          <div className="auth-field">
            <label htmlFor="login-email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => { setEmail(e.target.value); if (error) setError(''); }}
                placeholder="name@example.com"
                className="auth-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label htmlFor="login-password" className="auth-label" style={{ margin: 0 }}>
                Password
              </label>
              <Link to="/forgot-password" className="auth-link" style={{ fontSize: '12.5px' }}>
                Forgot Password?
              </Link>
            </div>
            <div className="auth-input-group">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={e => { setPassword(e.target.value); if (error) setError(''); }}
                placeholder="Enter your password"
                className="auth-input"
                style={{ paddingRight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="auth-eye-btn"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Custom Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
            <label className="auth-checkbox-label">
              <div className={`auth-custom-checkbox ${rememberMe ? 'checked' : ''}`}>
                {rememberMe && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0B0B0D" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
              />
              <span style={{ fontSize: '13.5px', color: '#A1A1AA', fontWeight: 500, letterSpacing: '0.01em' }}>
                Remember me on this device
              </span>
            </label>
          </div>

          {/* Modern Orange Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="auth-btn-primary"
            id="login-submit-btn"
          >
            {loading ? (
              <>
                <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* ── Sign Up Switcher Link ────────────────────────────────────── */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#A1A1AA' }}>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              <span>Create Account</span>
              <span className="auth-link-arrow">→</span>
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

