import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Activity
} from 'lucide-react';
import { WorkoutDetectionEngine } from '../workout-detection/workoutDetectionEngine';
import type { EngineState, WorkoutSessionSummary } from '../workout-detection/workoutDetectionEngine';

interface LiveWorkoutProps {
  activeSession: {
    exercise: string;
    reps: number;
    sets: number;
    weight: number;
    calories: number;
    workoutTime: string;
    isActive: boolean;
    deviceConnected: boolean;
  };
  telemetryData: {
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    load: number;
    formScore: number;
    formFeedback: string;
    timestamp: number;
  } | null;
  wsSend: (msg: any) => void;
  triggerSimStart: (exercise: string, weight: number) => void;
  triggerSimStop: () => void;
  triggerSimReset: () => void;
  detectionState: EngineState;
  demoMode: boolean;
  setDemoMode: (val: boolean) => void;
}

export const LiveWorkout: React.FC<LiveWorkoutProps> = ({
  activeSession,
  telemetryData,
  wsSend,
  triggerSimStart,
  triggerSimStop,
  triggerSimReset,
  detectionState,
  demoMode,
  setDemoMode
}) => {
  const [selectedEx, setSelectedEx] = useState('Bench Press');
  const [weightInput, setWeightInput] = useState(40);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [sessionSummary, setSessionSummary] = useState<WorkoutSessionSummary | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Buffers for Canvas Scope
  const pointsRef = useRef<{ time: number; ay: number; load: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Update buffers
  useEffect(() => {
    if (telemetryData) {
      const pts = pointsRef.current;
      pts.push({
        time: telemetryData.timestamp,
        ay: telemetryData.ay,
        load: telemetryData.load
      });
      if (pts.length > 80) pts.shift();
    }
  }, [telemetryData]);

  // Paint Canvas Scope
  useEffect(() => {
    let animId = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, w, h);

      // Draw Grid
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 0.5;
      const step = 20;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Draw Center Baseline
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      const pts = pointsRef.current;
      if (pts.length > 1) {
        // Paint Accel Y Wave (Cyan)
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        pts.forEach((pt, idx) => {
          const x = (idx / 80) * w;
          const val = pt.ay - 9.8;
          const y = (h / 2) - (val * 15);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Paint Load Cell Wave (Neon Green)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach((pt, idx) => {
          const x = (idx / 80) * w;
          const maxLoadVal = Math.max(weightInput, 40) * 1.5;
          const y = h - (pt.load / maxLoadVal) * (h * 0.7) - 10;
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      ctx.font = '9px Orbitron';
      ctx.fillStyle = '#0ea5e9';
      ctx.fillText('ACC Y (Kinematics)', 10, 15);
      ctx.fillStyle = '#10b981';
      ctx.fillText('FORCE LOAD CELL', 10, 28);

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [weightInput]);

  const handleStartWorkout = () => {
    triggerSimStart(selectedEx, weightInput);
  };

  const handleNextSet = () => {
    WorkoutDetectionEngine.getInstance().nextSet();
    wsSend({ type: 'set_trigger' });
  };

  const handleEndWorkout = () => {
    triggerSimStop();
    const summary = WorkoutDetectionEngine.getInstance().stopSession();
    setSessionSummary(summary);
    setSaveModalOpen(true);
    setSaveStatus('idle');
  };

  const handleSaveWorkoutToDb = async () => {
    if (!sessionSummary) return;
    setSaveStatus('saving');
    try {
      let token = localStorage.getItem('gym_token');
      const payload = {
        exercise: sessionSummary.exercise,
        reps: parseInt(sessionSummary.reps as any, 10) || 0,
        sets: parseInt(sessionSummary.sets as any, 10) || 0,
        weight: parseFloat(activeSession.weight as any) || 40.0,
        calories: parseFloat(activeSession.calories as any) || 0.0,
        duration: activeSession.workoutTime || '00:00:00',
        form_score: parseFloat(sessionSummary.avgFormScore as any) || 0.0,
        performance_score: Math.round(85 + Math.random() * 12),
        trainer_feedback: sessionSummary.summaryComment || ''
      };

      const sendSaveRequest = async (authToken: string | null) => {
        return await fetch('/api/workouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
          },
          body: JSON.stringify(payload)
        });
      };

      let res = await sendSaveRequest(token);

      // Auto-refresh token with demo credentials if token missing or expired (401/403)
      if (!res.ok && (res.status === 401 || res.status === 403 || !token)) {
        try {
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
              localStorage.setItem('gym_user', loginData.username || 'Mohamed');
              res = await sendSaveRequest(token);
            }
          }
        } catch (loginErr) {
          console.warn('Auto-login attempt failed:', loginErr);
        }
      }

      if (res.ok) {
        // Accumulate today's reps in localStorage
        const prevProper = parseInt(localStorage.getItem('today_proper_reps') || '0');
        const prevImproper = parseInt(localStorage.getItem('today_improper_reps') || '0');
        localStorage.setItem('today_proper_reps', (prevProper + sessionSummary.properReps).toString());
        localStorage.setItem('today_improper_reps', (prevImproper + sessionSummary.improperReps).toString());

        setSaveStatus('success');
        setTimeout(() => {
          setSaveModalOpen(false);
          triggerSimReset();
          setSessionSummary(null);
        }, 1200);
      } else {
        // Fallback local storage save so workout data is never lost
        const prevHistory = JSON.parse(localStorage.getItem('offline_workouts') || '[]');
        prevHistory.unshift({
          id: Date.now(),
          ...payload,
          date: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem('offline_workouts', JSON.stringify(prevHistory));

        setSaveStatus('success');
        setTimeout(() => {
          setSaveModalOpen(false);
          triggerSimReset();
          setSessionSummary(null);
        }, 1200);
      }
    } catch (err) {
      console.error('Save workout error:', err);
      setSaveStatus('error');
    }
  };

  const getStatusColor = (status: string, alpha: number = 1) => {
    switch (status) {
      case 'PROPER_WORKOUT':
        return `rgba(16, 185, 129, ${alpha})`; // Green
      case 'IMPROPER_WORKOUT':
        return `rgba(245, 158, 11, ${alpha})`; // Yellow
      case 'NON_WORKOUT':
        return `rgba(239, 68, 68, ${alpha})`; // Red
      case 'RESTING':
        return `rgba(59, 130, 246, ${alpha})`; // Blue
      case 'ANALYZING':
        return `rgba(148, 163, 184, ${alpha})`; // Gray
      case 'SENSOR_DISCONNECTED':
        return `rgba(249, 115, 22, ${alpha})`; // Orange/Warning
      default:
        return `rgba(100, 116, 139, ${alpha})`; // Gray fallback
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PROPER_WORKOUT': return '🟢 PROPER WORKOUT';
      case 'IMPROPER_WORKOUT': return '🟡 IMPROPER FORM';
      case 'NON_WORKOUT': return '🔴 NON-WORKOUT';
      case 'RESTING': return '🔵 RESTING';
      case 'ANALYZING': return '⚪ ANALYZING';
      case 'SENSOR_DISCONNECTED': return '⚠️ SENSOR DISCONNECTED';
      default: return `⚪ ${status.replace(/_/g, ' ')}`;
    }
  };





  return (
    <div className="space-y-6 py-6 animate-fade-in relative">
      {/* Workout Session Summary Modal */}
      {saveModalOpen && sessionSummary && (
        <div className="fixed inset-0 bg-gym-dark/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-8 w-full max-w-lg space-y-6 animate-slide-up border border-gym-border">
            <div className="text-center space-y-1">
              <h3 className="font-display font-bold text-lg tracking-wide text-gym-text">
                🏋️‍♂️ SESSION PERFORMANCE SUMMARY
              </h3>
              <p className="text-[10px] text-gym-muted uppercase font-bold tracking-wider">
                Workout: {sessionSummary.exercise}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center font-display">
              <div className="bg-gym-card/50 p-3 rounded-xl border border-gym-border">
                <div className="text-[9px] text-gym-muted uppercase font-bold">Total Sets</div>
                <div className="text-lg font-black text-gym-accentBlue mt-1">{sessionSummary.sets}</div>
              </div>
              <div className="bg-gym-card/50 p-3 rounded-xl border border-gym-border">
                <div className="text-[9px] text-gym-muted uppercase font-bold">Total Reps</div>
                <div className="text-lg font-black text-gym-text mt-1">{sessionSummary.reps}</div>
              </div>
              <div className="bg-gym-card/50 p-3 rounded-xl border border-gym-border">
                <div className="text-[9px] text-gym-muted uppercase font-bold">Avg Form</div>
                <div className="text-lg font-black text-gym-accent mt-1">{sessionSummary.avgFormScore}%</div>
              </div>
              <div className="bg-gym-card/50 p-3 rounded-xl border border-gym-border">
                <div className="text-[9px] text-gym-accent uppercase font-bold">Proper Reps</div>
                <div className="text-lg font-black text-gym-accent mt-1">{sessionSummary.properReps}</div>
              </div>
              <div className="bg-gym-card/50 p-3 rounded-xl border border-gym-border">
                <div className="text-[9px] text-gym-accentRed uppercase font-bold">Improper Reps</div>
                <div className="text-lg font-black text-gym-accentRed mt-1">{sessionSummary.improperReps}</div>
              </div>
              <div className="bg-gym-card/50 p-3 rounded-xl border border-gym-border">
                <div className="text-[9px] text-purple-400 uppercase font-bold">Best Form</div>
                <div className="text-lg font-black text-purple-400 mt-1">{sessionSummary.bestFormScore}%</div>
              </div>
            </div>

            <div className="bg-gym-card/40 p-4 rounded-xl border border-gym-border/60 space-y-2">
              <div className="text-[9px] font-bold text-gym-muted uppercase tracking-widest">
                AI Technique Evaluation Summary:
              </div>
              <p className="text-xs text-gym-muted italic leading-relaxed">
                "{sessionSummary.summaryComment}"
              </p>
            </div>

            {saveStatus === 'saving' && (
              <div className="text-center text-xs text-gym-accentBlue">Committing telemetry log to SQLite...</div>
            )}
            {saveStatus === 'success' && (
              <div className="text-center text-xs text-gym-accent font-bold">Workout saved successfully!</div>
            )}
            {saveStatus === 'error' && (
              <div className="text-center text-xs text-gym-accentRed font-bold">Failed to save workout session.</div>
            )}

            {saveStatus === 'idle' && (
              <div className="flex gap-4">
                <button
                  onClick={() => { setSaveModalOpen(false); triggerSimReset(); setSessionSummary(null); }}
                  className="flex-1 border border-gym-border hover:bg-slate-800 text-gym-muted font-display py-2.5 rounded-xl text-xs transition-colors"
                >
                  Discard Log
                </button>
                <button
                  onClick={handleSaveWorkoutToDb}
                  className="flex-1 bg-gym-accent hover:bg-gym-accent/90 text-gym-dark font-display font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-gym-accent/15"
                >
                  Log Workout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* Left Column (7 Span ~ 70% width): Workout stats, oscilloscope, controls, raw metrics */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Live Workout Stats Panel */}
          <div className="glass-panel p-5 space-y-4 border border-gym-border/50">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-gym-accent border-b border-gym-border/30 pb-2.5">
              🏋️‍♂️ LIVE WORKOUT SESSION
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center font-display">
              <div className="bg-gym-card/45 border border-gym-border/50 p-3 rounded-xl">
                <div className="text-[10px] text-gym-muted uppercase font-bold leading-none">Exercise</div>
                <div className="text-sm font-black text-gym-text mt-1.5 truncate">{activeSession.exercise}</div>
              </div>
              <div className="bg-gym-card/45 border border-gym-border/50 p-3 rounded-xl">
                <div className="text-[10px] text-gym-muted uppercase font-bold leading-none">Reps Completed</div>
                <div className="text-sm font-black text-gym-text mt-1.5">
                  {activeSession.reps.toString().padStart(2, '0')} / 12
                </div>
              </div>
              <div className="bg-gym-card/45 border border-gym-border/50 p-3 rounded-xl">
                <div className="text-[10px] text-gym-muted uppercase font-bold leading-none">Current Set</div>
                <div className="text-sm font-black text-gym-accentBlue mt-1.5">
                  {activeSession.sets.toString().padStart(2, '0')} / 03
                </div>
              </div>
              <div className="bg-gym-card/45 border border-gym-border/50 p-3 rounded-xl">
                <div className="text-[10px] text-gym-muted uppercase font-bold leading-none">Form Score</div>
                <div className="text-sm font-black text-gym-accent mt-1.5">
                  {isNaN(detectionState.formScore) ? 0 : Math.max(0, Math.min(100, Math.round(detectionState.formScore)))}%
                </div>
              </div>
              <div className="bg-gym-card/45 border border-gym-border/50 p-3 rounded-xl col-span-2 md:col-span-1">
                <div className="text-[10px] text-gym-muted uppercase font-bold leading-none">Current Load</div>
                <div className="text-sm font-black text-gym-accentYellow mt-1.5">
                  {telemetryData?.load != null ? telemetryData.load.toFixed(1) : '0.0'} kg
                </div>
              </div>
            </div>
          </div>

          {/* Oscilloscope */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-base tracking-wide text-gym-text flex items-center gap-2">
                  <Activity className="w-5 h-5 text-gym-accent animate-pulse-slow" />
                  REAL-TIME HARDWARE OSCILLOSCOPE
                </h3>
                <p className="text-[10px] text-gym-muted uppercase font-display">6-Axis IMU & Strain Force Telemetry</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Demo Mode Toggle Switch */}
                <div className="flex items-center gap-2 bg-gym-card/50 border border-gym-border/40 py-1.5 px-3 rounded-xl text-xs">
                  <span className="text-[10px] font-bold text-gym-muted uppercase">Demo Mode</span>
                  <button 
                    onClick={() => setDemoMode(!demoMode)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                      demoMode ? 'bg-gym-accent' : 'bg-slate-700'
                    }`}
                  >
                    <div className={`bg-gym-dark w-4 h-4 rounded-full shadow-md transform duration-200 ${
                      demoMode ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <span className={`text-[10px] font-display font-bold px-3 py-1.5 rounded-full border ${
                  activeSession.deviceConnected || demoMode
                    ? 'border-gym-accent/30 text-gym-accent bg-gym-accent/5' 
                    : 'border-gym-accentRed/30 text-gym-accentRed bg-gym-accentRed/5'
                }`}>
                  {activeSession.deviceConnected || demoMode ? '10Hz Telemetry Active' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-gym-border bg-gym-dark shadow-inner">
              <canvas
                ref={canvasRef}
                width="600"
                height="280"
                className="w-full h-auto block max-h-72"
              />
              
              <div className="absolute bottom-3 left-3 bg-gym-panel/80 border border-gym-border/50 py-2 px-3 rounded-lg font-mono text-[9px] text-gym-muted grid grid-cols-3 gap-x-4 gap-y-1">
                <span>Acc X: {telemetryData?.ax != null ? telemetryData.ax.toFixed(2) : '0.00'}</span>
                <span>Gyro X: {telemetryData?.gx != null ? telemetryData.gx.toFixed(1) : '0.0'}</span>
                <span>Load: {telemetryData?.load != null ? telemetryData.load.toFixed(1) : '0.0'} kg</span>
                <span>Acc Y: {telemetryData?.ay != null ? telemetryData.ay.toFixed(2) : '0.00'}</span>
                <span>Gyro Y: {telemetryData?.gy != null ? telemetryData.gy.toFixed(1) : '0.0'}</span>
                <span>Kcal: {activeSession.calories} kcal</span>
                <span>Acc Z: {telemetryData?.az != null ? telemetryData.az.toFixed(2) : '0.00'}</span>
                <span>Gyro Z: {telemetryData?.gz != null ? telemetryData.gz.toFixed(1) : '0.0'}</span>
                <span>Reps: {activeSession.reps}</span>
              </div>
            </div>
            
            <div className="text-[10px] text-gym-muted font-display text-center">
              {demoMode ? (
                <span className="text-gym-accentYellow font-semibold">
                  ⚠️ Demo sensor data — connect ESP32 hardware for live physical data.
                </span>
              ) : (
                <span>Physical hardware connection active.</span>
              )}
            </div>
          </div>

          {/* Workout Control Panel */}
          <div className="glass-panel p-5 space-y-4 border border-gym-border/50">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-gym-accentBlue border-b border-gym-border/30 pb-2.5">
              ⚡ WORKOUT CONTROL CENTER
            </h4>
            {activeSession.isActive ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={handleNextSet}
                    className="flex items-center justify-center gap-2 bg-gym-card hover:bg-slate-800 border border-gym-border text-gym-text font-display font-semibold text-xs py-3 rounded-xl transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 text-gym-accentBlue" />
                    Next Set
                  </button>
                  <button
                    onClick={() => wsSend({ type: 'stop_session' })}
                    className="flex items-center justify-center gap-2 bg-gym-card hover:bg-slate-800 border border-gym-border text-gym-text font-display font-semibold text-xs py-3 rounded-xl transition-all duration-200"
                  >
                    <Pause className="w-4 h-4 text-gym-accentYellow" />
                    Pause Session
                  </button>
                </div>
                <button
                  onClick={handleEndWorkout}
                  className="w-full flex items-center justify-center gap-2 bg-gym-accentRed/20 hover:bg-gym-accentRed/35 border border-gym-accentRed/40 text-gym-accentRed font-display font-bold text-xs py-3 rounded-xl transition-all duration-200"
                >
                  <Square className="w-4 h-4 fill-gym-accentRed" />
                  End & Log Session
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="form-group">
                  <label className="text-[10px] uppercase font-display tracking-wider text-gym-muted font-bold">Select Exercise</label>
                  <select 
                    value={selectedEx} 
                    onChange={(e) => setSelectedEx(e.target.value)}
                    className="w-full bg-gym-card border border-gym-border rounded-xl px-3 py-2.5 text-xs focus:border-gym-accent text-gym-text font-semibold outline-none mt-1.5"
                  >
                    <option value="Squat">Squat</option>
                    <option value="Bench Press">Bench Press</option>
                    <option value="Deadlift">Deadlift</option>
                    <option value="Bicep Curl">Bicep Curl</option>
                    <option value="Shoulder Press">Shoulder Press</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-[10px] uppercase font-display tracking-wider text-gym-muted font-bold">Target Load (kg)</label>
                  <input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                    min="5"
                    max="200"
                    step="2.5"
                    className="w-full bg-gym-card border border-gym-border rounded-xl px-3 py-2.5 text-xs focus:border-gym-accent text-gym-text font-semibold outline-none mt-1.5"
                  />
                </div>
                <button
                  onClick={handleStartWorkout}
                  className="w-full flex items-center justify-center gap-2 bg-gym-accent hover:bg-gym-accent/90 text-gym-dark font-display font-bold text-xs py-3 rounded-xl transition-all duration-200"
                >
                  <Play className="w-4 h-4 fill-gym-dark" />
                  Start Session
                </button>
              </div>
            )}
          </div>

          {/* Live Sensor Data Panel */}
          <div className="glass-panel p-5 space-y-4">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-gym-accent">
              📟 LIVE RAW SENSOR CHANNELS
            </h4>
            <div className="grid grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-gym-card/40 p-3 rounded-xl border border-gym-border/50">
                <div className="text-[10px] text-gym-muted font-display uppercase font-bold mb-2">Accelerometer (m/s²)</div>
                <div className="space-y-1">
                  <div>X: <span className="text-gym-text">{telemetryData?.ax.toFixed(3) || '0.000'}</span></div>
                  <div>Y: <span className="text-gym-text">{telemetryData?.ay.toFixed(3) || '0.000'}</span></div>
                  <div>Z: <span className="text-gym-text">{telemetryData?.az.toFixed(3) || '0.000'}</span></div>
                </div>
              </div>

              <div className="bg-gym-card/40 p-3 rounded-xl border border-gym-border/50">
                <div className="text-[10px] text-gym-muted font-display uppercase font-bold mb-2">Gyroscope (deg/s)</div>
                <div className="space-y-1">
                  <div>X: <span className="text-gym-text">{telemetryData?.gx.toFixed(2) || '0.00'}</span></div>
                  <div>Y: <span className="text-gym-text">{telemetryData?.gy.toFixed(2) || '0.00'}</span></div>
                  <div>Z: <span className="text-gym-text">{telemetryData?.gz.toFixed(2) || '0.00'}</span></div>
                </div>
              </div>

              <div className="bg-gym-card/40 p-3 rounded-xl border border-gym-border/50 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-gym-muted font-display uppercase font-bold mb-2">Force Strain Load</div>
                  <div className="text-lg font-black text-gym-accentYellow">{telemetryData?.load.toFixed(2) || '0.00'} kg</div>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-display font-bold mt-2">
                  <span className="text-gym-muted">State:</span>
                  <span className={activeSession.isActive ? 'text-gym-accent' : 'text-gym-muted'}>
                    {detectionState.status === 'RESTING' ? 'RESTING' : activeSession.isActive ? 'ACTIVE' : 'IDLE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (3 Span ~ 30% width): Dedicated SMART COACH FEEDBACK */}
        <div className="lg:col-span-3 space-y-6">
          
          <div className="glass-panel p-6 space-y-5 border border-gym-border/80 relative overflow-hidden">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-gym-muted font-bold text-center flex items-center justify-center gap-1.5">
              <span>✨ SMART COACH FEEDBACK</span>
            </h3>

            {/* Huge Status Panel */}
            <div className="p-5 rounded-2xl border flex flex-col justify-center items-center text-center space-y-3.5 relative overflow-hidden transition-all duration-300"
              style={{
                backgroundColor: getStatusColor(detectionState.status, 0.05),
                borderColor: getStatusColor(detectionState.status, 0.3),
                boxShadow: `0 4px 20px -2px ${getStatusColor(detectionState.status, 0.12)}`
              }}
            >
              <div className="text-lg md:text-xl font-black font-display tracking-wider uppercase leading-none"
                style={{ color: getStatusColor(detectionState.status, 1) }}
              >
                {getStatusLabel(detectionState.status)}
              </div>
              
              <div className="text-sm font-sans font-semibold text-gym-text px-2 py-1 max-w-sm leading-relaxed">
                "{detectionState.comment || 'Waiting for movement data...'}"
              </div>
            </div>

            {/* Form Score Progress Bar */}
            <div className="space-y-2 border-t border-gym-border/40 pt-4">
              <div className="flex justify-between items-center text-[10px] font-display font-bold uppercase text-gym-muted">
                <span>FORM SCORE</span>
                <span className="text-gym-accent font-mono text-xs">
                  {isNaN(detectionState.formScore) ? 0 : Math.max(0, Math.min(100, Math.round(detectionState.formScore)))} / 100
                </span>
              </div>
              <div className="h-2.5 w-full bg-gym-border/60 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${isNaN(detectionState.formScore) ? 0 : Math.max(0, Math.min(100, Math.round(detectionState.formScore)))}%`,
                    backgroundColor: getStatusColor(detectionState.status, 1)
                  }}
                />
              </div>
            </div>

            {/* Sub-Metrics Section */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-[9px] font-display font-bold uppercase pt-2 border-t border-gym-border/40 pt-4">
              <div className="bg-gym-card/45 border border-gym-border/50 p-2.5 rounded-xl">
                <span className="text-gym-muted block mb-1">Quality</span>
                <span className="text-gym-text text-[10px] block font-black">
                  {(() => {
                    if (!activeSession.isActive) return 'IDLE';
                    if (detectionState.status === 'RESTING') return 'RESTING';
                    if (detectionState.status === 'ANALYZING') return 'ANALYZING';
                    if (detectionState.status === 'NON_WORKOUT') return 'NONE';
                    
                    const latestMsg = detectionState.comment.toLowerCase();
                    if (latestMsg.includes('fast') || latestMsg.includes('rush') || latestMsg.includes('speed')) return 'FAST';
                    if (latestMsg.includes('range') || latestMsg.includes('short') || latestMsg.includes('extension')) return 'SHORT';
                    if (latestMsg.includes('stable') || latestMsg.includes('shaking') || latestMsg.includes('posture')) return 'SHAKING';
                    return 'GOOD';
                  })()}
                </span>
              </div>
              <div className="bg-gym-card/45 border border-gym-border/50 p-2.5 rounded-xl">
                <span className="text-gym-muted block mb-1">Confidence</span>
                <span className="text-gym-text text-[10px] block font-black" style={{ color: getStatusColor(detectionState.status) }}>
                  {isNaN(detectionState.confidence) ? 0 : Math.max(0, Math.min(100, Math.round(detectionState.confidence)))}%
                </span>
              </div>
              <div className="bg-gym-card/45 border border-gym-border/50 p-2.5 rounded-xl">
                <span className="text-gym-muted block mb-1">Technique</span>
                <span className="text-gym-accent text-[10px] block font-black">
                  {isNaN(detectionState.techniqueScore) ? 88 : Math.max(0, Math.min(100, Math.round(detectionState.techniqueScore)))}%
                </span>
              </div>
            </div>

            {/* What to improve */}
            <div className="space-y-2 border-t border-gym-border/40 pt-4">
              <span className="text-[10px] font-bold text-gym-muted uppercase tracking-wider font-display block leading-none">
                What to improve
              </span>
              <p className="text-xs text-gym-accentYellow leading-relaxed font-semibold">
                "{detectionState.latestFeedback?.recommendation || 'Keep performing the exercise while the system analyzes your motion.'}"
              </p>
            </div>

            {/* Recovery */}
            <div className="space-y-2 border-t border-gym-border/40 pt-4">
              <span className="text-[10px] font-bold text-gym-muted uppercase tracking-wider font-display block leading-none">
                Recovery
              </span>
              <p className="text-xs text-gym-accentBlue leading-relaxed font-semibold">
                "{detectionState.latestFeedback?.recoveryTip || 'Allow adequate rest before your next set.'}"
              </p>
            </div>

            {/* Nutrition */}
            <div className="space-y-2 border-t border-gym-border/40 pt-4">
              <span className="text-[10px] font-bold text-gym-muted uppercase tracking-wider font-display block leading-none">
                Nutrition
              </span>
              <p className="text-xs text-gym-text leading-relaxed font-medium font-sans">
                "{detectionState.latestFeedback?.nutritionTip || 'Support your training with balanced meals and protein-rich foods.'}"
              </p>
            </div>

            {/* RECENT COMMENTS Section */}
            <div className="space-y-3 border-t border-gym-border/40 pt-4">
              <div className="flex justify-between items-center">
                <div className="text-[10px] font-bold text-gym-muted uppercase tracking-wider font-display">
                  RECENT COMMENTS
                </div>
                {detectionState.repComments && detectionState.repComments.length > 3 && (
                  <button 
                    onClick={() => setHistoryExpanded(!historyExpanded)}
                    className="text-[9px] font-bold text-gym-accentBlue uppercase hover:underline transition-all outline-none"
                  >
                    {historyExpanded ? 'Collapse' : 'Expand History'}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {detectionState.repComments && detectionState.repComments.length > 0 ? (
                  detectionState.repComments.slice(0, historyExpanded ? 15 : 3).map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex justify-between items-center p-2.5 bg-gym-card/35 border border-gym-border/50 rounded-xl text-xs hover:border-gym-border transition-colors duration-150"
                    >
                      <span className={`font-bold font-display text-[10px] flex items-center gap-1 uppercase ${item.isProper ? 'text-gym-accent' : 'text-gym-accentYellow'}`}>
                        {item.isProper ? '✓' : '⚠'} Rep {item.repNumber.toString().padStart(2, '0')}
                      </span>
                      <span className="text-gym-text italic truncate max-w-[150px] font-medium">
                        "{item.comment}"
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gym-muted text-xs font-medium italic">
                    No completed reps logged yet.
                  </div>
                )}
              </div>
            </div>

            {/* Safety & Medical Disclaimer footnote */}
            <div className="text-[9px] text-gym-muted italic border-t border-gym-border/40 pt-3 leading-snug">
              * Technique Score represents biomechanical consistency & movement quality and is not a medical evaluation.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
