import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  Cpu, 
  Database, 
  TrendingUp, 
  Play, 
  LayoutDashboard,
  Shield, 
  Zap, 
  CheckCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const workflowSteps = [
    { name: 'SENSING', desc: 'Raw biomechanical measurement', icon: Cpu, color: 'text-gym-accent border-gym-accent/30 bg-gym-accent/5' },
    { name: 'IMU + LOAD CELL', desc: '6-axis kinematics & load measurement', icon: Dumbbell, color: 'text-gym-accentBlue border-gym-accentBlue/30 bg-gym-accentBlue/5' },
    { name: 'ESP32 EDGE PROCESSING', desc: 'Sensor fusion & threshold logic', icon: Cpu, color: 'text-gym-accentYellow border-gym-accentYellow/30 bg-gym-accentYellow/5' },
    { name: 'DATA TRANSMISSION', desc: 'High-speed WebSocket streams', icon: Zap, color: 'text-purple-400 border-purple-500/30 bg-purple-500/5' },
    { name: 'DATABASE & ENGINE', desc: 'SQLite logs & analytics calculation', icon: Database, color: 'text-blue-400 border-blue-500/30 bg-blue-500/5' },
    { name: 'WEB DASHBOARD', desc: 'Futuristic telemetry interface', icon: LayoutDashboard, color: 'text-gym-accent border-gym-accent/30 bg-gym-accent/5' },
  ];

  const features = [
    { title: 'Real-time Kinematic Telemetry', desc: 'Visualizes high-frequency 6-axis IMU raw wave streams (Accelerometer X/Y/Z, Gyroscope X/Y/Z) at 10Hz to measure lift speed and bar displacement.', icon: Zap },
    { title: 'Dynamic Load Calibration', desc: 'Monitors load cell strain gauges to record instantaneous muscle force, static weights, and weight distribution curves.', icon: Dumbbell },
    { title: 'AI-Powered Form Coach', desc: 'Analyzes movement symmetry and rotational angular velocity to give real-time feedback (e.g. GOOD FORM, MOVEMENT TOO FAST, CORRECT POSTURE).', icon: Shield },
    { title: 'Detailed Analytics & Logs', desc: 'Logs completed sets directly to an SQLite database, plotting daily/weekly/monthly progression charts and workout metrics.', icon: TrendingUp },
  ];

  return (
    <div className="space-y-12 py-6 max-w-6xl mx-auto animate-fade-in">
      {/* Hero Section */}
      <div className="glass-panel p-10 md:p-14 relative overflow-hidden flex flex-col items-center text-center tech-grid-bg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gym-accent/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gym-accentBlue/10 rounded-full blur-3xl -z-10" />

        <div className="flex items-center gap-3 bg-gym-accent/10 border border-gym-accent/30 py-2 px-5 rounded-full mb-6">
          <Cpu className="w-5 h-5 text-gym-accent animate-pulse-slow" />
          <span className="text-xs font-semibold tracking-wider font-display text-gym-accent uppercase">
            Final-Year B.Tech Mechatronics Demonstration
          </span>
        </div>

        <h1 className="font-display font-black text-4xl md:text-5xl lg:text-6xl tracking-wide leading-tight max-w-4xl text-gym-text">
          SMART GYM PERFORMANCE <br />
          <span className="bg-gradient-to-r from-gym-accent via-teal-400 to-gym-accentBlue bg-clip-text text-transparent glow-text-green">
            MONITORING & ANALYTICS
          </span>
        </h1>

        <p className="text-gym-muted max-w-2xl text-sm md:text-base mt-6 font-sans leading-relaxed">
          An advanced sensor-integrated mechatronics solution combining 6-axis IMU sensors, load cell force transducers, ESP32 edge processing, and high-speed WebSockets telemetry for real-time form assessment.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mt-10 w-full sm:w-auto">
          <button
            onClick={() => navigate('/live')}
            className="flex items-center justify-center gap-2 bg-gym-accent hover:bg-gym-accent/90 text-gym-dark font-display font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-gym-accent/20 transition-all duration-200 hover:-translate-y-0.5"
          >
            <Play className="w-5 h-5 fill-gym-dark" />
            Start Workout Session
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 bg-gym-card hover:bg-slate-800 border border-gym-border hover:border-gym-muted/30 font-display font-bold px-8 py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
          >
            <LayoutDashboard className="w-5 h-5 text-gym-accentBlue" />
            View Telemetry Dashboard
          </button>
        </div>
      </div>

      {/* System Workflow Architecture */}
      <div className="glass-panel p-8 md:p-10 space-y-8">
        <div className="text-center md:text-left">
          <h2 className="font-display font-bold text-2xl tracking-wide">
            SYSTEM ARCHITECTURE & DATA WORKFLOW
          </h2>
          <p className="text-xs text-gym-muted uppercase tracking-widest font-display mt-1">
            End-to-End Mechatronics Architecture Block Diagram
          </p>
        </div>

        {/* Workflow Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 relative">
          {workflowSteps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="relative flex flex-col items-center text-center group">
                {/* Visual Node */}
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${step.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {/* Arrow Connector (only for large layout) */}
                {idx < 5 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+1.75rem)] w-[calc(100%-3.5rem)] h-[1px] bg-gym-border z-0" />
                )}
                {/* Text Description */}
                <h3 className="font-display font-bold text-xs mt-4 text-gym-text tracking-wide uppercase">
                  {step.name}
                </h3>
                <p className="text-[10px] text-gym-muted mt-1 leading-normal max-w-[130px]">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Core Project Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div key={idx} className="glass-panel p-8 flex items-start gap-5 glass-panel-interactive">
              <div className="bg-gym-accentBlue/10 p-3 rounded-xl border border-gym-accentBlue/20 text-gym-accentBlue">
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-bold text-base tracking-wide text-gym-text">
                  {feat.title}
                </h3>
                <p className="text-xs text-gym-muted leading-relaxed font-sans">
                  {feat.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hardware / Software Specifications */}
      <div className="glass-panel p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="font-display font-bold text-2xl tracking-wide text-gym-text">
              HARDWARE & EDGE SPECS
            </h2>
            <p className="text-xs text-gym-muted font-display uppercase tracking-widest leading-none">
              Physical System Components
            </p>
          </div>
          
          <ul className="space-y-3">
            {[
              'ESP32 Microcontroller: 240MHz dual-core Xtensa CPU with integrated Wi-Fi and Bluetooth.',
              'MPU6050 IMU: 6-axis accelerometer and gyroscope measuring bar kinematics.',
              'HX711 Load Cell: 24-bit ADC weight sensor supporting dynamic loading force.',
              'Edge processing algorithms written in C++ filtering sensor noise (moving average/Kalman filters).',
              'Dual WebSocket protocols pushing binary telemetry datasets at 10Hz frequency.'
            ].map((spec, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-gym-accent flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gym-muted leading-relaxed">{spec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-gym-card/45 border border-gym-border p-6 rounded-2xl space-y-4">
          <h3 className="font-display font-bold text-xs tracking-wider uppercase text-gym-accent">
            📊 Mechatronics Signal Diagram
          </h3>
          <div className="aspect-video bg-gym-dark/80 rounded-xl border border-gym-border relative overflow-hidden flex flex-col justify-end p-4 font-mono text-[10px] text-gym-accent">
            {/* Mock oscilloscope grids */}
            <div className="absolute inset-0 tech-grid-bg opacity-30" />
            <div className="absolute top-2 left-2 text-[9px] text-gym-muted font-display">ESP32 TX: WS_STREAM</div>
            <div className="absolute top-2 right-2 text-[9px] text-gym-accent animate-pulse-slow">🟢 LIVE STREAMING</div>
            
            {/* Animated sensor waveforms */}
            <svg className="w-full h-2/3 absolute bottom-8 left-0 text-gym-accent stroke-current" viewBox="0 0 300 80" fill="none">
              <path d="M 0 40 Q 25 10 50 40 T 100 40 T 150 40 T 200 40 T 250 40 T 300 40" strokeWidth="2" />
            </svg>
            <svg className="w-full h-2/3 absolute bottom-8 left-0 text-gym-accentBlue stroke-current opacity-70" viewBox="0 0 300 80" fill="none">
              <path d="M 0 40 Q 30 70 60 40 T 120 40 T 180 40 T 240 40 T 300 40" strokeWidth="1.5" />
            </svg>

            <div className="flex justify-between items-center z-10 text-[9px] text-gym-muted">
              <span>Acc Y: 9.8 m/s² (±1.5)</span>
              <span>Load: 40.0 kg (±4.0)</span>
              <span>Freq: 10.2Hz</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
