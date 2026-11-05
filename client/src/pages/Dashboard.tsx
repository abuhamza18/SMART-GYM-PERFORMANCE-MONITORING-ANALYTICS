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
        return `rgba(255, 122, 0, ${alpha})`; // Primary Orange
      case 'IMPROPER_WORKOUT':
        return `rgba(250, 204, 21, ${alpha})`; // Neon Yellow (warning)
      case 'NON_WORKOUT':
        return `rgba(255, 77, 90, ${alpha})`; // Neon Red (error)
      case 'RESTING':
        return `rgba(56, 189, 248, ${alpha})`; // Cyan (info)
      case 'ANALYZING':
        return `rgba(148, 163, 184, ${alpha})`; // Slate
      case 'SENSOR_DISCONNECTED':
        return `rgba(250, 204, 21, ${alpha})`; // Warning Yellow
      default:
        return `rgba(148, 163, 184, ${alpha})`;
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
    { title: 'Workouts', val: stats.totalWorkouts, desc: 'sessions recorded', icon: Dumbbell, color: 'text-gym-accent', bgGlow: 'rgba(255,122,0,0.15)' },
    { title: 'Total Repetitions', val: stats.totalReps, desc: 'reps completed', icon: Hash, color: 'text-gym-accentBlue', bgGlow: 'rgba(56,189,248,0.15)' },
    { title: 'Total Sets', val: stats.totalSets, desc: 'active sets logged', icon: Layers, color: 'text-gym-accentYellow', bgGlow: 'rgba(250,204,21,0.15)' },
    { title: 'Volume Lifted', val: `${stats.totalVolume.toLocaleString()} kg`, desc: 'cumulative load', icon: Weight, color: 'text-purple-400', bgGlow: 'rgba(192,132,252,0.15)' },
    { title: 'Active Duration', val: `${stats.totalDurationMin} min`, desc: 'total time under load', icon: Clock, color: 'text-blue-400', bgGlow: 'rgba(96,165,250,0.15)' },
    { title: 'Avg Form Score', val: `${stats.avgFormScore}%`, desc: 'technique rating', icon: Award, color: 'text-gym-accent', bgGlow: 'rgba(255,122,0,0.15)' },
  ];

  return (
    <div className="space-y-6 py-6 animate-fade-in max-w-7xl mx-auto">
      {/* Overview Metric Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="stat-card flex flex-col justify-between group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-display tracking-widest text-gym-muted font-bold">
                  {card.title}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                  style={{ background: card.bgGlow }}
                >
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xl md:text-2xl font-black font-display text-gym-text tracking-wide leading-none group-hover:text-gym-accent transition-colors">
                  {card.val}
                </div>
                <span className="text-[10px] text-gym-muted mt-1.5 block">
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
                <p className="text-[11px] text-gym-muted font-sans mt-0.5">Weight Volume & Form Quality Trends</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gym-accent/10 border border-gym-accent/25 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-gym-accent" />
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#38BDF8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorForm" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF7A00" stopOpacity={0.40}/>
                        <stop offset="95%" stopColor="#FF7A00" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#303036" opacity={0.6} />
                    <XAxis dataKey="date" stroke="#A1A1AA" style={{ fontSize: 10, fontFamily: 'Orbitron' }} />
                    <YAxis yAxisId="left" stroke="#38BDF8" style={{ fontSize: 10, fontFamily: 'Orbitron' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#FF7A00" style={{ fontSize: 10, fontFamily: 'Orbitron' }} domain={[60, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', borderColor: '#303036', borderRadius: '14px', fontSize: 11, color: '#F5F5F5', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#A1A1AA', paddingTop: 8 }} />
                    <Area yAxisId="left" type="monotone" dataKey="volume" name="Volume (kg)" stroke="#38BDF8" fillOpacity={1} fill="url(#colorVolume)" strokeWidth={2.5} />
                    <Area yAxisId="right" type="monotone" dataKey="form" name="Form Score (%)" stroke="#FF7A00" fillOpacity={1} fill="url(#colorForm)" strokeWidth={2.5} />
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
              <div className="h-48 w-full pt-1">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#303036" opacity={0.6} />
                      <XAxis dataKey="date" stroke="#A1A1AA" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                      <YAxis stroke="#A1A1AA" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', borderColor: '#303036', borderRadius: '12px', color: '#F5F5F5' }} />
                      <Bar dataKey="reps" fill="#FF7A00" radius={[6, 6, 0, 0]} name="Reps per Session" />
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
                Lift Weight Progression
              </h4>
              <div className="h-48 w-full pt-1">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#303036" opacity={0.6} />
                      <XAxis dataKey="date" stroke="#A1A1AA" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                      <YAxis stroke="#A1A1AA" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1A1A1F', borderColor: '#303036', borderRadius: '12px', color: '#F5F5F5' }} />
                      <Line type="monotone" dataKey="weight" stroke="#FF7A00" strokeWidth={2.5} dot={{ fill: '#FF7A00', r: 4 }} activeDot={{ r: 6 }} name="Weight (kg)" />
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
            className="glass-panel p-6 space-y-5 border border-gym-border relative overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gym-accent flex items-center gap-1.5">
                <span>⚡ SMART COACH AI</span>
              </h3>
              <span className={`w-2.5 h-2.5 rounded-full ${
                activeSession.isActive ? 'bg-gym-accent animate-pulse shadow-[0_0_10px_rgba(255,122,0,0.8)]' : 'bg-gym-muted'
              }`} />
            </div>

            <div className="space-y-4">
              {/* Message Display with Status Indicator */}
              <div 
                className="p-4 rounded-xl border flex flex-col justify-center items-center text-center space-y-2 animate-fade-in"
                style={{
                  backgroundColor: getStatusColor(detectionState.status, 0.08),
                  borderColor: getStatusColor(detectionState.status, 0.35),
                  boxShadow: `0 4px 18px ${getStatusColor(detectionState.status, 0.12)}`
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
              <div className="space-y-2.5 font-display">
                <div className="flex justify-between items-center bg-gym-cardAlt/70 p-3 rounded-xl border border-gym-border text-xs">
                  <span className="text-gym-muted font-bold uppercase text-[10px] tracking-wide">Form Score</span>
                  <span className="text-gym-accent font-black text-sm">
                    {isNaN(detectionState.formScore) ? '0%' : `${Math.round(detectionState.formScore)}%`}
                  </span>
                </div>
                
                <div className="flex flex-col bg-gym-cardAlt/70 p-3 rounded-xl border border-gym-border gap-1 text-xs">
                  <span className="text-gym-muted font-bold uppercase text-[9px] tracking-wide">What to improve</span>
                  <span className="text-gym-text font-semibold italic text-[11px] leading-relaxed">
                    "{detectionState.latestFeedback?.recommendation || 'No major issue detected.'}"
                  </span>
                </div>

                {detectionState.latestFeedback?.recoveryTip && (
                  <div className="flex flex-col bg-gym-cardAlt/70 p-3 rounded-xl border border-gym-border gap-1 text-xs">
                    <span className="text-gym-muted font-bold uppercase text-[9px] tracking-wide">Recovery Tip</span>
                    <span className="text-gym-accentBlue font-semibold italic text-[11px] leading-relaxed">
                      "{detectionState.latestFeedback.recoveryTip}"
                    </span>
                  </div>
                )}
              </div>

              {/* View Live Feedback Button */}
              <button
                onClick={() => navigate('/live')}
                className="w-full flex items-center justify-center gap-2 bg-gym-accent/15 hover:bg-gym-accent text-gym-accent hover:text-gym-dark border border-gym-accent/40 font-display font-bold text-xs py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-gym-accent/20"
              >
                VIEW LIVE FEEDBACK →
              </button>
            </div>
            
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gym-accent to-gym-accentHover" />
          </div>

          {/* Quick Workout Console */}
          <div className="glass-panel p-6 space-y-5">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-gym-accent">
              ⚡ WORKOUT CONTROL PANEL
            </h3>
            
            {activeSession.isActive ? (
              <div className="p-4 bg-gym-accent/8 border border-gym-accent/25 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gym-accent font-display font-bold uppercase tracking-wider">
                    Workout Session Active
                  </span>
                  <div className="w-2.5 h-2.5 bg-gym-accent rounded-full animate-ping" />
                </div>
                <div className="space-y-1">
                  <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Exercise</div>
                  <div className="text-sm font-bold text-gym-text">{activeSession.exercise}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-gym-cardAlt p-2 rounded-lg text-center border border-gym-border">
                    <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Sets</div>
                    <div className="text-xs font-bold text-gym-text mt-1">{activeSession.sets}</div>
                  </div>
                  <div className="bg-gym-cardAlt p-2 rounded-lg text-center border border-gym-border">
                    <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Reps</div>
                    <div className="text-xs font-bold text-gym-text mt-1">{activeSession.reps}</div>
                  </div>
                  <div className="bg-gym-cardAlt p-2 rounded-lg text-center border border-gym-border">
                    <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Weight</div>
                    <div className="text-xs font-bold text-gym-text mt-1">{activeSession.weight} kg</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-display tracking-wider text-gym-muted font-bold block mb-1.5">
                    Select Exercise
                  </label>
                  <select 
                    value={selectedEx} 
                    onChange={(e) => setSelectedEx(e.target.value)}
                    className="w-full bg-[#222228] border border-gym-border rounded-xl px-3.5 py-2.5 text-xs focus:border-gym-accent text-gym-text font-semibold outline-none transition-colors"
                  >
                    <option value="Bench Press">Bench Press</option>
                    <option value="Squat">Squat</option>
                    <option value="Deadlift">Deadlift</option>
                    <option value="Bicep Curl">Bicep Curl</option>
                    <option value="Shoulder Press">Shoulder Press</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-display tracking-wider text-gym-muted font-bold block mb-1.5">
                    Weight Load (kg)
                  </label>
                  <input
                    type="number"
                    value={workoutWeightInput}
                    onChange={(e) => setWorkoutWeightInput(parseFloat(e.target.value) || 0)}
                    min="5"
                    max="200"
                    step="2.5"
                    className="w-full bg-[#222228] border border-gym-border rounded-xl px-3.5 py-2.5 text-xs focus:border-gym-accent text-gym-text font-semibold outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={handleStartWorkout}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF7A00] to-[#FF5500] hover:from-[#FF8C1A] hover:to-[#E65C00] text-[#0B0B0D] font-display font-bold text-xs py-3.5 rounded-xl transition-all duration-200 shadow-md shadow-gym-accent/25 hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-[#0B0B0D]" />
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
              <p className="text-[11px] text-gym-muted font-sans mt-0.5">Latest recorded telemetry logs</p>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {workouts.length > 0 ? (
                workouts.slice(0, 5).map((w, idx) => (
                  <div key={idx} className="p-3 bg-gym-cardAlt/70 border border-gym-border rounded-xl flex justify-between items-center hover:border-gym-accent/35 transition-all">
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
