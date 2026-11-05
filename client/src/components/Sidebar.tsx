import React from 'react';
import { NavLink, Link } from 'react-router-dom';
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
  MessageSquare,
  LogOut,
  X,
} from 'lucide-react';

interface SidebarProps {
  espConnected: boolean;
  onLogout?: () => void;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  espConnected,
  onLogout,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const menuItems = [
    { name: 'Home',            path: '/',               icon: Home },
    { name: 'Dashboard',       path: '/dashboard',      icon: LayoutDashboard },
    { name: 'Live Workout',    path: '/live',           icon: Activity },
    { name: 'Coach Comments',  path: '/coach-comments', icon: MessageSquare },
    { name: 'Exercises',       path: '/exercises',      icon: Dumbbell },
    { name: 'Analytics',       path: '/analytics',      icon: TrendingUp },
    { name: 'Workout History', path: '/history',        icon: History },
    { name: 'Sensor Telemetry',path: '/sensors',        icon: Cpu },
    { name: 'Trainer Portal',  path: '/trainer',        icon: UserCheck },
    { name: 'Settings',        path: '/profile',        icon: Settings },
  ];

  return (
    <>
      {/* ── Desktop & Tablet Compact Sidebar (70-80px width) ───────────────── */}
      <aside
        className="hidden md:flex w-20 bg-gym-panel border-r border-gym-border flex-col h-screen sticky top-0 z-40 select-none"
        style={{
          boxShadow: '2px 0 24px rgba(0, 0, 0, 0.45)',
        }}
      >
        {/* Top Logo */}
        <div className="h-[68px] flex items-center justify-center border-b border-gym-border flex-shrink-0">
          <Link
            to="/"
            className="group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 focus:outline-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,122,0,0.18) 0%, rgba(255,122,0,0.06) 100%)',
              border: '1px solid rgba(255, 122, 0, 0.32)',
              boxShadow: '0 0 16px rgba(255, 122, 0, 0.15)',
            }}
            aria-label="Smart Gym Home"
          >
            <Dumbbell className="w-6 h-6 text-gym-accent transition-transform duration-200 group-hover:rotate-12" />

            {/* Logo Tooltip */}
            <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
              <div className="relative px-3 py-1.5 rounded-lg bg-[#222228] border border-[#303036] text-[#F5F5F5] text-xs font-bold font-display tracking-wider whitespace-nowrap shadow-xl shadow-black/70 flex items-center">
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-[6px] border-r-[#303036]" />
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[3px] border-y-transparent border-r-[5px] border-r-[#222228]" />
                SMART GYM
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Icons (Vertically aligned with equal spacing) */}
        <nav className="flex-1 py-4 flex flex-col items-center gap-2 overflow-y-auto overflow-x-visible no-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 focus:outline-none ${
                    isActive
                      ? 'bg-gym-accent text-[#0B0B0D] font-bold shadow-[0_4px_18px_rgba(255,122,0,0.38)]'
                      : 'text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#222228]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-[#0B0B0D] stroke-[2.4]' : 'text-[#A1A1AA] group-hover:text-[#F5F5F5]'
                      }`}
                    />

                    {/* Sensor status dot on Telemetry icon */}
                    {item.path === '/sensors' && (
                      <span
                        className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${
                          isActive
                            ? 'bg-[#0B0B0D]'
                            : espConnected
                              ? 'bg-gym-accent animate-pulse shadow-[0_0_6px_rgba(255,122,0,0.9)]'
                              : 'bg-gym-accentRed shadow-[0_0_6px_rgba(255,77,90,0.9)]'
                        }`}
                      />
                    )}

                    {/* Hover Tooltip */}
                    <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                      <div className="relative px-3 py-1.5 rounded-lg bg-[#222228] border border-[#303036] text-[#F5F5F5] text-xs font-semibold font-sans tracking-wide whitespace-nowrap shadow-xl shadow-black/70 flex items-center">
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-[6px] border-r-[#303036]" />
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[3px] border-y-transparent border-r-[5px] border-r-[#222228]" />
                        {item.name}
                      </div>
                    </div>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Logout Button */}
        <div className="p-3 border-t border-gym-border flex items-center justify-center flex-shrink-0">
          <button
            onClick={onLogout}
            title="Sign Out"
            className="group relative w-12 h-12 rounded-2xl flex items-center justify-center text-[#A1A1AA] hover:text-gym-accentRed hover:bg-[#222228] transition-all duration-200 focus:outline-none"
            aria-label="Sign Out"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />

            {/* Logout Tooltip */}
            <div className="absolute left-[calc(100%+14px)] top-1/2 -translate-y-1/2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
              <div className="relative px-3 py-1.5 rounded-lg bg-[#222228] border border-[#303036] text-[#F5F5F5] text-xs font-semibold font-sans tracking-wide whitespace-nowrap shadow-xl shadow-black/70 flex items-center">
                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent border-r-[6px] border-r-[#303036]" />
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[3px] border-y-transparent border-r-[5px] border-r-[#222228]" />
                Sign Out
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* ── Mobile Collapsible Navigation Menu ─────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen && setMobileOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-64 bg-gym-panel border-r border-gym-border flex flex-col h-full z-10 shadow-2xl animate-fade-in">
            {/* Drawer Header */}
            <div className="h-[68px] px-5 flex items-center justify-between border-b border-gym-border">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,122,0,0.22) 0%, rgba(255,122,0,0.08) 100%)',
                    border: '1px solid rgba(255,122,0,0.35)',
                  }}
                >
                  <Dumbbell className="w-5 h-5 text-gym-accent" />
                </div>
                <div>
                  <h1 className="font-display font-black text-sm tracking-wider text-gym-text leading-tight">
                    SMART <span className="text-gym-accent">GYM</span>
                  </h1>
                  <span className="text-[9px] text-gym-muted font-display tracking-widest uppercase block">
                    Menu
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMobileOpen && setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gym-muted hover:text-gym-text hover:bg-gym-cardAlt transition-colors"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gym-accent text-[#0B0B0D] font-bold shadow-[0_4px_16px_rgba(255,122,0,0.30)]'
                          : 'text-[#A1A1AA] hover:text-[#F5F5F5] hover:bg-[#222228]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            isActive ? 'text-[#0B0B0D] stroke-[2.4]' : 'text-[#A1A1AA]'
                          }`}
                        />
                        <span className="truncate">{item.name}</span>
                        {item.path === '/sensors' && (
                          <span
                            className={`ml-auto w-2 h-2 rounded-full ${
                              espConnected ? 'bg-gym-accent animate-pulse' : 'bg-gym-accentRed'
                            }`}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Drawer Logout */}
            <div className="p-4 border-t border-gym-border">
              <button
                onClick={() => {
                  if (setMobileOpen) setMobileOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gym-accentRed bg-gym-accentRed/10 border border-gym-accentRed/25 hover:bg-gym-accentRed/20 transition-all duration-200"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
