import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Dumbbell, 
  Hash, 
  Layers, 
  Weight, 
  Clock, 
  Award, 
  Play, 
  TrendingUp
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend
} from 'recharts';
import type { EngineState } from '../workout-detection/workoutDetectionEngine';

interface Workout {
  id: number;
  exercise: string;
  reps: number;
  sets: number;
  weight: number;
  calories: number;
  duration: string;
  date: string;
  form_score: number;
  performance_score: number;
  trainer_feedback: string;
}

interface DashboardProps {
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
  triggerSimStart: (exercise: string, weight: number) => void;
  detectionState: EngineState;
}

export const Dashboard: React.FC<DashboardProps> = ({ activeSession, triggerSimStart, detectionState }) => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);


  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalReps: 0,
    totalSets: 0,
    totalVolume: 0,
    totalDurationMin: 0,
    avgFormScore: 0
  });

  const [selectedEx, setSelectedEx] = useState('Bench Press');
  const [workoutWeightInput, setWorkoutWeightInput] = useState(40);

  const fetchWorkouts = async () => {
    try {
      const token = localStorage.getItem('gym_token');
      const offline = JSON.parse(localStorage.getItem('offline_workouts') || '[]');
      const res = await fetch('/api/workouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : [];
        const merged = [...safeData, ...offline];
        setWorkouts(merged);
        calculateStats(merged);
      } else {
        setWorkouts(offline);
        calculateStats(offline);
      }
    } catch (err) {
      console.error('Error fetching workouts:', err);
      const offline = JSON.parse(localStorage.getItem('offline_workouts') || '[]');
      setWorkouts(offline);
      calculateStats(offline);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [activeSession.isActive]);

  const calculateStats = (data: Workout[]) => {
    const safeData = Array.isArray(data) ? data : [];
    if (safeData.length === 0) return;
    let reps = 0;
    let sets = 0;
    let volume = 0;
    let durationSeconds = 0;
    let formSum = 0;
    let formCount = 0;

    safeData.forEach((w) => {
      reps += w.reps || 0;
      sets += w.sets || 0;
      volume += (w.sets || 0) * (w.reps || 0) * (w.weight || 0);
      
      // parse duration
      const parts = (w.duration || '00:00:00').split(':');
      if (parts.length === 3) {
        durationSeconds += (parseInt(parts[0], 10) || 0) * 3600 + (parseInt(parts[1], 10) || 0) * 60 + (parseInt(parts[2], 10) || 0);
      }

      if (w.form_score > 0) {
        formSum += w.form_score;
        formCount++;
      }
    });

    setStats({
      totalWorkouts: safeData.length,
      totalReps: reps,
      totalSets: sets,
      totalVolume: Math.round(volume),
      totalDurationMin: Math.round(durationSeconds / 60),
      avgFormScore: formCount > 0 ? parseFloat((formSum / formCount).toFixed(1)) : 88.5
    });
  };

  // Safe array reference for chart data
  const safeWorkoutsList = Array.isArray(workouts) ? workouts : [];
  const chartData = [...safeWorkoutsList].reverse().map(w => ({
    date: (w.date || '').substring(5), // MM-DD
    weight: w.weight || 0,
    reps: w.reps || 0,
    form: w.form_score || 85,
    volume: (w.sets || 0) * (w.reps || 0) * (w.weight || 0)
  }));

  const handleStartWorkout = () => {
    triggerSimStart(selectedEx, workoutWeightInput);
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

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'PROPER_WORKOUT': return '🟢';
      case 'IMPROPER_WORKOUT': return '🟡';
      case 'NON_WORKOUT': return '🔴';
      case 'RESTING': return '🔵';
      case 'ANALYZING': return '⚪';
      case 'SENSOR_DISCONNECTED': return '⚠️';
      default: return '⚪';
    }
  };

  const cards = [
    { title: 'Workouts', val: stats.totalWorkouts, desc: 'sessions recorded', icon: Dumbbell, color: 'text-gym-accent' },
    { title: 'Total Repetitions', val: stats.totalReps, desc: 'reps completed', icon: Hash, color: 'text-gym-accentBlue' },
    { title: 'Total Sets', val: stats.totalSets, desc: 'active sets logged', icon: Layers, color: 'text-gym-accentYellow' },
    { title: 'Volume Lifted', val: `${stats.totalVolume} kg`, desc: 'total weight volume', icon: Weight, color: 'text-purple-400' },
    { title: 'Active Duration', val: `${stats.totalDurationMin} min`, desc: 'cumulative effort', icon: Clock, color: 'text-blue-400' },
    { title: 'Avg Form Score', val: `${stats.avgFormScore}%`, desc: 'posture consistency', icon: Award, color: 'text-gym-accent' },
  ];

  return (
    <div className="space-y-6 py-6 animate-fade-in">
      {/* Overview Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="glass-panel p-4 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-display tracking-widest text-gym-muted font-bold">
                  {card.title}
                </span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="mt-4">
                <div className="text-xl md:text-2xl font-black font-display text-gym-text tracking-wide leading-none">
                  {card.val}
                </div>
                <span className="text-[9px] text-gym-muted mt-1 block">
                  {card.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workout Performance Charts */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-base tracking-wide text-gym-text">
                  WEEKLY TELEMETRY ANALYTICS
                </h3>
                <p className="text-[10px] text-gym-muted uppercase font-display">Weight Volume & Form Quality Trends</p>
              </div>
              <TrendingUp className="w-5 h-5 text-gym-accent" />
            </div>

            <div className="h-72 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorForm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 10, fontFamily: 'Orbitron' }} />
                    <YAxis yAxisId="left" stroke="#0ea5e9" style={{ fontSize: 10, fontFamily: 'Orbitron' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: 10, fontFamily: 'Orbitron' }} domain={[60, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0c0f1d', borderColor: '#1e293b', borderRadius: '12px', fontSize: 11 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area yAxisId="left" type="monotone" dataKey="volume" name="Volume (kg)" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2} />
                    <Area yAxisId="right" type="monotone" dataKey="form" name="Form Score (%)" stroke="#10b981" fillOpacity={1} fill="url(#colorForm)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gym-muted text-xs">
                  No records to display. Start workouts to populate graph metrics.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Repetitions progress */}
            <div className="glass-panel p-5 space-y-3">
              <h4 className="font-display font-bold text-xs uppercase text-gym-muted tracking-wider">
                Repetition Progression
              </h4>
              <div className="h-48 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0c0f1d', borderColor: '#1e293b' }} />
                      <Bar dataKey="reps" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Reps per Session" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gym-muted text-xs">No records available.</div>
                )}
              </div>
            </div>

            {/* Weight progression */}
            <div className="glass-panel p-5 space-y-3">
              <h4 className="font-display font-bold text-xs uppercase text-gym-muted tracking-wider">
                Lift Weight progression
              </h4>
              <div className="h-48 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                      <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0c0f1d', borderColor: '#1e293b' }} />
                      <Line type="monotone" dataKey="weight" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} name="Weight (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gym-muted text-xs">No records available.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Sidebar / Active Telemetry */}
        <div className="space-y-6">
          {/* SMART COACH CARD */}
          <div 
            className="glass-panel p-6 space-y-4 border border-gym-border/60 relative overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gym-accent flex items-center gap-1.5">
                <span>SMART COACH</span>
              </h3>
              <span className={`w-2 h-2 rounded-full ${
                activeSession.isActive ? 'bg-gym-accent animate-pulse' : 'bg-gym-muted'
              }`} />
            </div>

            <div className="space-y-4">
              {/* Message Display with Status Indicator */}
              <div 
                className="p-4 rounded-xl border flex flex-col justify-center items-center text-center space-y-2 animate-fade-in"
                style={{
                  backgroundColor: getStatusColor(detectionState.status, 0.05),
                  borderColor: getStatusColor(detectionState.status, 0.3)
                }}
              >
                <div className="text-[10px] uppercase font-display font-black tracking-wider" style={{ color: getStatusColor(detectionState.status) }}>
                  {getStatusEmoji(detectionState.status)} {detectionState.status === 'IMPROPER_WORKOUT' ? 'IMPROVE FORM' : detectionState.status.replace(/_/g, ' ')}
                </div>
                <div className="text-xs font-semibold text-gym-text leading-relaxed">
                  "{detectionState.comment || 'Waiting for movement data...'}"
                </div>
              </div>

              {/* Form Score and Improvement Info */}
              <div className="space-y-2 font-display">
                <div className="flex justify-between items-center bg-gym-card/50 p-2.5 rounded-xl border border-gym-border/40 text-xs">
                  <span className="text-gym-muted font-bold uppercase text-[9px] tracking-wide">Form Score:</span>
                  <span className="text-gym-accent font-black text-sm">
                    {isNaN(detectionState.formScore) ? '0%' : `${Math.round(detectionState.formScore)}%`}
                  </span>
                </div>
                
                <div className="flex flex-col bg-gym-card/50 p-2.5 rounded-xl border border-gym-border/40 gap-1 text-xs">
                  <span className="text-gym-muted font-bold uppercase text-[9px] tracking-wide">What to improve:</span>
                  <span className="text-gym-text font-semibold italic text-[11px] leading-relaxed">
                    "{detectionState.latestFeedback?.recommendation || 'No major issue detected.'}"
                  </span>
                </div>

                {detectionState.latestFeedback?.recoveryTip && (
                  <div className="flex flex-col bg-gym-card/50 p-2.5 rounded-xl border border-gym-border/40 gap-1 text-xs">
                    <span className="text-gym-muted font-bold uppercase text-[9px] tracking-wide">Recovery:</span>
                    <span className="text-gym-accentBlue font-semibold italic text-[11px] leading-relaxed">
                      "{detectionState.latestFeedback.recoveryTip}"
                    </span>
                  </div>
                )}
              </div>

              {/* View Live Feedback Button */}
              <button
                onClick={() => navigate('/live')}
                className="w-full flex items-center justify-center gap-2 bg-gym-accent/10 hover:bg-gym-accent text-gym-accent hover:text-gym-dark border border-gym-accent/30 font-display font-bold text-xs py-3 rounded-xl transition-all duration-200"
              >
                VIEW LIVE FEEDBACK
              </button>
            </div>
            
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gym-accent to-gym-accentBlue" />
          </div>

          {/* Quick Workout Console */}
          <div className="glass-panel p-6 space-y-5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-gym-accent">
              ⚡ WORKOUT CONTROL PANEL
            </h3>
            
            {activeSession.isActive ? (
              <div className="p-4 bg-gym-accent/5 border border-gym-accent/20 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gym-accent font-display font-bold uppercase tracking-wider">
                    Workout Session Active
                  </span>
                  <div className="w-2 h-2 bg-gym-accent rounded-full animate-ping" />
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Exercise</div>
                  <div className="text-sm font-bold text-gym-text">{activeSession.exercise}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gym-card/50 p-2 rounded-lg text-center">
                    <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Sets</div>
                    <div className="text-xs font-bold text-gym-text mt-1">{activeSession.sets}</div>
                  </div>
                  <div className="bg-gym-card/50 p-2 rounded-lg text-center">
                    <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Reps</div>
                    <div className="text-xs font-bold text-gym-text mt-1">{activeSession.reps}</div>
                  </div>
                  <div className="bg-gym-card/50 p-2 rounded-lg text-center">
                    <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Weight</div>
                    <div className="text-xs font-bold text-gym-text mt-1">{activeSession.weight} kg</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="form-group">
                  <label className="text-[10px] uppercase font-display tracking-wider text-gym-muted font-semibold">Select Exercise</label>
                  <select 
                    value={selectedEx} 
                    onChange={(e) => setSelectedEx(e.target.value)}
                    className="w-full bg-gym-card border border-gym-border rounded-xl px-3 py-2 text-xs focus:border-gym-accent text-gym-text font-semibold outline-none mt-1.5"
                  >
                    <option value="Bench Press">Bench Press</option>
                    <option value="Squat">Squat</option>
                    <option value="Deadlift">Deadlift</option>
                    <option value="Bicep Curl">Bicep Curl</option>
                    <option value="Shoulder Press">Shoulder Press</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-[10px] uppercase font-display tracking-wider text-gym-muted font-semibold">Weight Load (kg)</label>
                  <input
                    type="number"
                    value={workoutWeightInput}
                    onChange={(e) => setWorkoutWeightInput(parseFloat(e.target.value) || 0)}
                    min="5"
                    max="200"
                    step="2.5"
                    className="w-full bg-gym-card border border-gym-border rounded-xl px-3 py-2 text-xs focus:border-gym-accent text-gym-text font-semibold outline-none mt-1.5"
                  />
                </div>
                <button
                  onClick={handleStartWorkout}
                  className="w-full flex items-center justify-center gap-2 bg-gym-accent hover:bg-gym-accent/90 text-gym-dark font-display font-semibold text-xs py-3.5 rounded-xl transition-all duration-200"
                >
                  <Play className="w-4 h-4 fill-gym-dark" />
                  Initiate Workout
                </button>
              </div>
            )}
          </div>

          {/* Recent Workouts Sidebar */}
          <div className="glass-panel p-5 space-y-4">
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-gym-text">
                RECENT WORKOUT LOGS
              </h3>
              <p className="text-[10px] text-gym-muted uppercase font-display">Latest recorded telemetry logs</p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {workouts.length > 0 ? (
                workouts.slice(0, 5).map((w, idx) => (
                  <div key={idx} className="p-3 bg-gym-card/50 border border-gym-border rounded-xl flex justify-between items-center hover:border-gym-accentBlue/20 transition-colors">
                    <div>
                      <span className="text-[10px] font-mono text-gym-muted">{w.date}</span>
                      <h4 className="text-xs font-bold text-gym-text font-display tracking-wide uppercase mt-0.5">{w.exercise}</h4>
                      <span className="text-[10px] text-gym-muted">
                        Sets: <strong className="text-gym-text">{w.sets}</strong> | Reps: <strong className="text-gym-text">{w.reps}</strong> | Load: <strong className="text-gym-text">{w.weight}kg</strong>
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-bold text-gym-muted uppercase">FORM</div>
                      <span className={`text-xs font-bold font-mono ${
                        (w.form_score || 85) >= 90 ? 'text-gym-accent' : (w.form_score || 85) >= 80 ? 'text-gym-accentBlue' : 'text-gym-accentRed'
                      }`}>
                        {w.form_score ? `${w.form_score}%` : '85%'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gym-muted text-xs">No workout history logged.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
