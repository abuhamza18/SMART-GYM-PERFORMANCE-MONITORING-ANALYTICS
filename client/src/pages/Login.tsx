import React, { useState } from 'react';
import { Dumbbell, User, Lock, Mail, AlertTriangle, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Helper for demo account fallback when offline or deployed as static SPA without API backend
  const handleClientFallbackAuth = (isReg: boolean, userStr: string, passStr: string) => {
    const seedPasswords: Record<string, string> = {
      'Mohamed': 'password123',
      'Sarah Chen': 'password123',
      'Alex Rivera': 'password123',
      'Emma Watson': 'password123',
      'Marcus Vance': 'password123'
    };

    if (isReg) {
      const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '{}');
      storedUsers[userStr] = passStr;
      localStorage.setItem('registered_users', JSON.stringify(storedUsers));
      setSuccess('Registration successful! Please login with your security password.');
      setIsRegister(false);
      setPassword('');
      return;
    }

    const storedUsers = JSON.parse(localStorage.getItem('registered_users') || '{}');
    const validPassword = seedPasswords[userStr] || storedUsers[userStr];

    if (validPassword && validPassword === passStr) {
      const demoToken = 'demo-token-' + btoa(userStr + ':' + Date.now());
      onLoginSuccess(demoToken, userStr);
    } else if (seedPasswords[userStr] || storedUsers[userStr]) {
      throw new Error('Invalid security password for athlete username: ' + userStr);
    } else {
      if (passStr === 'password123') {
        const demoToken = 'demo-token-' + btoa(userStr + ':' + Date.now());
        onLoginSuccess(demoToken, userStr);
      } else {
        throw new Error('Invalid credentials. (Hint: Use demo password "password123")');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    const endpoint = isRegister ? '/api/register' : '/api/login';
    const url = apiBase ? `${apiBase}${endpoint}` : endpoint;
    const body = isRegister ? { username, password, email } : { username, password };

    try {
      let res: Response | null = null;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
      } catch (netErr) {
        console.warn('Backend API fetch error, using local auth fallback:', netErr);
      }

      if (res) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          try {
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data.error || data.message || `Authentication failed (${res.status})`);
            }
            if (isRegister) {
              setSuccess('Registration successful! Please login.');
              setIsRegister(false);
              setPassword('');
            } else {
              onLoginSuccess(data.token, data.username || username);
            }
            return;
          } catch (jsonErr: any) {
            if (jsonErr.message && !jsonErr.message.includes('JSON')) {
              throw jsonErr;
            }
            console.warn('API returned non-JSON despite application/json header:', jsonErr);
          }
        } else {
          const rawText = await res.text().catch(() => '');
          console.warn('Server returned non-JSON response:', rawText);
        }
      }

      // Fallback auth if server API is not available or returned non-JSON (e.g. 404 HTML SPA page on Vercel)
      handleClientFallbackAuth(isRegister, username, password);

    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gym-dark flex flex-col justify-center items-center px-4 relative overflow-hidden tech-grid-bg">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gym-accent/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gym-accentBlue/5 rounded-full blur-3xl -z-10" />

      {/* Main Login Card */}
      <div className="glass-panel p-8 w-full max-w-md space-y-8 animate-slide-up relative">
        
        {/* Brand logo header */}
        <div className="text-center space-y-2">
          <div className="inline-flex bg-gym-accent/15 p-3 rounded-2xl border border-gym-accent/30 text-gym-accent mb-2">
            <Dumbbell className="w-8 h-8 animate-pulse-slow" />
          </div>
          <h2 className="font-display font-black text-2xl tracking-wider text-gym-text">
            SMART <span className="text-gym-accent">GYM</span> TELEMETRY
          </h2>
          <p className="text-xs text-gym-muted font-display uppercase tracking-widest leading-none mt-1">
            Kinematic Calibration Interface
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-gym-accentRed/5 border border-gym-accentRed/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-gym-accentRed leading-normal">
              <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-gym-accent/5 border border-gym-accent/30 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-gym-accent leading-normal">
              <ShieldCheck className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Username */}
            <div className="form-group space-y-1.5">
              <label className="text-[10px] uppercase font-display font-bold text-gym-muted">Username</label>
              <div className="flex items-center gap-2.5 bg-gym-card border border-gym-border rounded-xl px-3.5 py-2.5 focus-within:border-gym-accent transition-colors">
                <User className="w-4 h-4 text-gym-muted" />
                <input
                  type="text"
                  required
                  placeholder="Demo Username: Mohamed"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-transparent text-xs text-gym-text outline-none w-full"
                />
              </div>
            </div>

            {/* Email (only if register) */}
            {isRegister && (
              <div className="form-group space-y-1.5 animate-fade-in">
                <label className="text-[10px] uppercase font-display font-bold text-gym-muted">Email Address</label>
                <div className="flex items-center gap-2.5 bg-gym-card border border-gym-border rounded-xl px-3.5 py-2.5 focus-within:border-gym-accent transition-colors">
                  <Mail className="w-4 h-4 text-gym-muted" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-transparent text-xs text-gym-text outline-none w-full"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="form-group space-y-1.5">
              <label className="text-[10px] uppercase font-display font-bold text-gym-muted">Security Password</label>
              <div className="flex items-center gap-2.5 bg-gym-card border border-gym-border rounded-xl px-3.5 py-2.5 focus-within:border-gym-accent transition-colors">
                <Lock className="w-4 h-4 text-gym-muted" />
                <input
                  type="password"
                  required
                  placeholder="Demo Password: password123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-xs text-gym-text outline-none w-full"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gym-accent hover:bg-gym-accent/90 text-gym-dark font-display font-bold py-3.5 rounded-xl text-xs transition-colors shadow-lg shadow-gym-accent/15 mt-2"
          >
            {loading ? 'Processing telemetry...' : isRegister ? 'Register Account' : 'Authenticate & Unlock'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2 border-t border-gym-border text-xs text-gym-muted">
          {isRegister ? (
            <button 
              onClick={() => { setIsRegister(false); setError(''); }}
              className="text-gym-accentBlue font-bold hover:underline"
            >
              Sign in with existing credentials
            </button>
          ) : (
            <span>
              New microcontroller node?{' '}
              <button 
                onClick={() => { setIsRegister(true); setError(''); }}
                className="text-gym-accent font-bold hover:underline"
              >
                Register Athlete profile
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
