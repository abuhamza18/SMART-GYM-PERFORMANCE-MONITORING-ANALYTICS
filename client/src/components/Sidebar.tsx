import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  LayoutDashboard, 
  Activity, 
  Dumbbell, 
  TrendingUp, 
  History, 
  Cpu, 
  UserCheck, 
  Settings,
  Radio,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  espConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ espConnected }) => {
  const menuItems = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Workout', path: '/live', icon: Activity },
    { name: 'Coach Comments', path: '/coach-comments', icon: MessageSquare },
    { name: 'Exercises', path: '/exercises', icon: Dumbbell },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp },
    { name: 'Workout History', path: '/history', icon: History },
    { name: 'Sensor Telemetry', path: '/sensors', icon: Cpu },
    { name: 'Trainer Portal', path: '/trainer', icon: UserCheck },
    { name: 'Settings', path: '/profile', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-gym-panel border-r border-gym-border flex flex-col h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-gym-border flex items-center gap-3">
        <div className="bg-gym-accent/10 p-2.5 rounded-xl border border-gym-accent/30 flex items-center justify-center">
          <Dumbbell className="w-6 h-6 text-gym-accent animate-pulse-slow" />
        </div>
        <div>
          <h1 className="font-display font-black text-lg tracking-wider text-gym-text leading-tight">
            SMART <span className="text-gym-accent">GYM</span>
          </h1>
          <span className="text-[10px] text-gym-muted font-display tracking-widest uppercase block mt-0.5">
            Performance Monitor
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 pl-4 pr-3 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gym-accent/10 border border-gym-accent/25 text-gym-accent font-semibold shadow-lg shadow-gym-accent/5'
                    : 'text-gym-muted hover:text-gym-text hover:bg-slate-800/40 border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-gym-accent' : 'text-gym-muted group-hover:text-gym-text'
                  }`} />
                  <span className="truncate">{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ESP32 Status Block in Footer */}
      <div className="p-4 border-t border-gym-border">
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${
          espConnected 
            ? 'bg-gym-accent/5 border-gym-accent/20' 
            : 'bg-gym-accentRed/5 border-gym-accentRed/20'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gym-muted font-display font-medium">MCU INTERFACE</span>
            <Radio className={`w-3.5 h-3.5 ${
              espConnected ? 'text-gym-accent animate-ping' : 'text-gym-accentRed'
            }`} />
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${
              espConnected ? 'bg-gym-accent animate-pulse-slow' : 'bg-gym-accentRed'
            }`} />
            <span className="text-sm font-semibold tracking-wide font-display">
              {espConnected ? 'ESP32 ONLINE' : 'ESP32 OFFLINE'}
            </span>
          </div>
          <span className="text-[10px] text-gym-muted mt-1 block font-mono">
            {espConnected ? 'Port: WebSocket (10Hz)' : 'System Simulated'}
          </span>
        </div>
      </div>
    </aside>
  );
};
