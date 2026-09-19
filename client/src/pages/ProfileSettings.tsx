import React, { useEffect, useState } from 'react';
import { User, Shield, Sliders, Check, AlertCircle } from 'lucide-react';

export const ProfileSettings: React.FC = () => {
  // Biometrics fields
  const [email, setEmail] = useState('');
  const [weightKg, setWeightKg] = useState(75);
  const [targetCalories, setTargetCalories] = useState(500);
  const [username, setUsername] = useState('Mohamed');

  const [alertFormWarning, setAlertFormWarning] = useState(true);

  // Microcontroller Calibration
  const [imuNoiseThreshold, setImuNoiseThreshold] = useState(0.15); // m/s^2
  const [loadCellZeroOffset, setLoadCellZeroOffset] = useState(0.4); // kg

  const [status, setStatus] = useState<'idle' | 'updating' | 'success' | 'error'>('idle');

  const fetchProfile = async () => {
    try {
      let token = localStorage.getItem('gym_token');
      let res = await fetch('/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok && (res.status === 401 || res.status === 403 || !token)) {
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'Mohamed', password: 'password123' })
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.token) {
            token = loginData.token;
            localStorage.setItem('gym_token', token);
            res = await fetch('/api/profile', {
              headers: { Authorization: `Bearer ${token}` }
            });
          }
        }
      }

      if (res.ok) {
        const data = await res.json();
        setEmail(data.email || '');
        setWeightKg(data.weight_kg || 75);
        setTargetCalories(data.target_calories || 500);
        setUsername(data.username || 'Mohamed');
      }
    } catch (err) {
      console.error('Error fetching profile detail:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('updating');
    try {
      let token = localStorage.getItem('gym_token');
      let res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          weight_kg: weightKg,
          target_calories: targetCalories
        })
      });

      if (!res.ok && (res.status === 401 || res.status === 403)) {
        const loginRes = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'Mohamed', password: 'password123' })
        });
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.token) {
            token = loginData.token;
            localStorage.setItem('gym_token', token);
            res = await fetch('/api/profile', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                email,
                weight_kg: weightKg,
                target_calories: targetCalories
              })
            });
          }
        }
      }

      if (res.ok) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 1500);
      } else {
        setStatus('error');
      }
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="space-y-6 py-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-wide text-gym-text">
          ATHLETE PROFILE & HARDWARE SETTINGS
        </h2>
        <p className="text-xs text-gym-muted uppercase tracking-widest font-display mt-1">
          Biometrics Management & ESP32 Telemetry Calibration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Form Settings */}
        <form onSubmit={handleSaveProfile} className="md:col-span-2 glass-panel p-6 space-y-6">
          <h3 className="font-display font-bold text-sm tracking-wide text-gym-text uppercase border-b border-gym-border pb-3 flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-gym-accent" />
            Biometric Parameters
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group space-y-1.5">
              <label className="text-[10px] uppercase font-display font-bold text-gym-muted">Athlete Username</label>
              <input
                type="text"
                disabled
                value={username}
                className="w-full bg-gym-dark/50 border border-gym-border rounded-xl px-4 py-2.5 text-xs text-gym-muted font-semibold outline-none cursor-not-allowed"
              />
            </div>
            <div className="form-group space-y-1.5">
              <label className="text-[10px] uppercase font-display font-bold text-gym-muted font-sans">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@example.com"
                className="w-full bg-gym-card border border-gym-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-gym-accent text-gym-text font-semibold"
              />
            </div>
            <div className="form-group space-y-1.5">
              <label className="text-[10px] uppercase font-display font-bold text-gym-muted">Athlete Weight (kg)</label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                step="0.5"
                className="w-full bg-gym-card border border-gym-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-gym-accent text-gym-text font-semibold"
              />
            </div>
            <div className="form-group space-y-1.5">
              <label className="text-[10px] uppercase font-display font-bold text-gym-muted">Calorie target (kcal)</label>
              <input
                type="number"
                value={targetCalories}
                onChange={(e) => setTargetCalories(parseInt(e.target.value) || 0)}
                className="w-full bg-gym-card border border-gym-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-gym-accent text-gym-text font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            {status === 'updating' && <span className="text-xs text-gym-accentBlue">Saving details to SQLite...</span>}
            {status === 'success' && <span className="text-xs text-gym-accent font-bold flex items-center gap-1.5">
              <Check className="w-4.5 h-4.5" /> Profile updated successfully!
            </span>}
            {status === 'error' && <span className="text-xs text-gym-accentRed font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4.5 h-4.5" /> Failed to save profile details.
            </span>}
            {status === 'idle' && <div />}
            
            <button
              type="submit"
              className="bg-gym-accent hover:bg-gym-accent/90 text-gym-dark font-display font-bold text-xs px-6 py-2.5 rounded-xl transition-all duration-200"
            >
              Save Parameters
            </button>
          </div>
        </form>

        {/* Right Column: calibration & micro config */}
        <div className="space-y-6">
          
          {/* Microcontroller Calibration Configuration */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-display font-bold text-sm tracking-wide text-gym-text uppercase border-b border-gym-border pb-3 flex items-center gap-2">
              <Sliders className="w-4.5 h-4.5 text-gym-accentBlue" />
              ESP32 Calibrations
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="form-group space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[10px] uppercase font-display font-bold text-gym-muted">IMU Noise Filter Threshold</label>
                  <span className="text-gym-accentBlue font-mono font-bold">{imuNoiseThreshold} m/s²</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.5"
                  step="0.05"
                  value={imuNoiseThreshold}
                  onChange={(e) => setImuNoiseThreshold(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gym-border rounded-lg appearance-none cursor-pointer accent-gym-accentBlue"
                />
              </div>

              <div className="form-group space-y-1.5">
                <div className="flex justify-between">
                  <label className="text-[10px] uppercase font-display font-bold text-gym-muted">Load Cell Zero Offset</label>
                  <span className="text-gym-accentBlue font-mono font-bold">{loadCellZeroOffset} kg</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={loadCellZeroOffset}
                  onChange={(e) => setLoadCellZeroOffset(parseFloat(e.target.value))}
                  className="w-full h-1 bg-gym-border rounded-lg appearance-none cursor-pointer accent-gym-accentBlue"
                />
              </div>
            </div>
          </div>

          {/* System Notification settings */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="font-display font-bold text-sm tracking-wide text-gym-text uppercase border-b border-gym-border pb-3 flex items-center gap-2">
              <Shield className="w-4.5 h-4.5 text-gym-accentYellow" />
              Prescriptive coach
            </h3>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gym-muted leading-tight">Enable Live Audio warnings</span>
                <button
                  type="button"
                  onClick={() => setAlertFormWarning(!alertFormWarning)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    alertFormWarning ? 'bg-gym-accent' : 'bg-slate-700'
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    alertFormWarning ? 'translate-x-4.5' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gym-muted leading-tight">Display WiFi Signal Warn Banners</span>
                <span className="text-[10px] text-gym-accent font-display font-bold">ALWAYS ON</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
