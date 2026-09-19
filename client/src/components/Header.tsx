import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  Clock, 
  LogOut, 
  Cpu
} from 'lucide-react';

interface HeaderProps {
  username: string;
  espConnected: boolean;
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
  onLogout: () => void;
  latency?: number;
}

export const Header: React.FC<HeaderProps> = ({
  username,
  espConnected,
  demoMode,
  setDemoMode,
  onLogout,
  latency = 5
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
    <header className="h-20 border-b border-gym-border bg-gym-panel/50 backdrop-blur-md sticky top-0 z-30 px-8 flex items-center justify-between">
      {/* Telemetry Status bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <Wifi className={`w-4 h-4 ${espConnected ? 'text-gym-accent animate-pulse-slow' : 'text-gym-muted'}`} />
          <span className="text-xs font-mono font-medium tracking-wide">
            RSSI: {espConnected ? '-58 dBm' : 'N/A'}
          </span>
        </div>
        <div className="h-4 w-px bg-gym-border" />
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gym-accentBlue" />
          <span className="text-xs font-mono font-medium tracking-wide">
            {currentTime || '00:00:00'}
          </span>
        </div>
        <div className="h-4 w-px bg-gym-border" />
        <div className="flex items-center gap-2">
          <Cpu className={`w-4 h-4 ${espConnected ? 'text-gym-accent' : 'text-gym-muted'}`} />
          <span className="text-xs font-mono font-medium tracking-wide">
            LATENCY: {espConnected ? `${latency} ms` : '--'}
          </span>
        </div>
      </div>

      {/* Quick Controls & User Profile */}
      <div className="flex items-center gap-6">
        {/* Demo Mode Toggle */}
        <div className="flex items-center gap-3 bg-gym-card/80 border border-gym-border py-1.5 px-4 rounded-full shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-widest font-display text-gym-muted uppercase font-bold">
              Demo Simulation Mode
            </span>
          </div>
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              demoMode ? 'bg-gym-accent' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                demoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gym-card border border-gym-border py-1.5 px-3 rounded-xl">
            <div className="w-7 h-7 bg-gym-accentBlue/10 border border-gym-accentBlue/30 text-gym-accentBlue rounded-full flex items-center justify-center font-bold text-xs uppercase">
              {username.charAt(0)}
            </div>
            <div className="text-left">
              <div className="text-[9px] font-bold text-gym-muted font-display tracking-wider leading-none uppercase">
                ATHLETE
              </div>
              <div className="text-xs font-semibold text-gym-text leading-tight mt-0.5">
                {username || 'Mohamed'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Disconnect & Logout"
            className="p-2.5 rounded-xl border border-gym-border bg-gym-card hover:bg-gym-accentRed/10 hover:border-gym-accentRed/30 text-gym-muted hover:text-gym-accentRed transition-all duration-200"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
