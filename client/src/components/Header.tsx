import React, { useEffect, useState } from 'react';
import { Wifi, Clock, LogOut, Cpu, Menu } from 'lucide-react';

interface HeaderProps {
  username: string;
  espConnected: boolean;
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  onLogout: () => void;
  latency?: number;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  username,
  espConnected,
  demoMode,
  setDemoMode,
  onLogout,
  latency = 5,
  onToggleMobileNav,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className="h-18 border-b border-gym-border sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between"
      style={{
        height: '68px',
        background: 'rgba(17, 17, 20, 0.92)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 1px 0 rgba(48, 48, 54, 0.8), 0 4px 24px rgba(0,0,0,0.45)',
      }}
    >
      {/* ── Left: Mobile Toggle & Telemetry Status Bar ────────────────── */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Mobile Menu Hamburger */}
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 rounded-xl border border-gym-border text-gym-muted hover:text-gym-text bg-gym-card/60 hover:bg-gym-cardAlt transition-colors focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* WiFi Signal */}
        <div className="flex items-center gap-2">
          <Wifi className={`w-4 h-4 ${espConnected ? 'text-gym-accent' : 'text-gym-muted'}`}
            style={espConnected ? { filter: 'drop-shadow(0 0 4px rgba(255,122,0,0.7))' } : undefined} />
          <span className="text-[11px] font-mono font-medium tracking-wide text-gym-muted">
            RSSI: <span className={espConnected ? 'text-gym-accent' : 'text-gym-muted'}>{espConnected ? '-58 dBm' : 'N/A'}</span>
          </span>
        </div>

        <div className="hidden sm:block h-4 w-px bg-gym-border" />

        {/* Clock */}
        <div className="hidden sm:flex items-center gap-2">
          <Clock className="w-4 h-4 text-gym-accentBlue" />
          <span className="text-[11px] font-mono font-medium tracking-wide text-gym-muted">
            <span className="text-gym-text">{currentTime || '00:00:00'}</span>
          </span>
        </div>

        <div className="hidden md:block h-4 w-px bg-gym-border" />

        {/* Latency */}
        <div className="hidden md:flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${espConnected ? 'text-gym-accent' : 'text-gym-muted'}`} />
          <span className="text-[11px] font-mono font-medium tracking-wide text-gym-muted">
            LATENCY: <span className={espConnected ? 'text-gym-accent' : 'text-gym-muted'}>{espConnected ? `${latency} ms` : '--'}</span>
          </span>
        </div>
      </div>

      {/* ── Right: Controls & User ────────────────────────────────────── */}
      <div className="flex items-center gap-4">

        {/* Demo Mode Toggle */}
        <div className="flex items-center gap-3 py-1.5 px-4 rounded-full border border-gym-border"
          style={{ background: 'rgba(26, 26, 31, 0.95)' }}>
          <span className="text-[10px] tracking-widest font-display text-gym-muted uppercase font-bold">
            Demo Mode
          </span>
          <button
            onClick={() => setDemoMode(!demoMode)}
            className="relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 focus:outline-none"
            style={{
              background: demoMode ? '#FF7A00' : '#303036',
              boxShadow: demoMode ? '0 0 12px rgba(255,122,0,0.50)' : 'none',
            }}
            aria-label="Toggle demo simulation mode"
          >
            <span
              className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300"
              style={{
                transform: demoMode ? 'translateX(22px)' : 'translateX(3px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 border border-gym-border rounded-xl px-3 py-1.5"
          style={{ background: 'rgba(26, 26, 31, 0.95)' }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] uppercase"
            style={{
              background: 'linear-gradient(135deg, rgba(255,122,0,0.25) 0%, rgba(255,122,0,0.10) 100%)',
              border: '1.5px solid rgba(255,122,0,0.40)',
              color: '#FF7A00',
              boxShadow: '0 0 10px rgba(255,122,0,0.25)',
            }}>
            {username.charAt(0) || 'A'}
          </div>
          <div className="text-left">
            <div className="text-[9px] font-bold text-gym-muted font-display tracking-wider uppercase leading-none">
              ATHLETE
            </div>
            <div className="text-xs font-semibold text-gym-text leading-tight mt-0.5">
              {username || 'Athlete'}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          title="Disconnect & Logout"
          className="p-2.5 rounded-xl border border-gym-border transition-all duration-200 text-gym-muted hover:text-gym-accentRed group"
          style={{ background: 'rgba(26, 26, 31, 0.95)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,77,90,0.35)';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,77,90,0.12)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#303036';
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(26, 26, 31, 0.95)';
          }}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
