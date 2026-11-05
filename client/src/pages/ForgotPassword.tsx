import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { authService } from '../services/auth';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Phase 2: Reset form
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | undefined>(undefined);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError('Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      const data = await authService.forgotPassword(email.trim());
      setSuccess(data.message || 'Password reset instructions have been processed.');
      setResetToken(data.resetToken);
      setShowResetForm(true);
    } catch (err: any) {
      setError(err.message || 'Unable to process password reset request. Please check your email and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newPassword) { setError('Please enter a new password.'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters long.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const data = await authService.resetPassword(email.trim(), newPassword, resetToken);
      setSuccess(data.message || 'Password reset successful! Redirecting to sign in...');
      setTimeout(() => navigate('/login', { replace: true }), 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const EyeToggle = ({ show, onToggle, label }: { show: boolean; onToggle: () => void; label: string }) => (
    <button
      type="button"
      onClick={onToggle}
      className="auth-eye-btn"
      aria-label={show ? `Hide ${label}` : `Show ${label}`}
      title={show ? `Hide ${label}` : `Show ${label}`}
    >
      {show ? (
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
  );

  return (
    <AuthLayout>
      <div className="auth-card">

        {/* ── Top Animated Key / Lock Icon & Typography ───────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="auth-icon-badge-wrapper">
            <div className="auth-icon-badge">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
          </div>

          <h1 className="auth-title">
            {showResetForm ? 'Set New Password' : 'Reset Password'}
          </h1>
          <p className="auth-subtitle">
            {showResetForm
              ? 'Enter your new password below to regain access to your account.'
              : "Enter your email address and we'll help you reset your password."}
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

        {/* ── Success Banner ───────────────────────────────────────────── */}
        {success && (
          <div className="auth-success" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#FF7A00', lineHeight: 1.5 }}>
              {success}
            </span>
          </div>
        )}

        {/* ── Step 1: Email Form ───────────────────────────────────────── */}
        {!showResetForm ? (
          <form onSubmit={handleRequestReset} noValidate>
            <div className="auth-field" style={{ marginBottom: '22px' }}>
              <label htmlFor="reset-email" className="auth-label">
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
                  id="reset-email"
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

            <button
              type="submit"
              disabled={loading}
              className="auth-btn-primary"
              id="reset-request-btn"
            >
              {loading ? (
                <>
                  <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Instructions</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>
        ) : (
          /* ── Step 2: New Password Form ──────────────────────────────── */
          <form onSubmit={handleSetNewPassword} noValidate>
            <div className="auth-field" style={{ marginBottom: '16px' }}>
              <label htmlFor="new-password" className="auth-label">
                New Password
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <input
                  id="new-password"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); if (error) setError(''); }}
                  placeholder="At least 6 characters"
                  className="auth-input"
                  style={{ paddingRight: '48px' }}
                />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} label="password" />
              </div>
            </div>

            <div className="auth-field" style={{ marginBottom: '26px' }}>
              <label htmlFor="confirm-new-password" className="auth-label">
                Confirm New Password
              </label>
              <div className="auth-input-group">
                <div className="auth-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <input
                  id="confirm-new-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); if (error) setError(''); }}
                  placeholder="Re-enter your new password"
                  className="auth-input"
                  style={{ paddingRight: '48px' }}
                />
                <EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} label="confirm password" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-btn-primary"
              id="reset-update-btn"
            >
              {loading ? (
                <>
                  <svg className="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Update Password</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Back to Sign In Link ─────────────────────────────────────── */}
        <div style={{
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
        }}>
          <Link
            to="/login"
            className="auth-link"
            style={{ fontSize: '14px' }}
          >
            <span className="auth-link-arrow" style={{ display: 'inline-block', transform: 'none' }}>←</span>
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

