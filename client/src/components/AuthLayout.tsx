import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-page-root">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="auth-header">
        <Link to="/" className="auth-brand-link">
          {/* Logo Mark with subtle hover glow */}
          <div className="auth-logo-badge">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5h11M6.5 17.5h11M6.5 6.5v11M17.5 6.5v11" />
              <circle cx="6.5" cy="6.5" r="1.5" fill="#FF7A00" stroke="none" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="#FF7A00" stroke="none" />
              <circle cx="6.5" cy="17.5" r="1.5" fill="#FF7A00" stroke="none" />
              <circle cx="17.5" cy="17.5" r="1.5" fill="#FF7A00" stroke="none" />
              <path d="M3 12h3M18 12h3M12 3v3M12 18v3" strokeWidth="2" />
            </svg>
          </div>
          {/* Brand Text */}
          <div style={{ lineHeight: 1.2 }}>
            <div className="auth-brand-title">
              SMART <span style={{ color: '#FF7A00' }}>GYM</span>
            </div>
            <div className="auth-brand-subtitle">
              Performance Platform
            </div>
          </div>
        </Link>

        {/* Online Status Badge */}
        <div className="auth-status-badge">
          <span className="auth-status-dot" />
          <span className="auth-status-text">
            Platform Online
          </span>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="auth-main">
        {/* Animated Background Ambience */}
        <div className="auth-ambient-orb auth-ambient-orb-1" aria-hidden="true" />
        <div className="auth-ambient-orb auth-ambient-orb-2" aria-hidden="true" />
        <div className="auth-ambient-orb auth-ambient-orb-3" aria-hidden="true" />
        <div className="auth-tech-grid" aria-hidden="true" />

        <div className="auth-card-container">
          {children}
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="auth-footer">
        <p className="auth-footer-copy">
          © {new Date().getFullYear()} Smart Gym Systems. All rights reserved.
        </p>
        <div className="auth-footer-links">
          {['Privacy Policy', 'Terms of Service', 'System Status'].map(link => (
            <a key={link} href="#" className="auth-footer-link">
              {link}
            </a>
          ))}
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Orbitron:wght@500;600;700;800;900&display=swap');

        /* ── Base Layout Styles ────────────────────────────────────────── */
        .auth-page-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #0B0B0D;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #F5F5F5;
          position: relative;
          overflow-x: hidden;
        }

        .auth-header {
          padding: 16px 36px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: rgba(17, 17, 20, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #303036;
          box-sizing: border-box;
          z-index: 20;
          position: sticky;
          top: 0;
        }

        .auth-brand-link {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: transform 0.2s ease;
        }
        .auth-brand-link:hover {
          transform: translateY(-1px);
        }

        .auth-logo-badge {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(255,122,0,0.22) 0%, rgba(255,122,0,0.06) 100%);
          border: 1.5px solid rgba(255, 122, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(255, 122, 0, 0.25);
          transition: all 0.3s ease;
        }
        .auth-brand-link:hover .auth-logo-badge {
          box-shadow: 0 0 28px rgba(255, 122, 0, 0.45);
          border-color: #FF7A00;
        }

        .auth-brand-title {
          font-size: 19px;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: #F5F5F5;
          font-family: 'Orbitron', sans-serif;
        }

        .auth-brand-subtitle {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #A1A1AA;
          text-transform: uppercase;
          margin-top: 2px;
          font-family: 'Orbitron', sans-serif;
        }

        .auth-status-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 100px;
          background-color: rgba(255, 122, 0, 0.08);
          border: 1px solid rgba(255, 122, 0, 0.28);
          box-shadow: 0 0 16px rgba(255, 122, 0, 0.1);
        }

        .auth-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: #FF7A00;
          display: inline-block;
          box-shadow: 0 0 10px rgba(255,122,0,0.9);
          animation: authPulse 2s ease-in-out infinite;
        }

        .auth-status-text {
          font-size: 11px;
          font-weight: 700;
          color: #FF7A00;
          letter-spacing: 0.06em;
          font-family: 'Inter', sans-serif;
        }

        .auth-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 44px 20px;
          position: relative;
          z-index: 10;
        }

        .auth-card-container {
          width: 100%;
          max-width: 468px;
          position: relative;
          z-index: 10;
        }

        /* ── Animated Background Orbs & Tech Grid ────────────────────────── */
        .auth-ambient-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(60px);
          z-index: 1;
        }

        .auth-ambient-orb-1 {
          top: 6%;
          left: 10%;
          width: 480px;
          height: 480px;
          background: radial-gradient(circle, rgba(255,122,0,0.14) 0%, transparent 68%);
          animation: ambientOrbFloat1 12s ease-in-out infinite alternate;
        }

        .auth-ambient-orb-2 {
          bottom: 8%;
          right: 8%;
          width: 520px;
          height: 520px;
          background: radial-gradient(circle, rgba(255,122,0,0.11) 0%, transparent 70%);
          animation: ambientOrbFloat2 15s ease-in-out infinite alternate;
        }

        .auth-ambient-orb-3 {
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, rgba(255,122,0,0.06) 0%, transparent 70%);
          animation: ambientOrbPulse 8s ease-in-out infinite;
        }

        .auth-tech-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(255, 122, 0, 0.08) 1px, transparent 1px);
          background-size: 32px 32px;
          mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, transparent 75%);
          -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, transparent 75%);
          pointer-events: none;
          z-index: 2;
        }

        /* ── Footer Styles ─────────────────────────────────────────────── */
        .auth-footer {
          padding: 20px 36px;
          border-top: 1px solid #303036;
          background-color: #111114;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          box-sizing: border-box;
          z-index: 20;
        }

        .auth-footer-copy {
          font-size: 12px;
          color: #71717A;
          margin: 0;
        }

        .auth-footer-links {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .auth-footer-link {
          font-size: 12px;
          color: #71717A;
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .auth-footer-link:hover {
          color: #A1A1AA;
        }

        /* ── Keyframe Animations ───────────────────────────────────────── */
        @keyframes authPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 10px rgba(255,122,0,0.9); }
          50%       { opacity: 0.45; box-shadow: 0 0 4px rgba(255,122,0,0.3); }
        }

        @keyframes authCardEntry {
          0% {
            opacity: 0;
            transform: translateY(28px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes authFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes authAuraPulse {
          0%, 100% {
            box-shadow: 0 0 24px rgba(255, 122, 0, 0.28), inset 0 0 16px rgba(255, 122, 0, 0.15);
            border-color: rgba(255, 122, 0, 0.45);
          }
          50% {
            box-shadow: 0 0 40px rgba(255, 122, 0, 0.55), inset 0 0 28px rgba(255, 122, 0, 0.35);
            border-color: rgba(255, 122, 0, 0.85);
          }
        }

        @keyframes ambientOrbFloat1 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(35px, -25px) scale(1.16); }
          100% { transform: translate(-20px, 20px) scale(1.05); }
        }

        @keyframes ambientOrbFloat2 {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(-30px, 30px) scale(1.14); }
          100% { transform: translate(25px, -20px) scale(1.08); }
        }

        @keyframes ambientOrbPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.06; }
          50%       { transform: translate(-50%, -50%) scale(1.22); opacity: 0.12; }
        }

        @keyframes authSheen {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        /* ── Modern Auth Card ──────────────────────────────────────────── */
        .auth-card {
          background: linear-gradient(180deg, #1A1A1F 0%, #151519 100%) !important;
          border: 1px solid rgba(255, 122, 0, 0.22) !important;
          border-radius: 22px !important;
          padding: 44px 38px !important;
          box-shadow:
            0 24px 64px rgba(0, 0, 0, 0.85),
            0 0 35px rgba(255, 122, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
          animation: authCardEntry 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
          position: relative;
          overflow: hidden;
        }

        /* Subtle top card accent line */
        .auth-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 15%;
          right: 15%;
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #FF7A00 50%, transparent 100%);
          opacity: 0.75;
          pointer-events: none;
        }

        /* ── Floating Top Icon Badge ───────────────────────────────────── */
        .auth-icon-badge-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          animation: authFloat 4.2s ease-in-out infinite;
          margin-bottom: 20px;
        }

        .auth-icon-badge {
          width: 62px;
          height: 62px;
          border-radius: 18px;
          background: linear-gradient(135deg, rgba(255,122,0,0.22) 0%, rgba(255,122,0,0.06) 100%);
          border: 1.5px solid rgba(255, 122, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: authAuraPulse 3.5s ease-in-out infinite;
          position: relative;
          transition: transform 0.25s ease;
        }
        .auth-icon-badge:hover {
          transform: scale(1.06);
        }

        /* ── Headings ──────────────────────────────────────────────────── */
        .auth-title {
          font-size: 27px;
          font-weight: 800;
          color: #F5F5F5;
          margin: 0;
          letter-spacing: -0.5px;
          font-family: 'Orbitron', sans-serif;
          line-height: 1.25;
        }

        .auth-subtitle {
          font-size: 14px;
          color: #A1A1AA;
          margin-top: 10px;
          margin-bottom: 0;
          line-height: 1.55;
          font-family: 'Inter', sans-serif;
        }

        /* ── Input Group with Smooth Focus Animations ─────────────────── */
        .auth-field {
          margin-bottom: 20px;
        }

        .auth-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #A1A1AA;
          margin-bottom: 8px;
          font-family: 'Inter', sans-serif;
          transition: color 0.2s ease;
        }
        .auth-field:focus-within .auth-label {
          color: #FF7A00;
        }

        .auth-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .auth-input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #71717A;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2;
        }
        .auth-input-group:focus-within .auth-input-icon {
          color: #FF7A00;
          transform: translateY(-50%) scale(1.15);
        }

        .auth-input {
          width: 100%;
          padding: 13px 16px 13px 44px;
          font-size: 14px;
          color: #F5F5F5 !important;
          background: #222228 !important;
          border: 1.5px solid #303036 !important;
          border-radius: 12px !important;
          outline: none !important;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }

        .auth-input:focus {
          border-color: #FF7A00 !important;
          background: #272731 !important;
          box-shadow:
            0 0 0 3px rgba(255, 122, 0, 0.22),
            0 0 18px rgba(255, 122, 0, 0.16) !important;
          transform: translateY(-1px);
        }

        .auth-input::placeholder {
          color: #52525B;
        }

        /* ── Show/Hide Password Toggle Button ──────────────────────────── */
        .auth-eye-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent !important;
          border: none !important;
          cursor: pointer;
          color: #71717A;
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 2;
        }
        .auth-eye-btn:hover {
          color: #FF7A00;
          background: rgba(255, 122, 0, 0.12) !important;
          transform: translateY(-50%) scale(1.08);
        }
        .auth-eye-btn:active {
          transform: translateY(-50%) scale(0.95);
        }

        /* ── Custom Styled Checkbox ────────────────────────────────────── */
        .auth-checkbox-label {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .auth-custom-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 6px;
          border: 1.5px solid #303036;
          background: #222228;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }
        .auth-custom-checkbox.checked {
          background: #FF7A00;
          border-color: #FF7A00;
          box-shadow: 0 0 10px rgba(255, 122, 0, 0.45);
        }
        .auth-checkbox-label:hover .auth-custom-checkbox:not(.checked) {
          border-color: #FF7A00;
          background: #272731;
        }

        /* ── Orange Gradient Primary Button ────────────────────────────── */
        .auth-btn-primary {
          width: 100%;
          padding: 14px 22px;
          background: linear-gradient(135deg, #FF7A00 0%, #FF5500 100%) !important;
          color: #0B0B0D !important;
          border: none !important;
          border-radius: 12px !important;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
          font-family: 'Inter', sans-serif;
          box-shadow: 0 5px 22px rgba(255, 122, 0, 0.38), 0 0 0 1px rgba(255, 122, 0, 0.35) !important;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          position: relative;
          overflow: hidden;
        }

        .auth-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #FF8C1A 0%, #E65C00 100%) !important;
          box-shadow: 0 8px 32px rgba(255, 122, 0, 0.6), 0 0 20px rgba(255, 122, 0, 0.4) !important;
          transform: translateY(-2px) !important;
        }

        .auth-btn-primary:active:not(:disabled) {
          transform: translateY(1px) scale(0.985) !important;
          box-shadow: 0 2px 10px rgba(255, 122, 0, 0.4) !important;
        }

        .auth-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }

        /* Subtle shine animation on button hover */
        .auth-btn-primary::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          transform: skewX(-20deg);
          transition: none;
          pointer-events: none;
        }
        .auth-btn-primary:hover::after {
          animation: authSheen 0.85s ease;
        }

        /* ── Auth Links ────────────────────────────────────────────────── */
        .auth-link {
          color: #FF7A00;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .auth-link:hover {
          color: #FF8C1A;
          text-decoration: none;
          text-shadow: 0 0 12px rgba(255, 122, 0, 0.5);
        }
        .auth-link:hover .auth-link-arrow {
          transform: translateX(3px);
        }

        .auth-link-arrow {
          transition: transform 0.2s ease;
          display: inline-block;
        }

        /* ── Error & Success Banners ───────────────────────────────────── */
        .auth-error {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 13px 16px;
          background: rgba(255, 77, 90, 0.12);
          border: 1px solid rgba(255, 77, 90, 0.35);
          border-radius: 12px;
          margin-bottom: 22px;
          animation: authCardEntry 0.3s ease-out;
        }

        .auth-success {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 13px 16px;
          background: rgba(255, 122, 0, 0.12);
          border: 1px solid rgba(255, 122, 0, 0.38);
          border-radius: 12px;
          margin-bottom: 22px;
          animation: authCardEntry 0.3s ease-out;
        }

        /* ── Spinner ───────────────────────────────────────────────────── */
        .spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Responsive Adjustments ────────────────────────────────────── */
        @media (max-width: 520px) {
          .auth-header {
            padding: 14px 18px;
          }
          .auth-card {
            padding: 30px 20px !important;
            border-radius: 18px !important;
          }
          .auth-title {
            font-size: 23px;
          }
          .auth-main {
            padding: 24px 14px;
          }
          .auth-footer {
            padding: 16px 20px;
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

