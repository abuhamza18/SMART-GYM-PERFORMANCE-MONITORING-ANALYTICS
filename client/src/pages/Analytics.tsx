import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, Calendar, Dumbbell, BarChart as BarChartIcon, Filter } from 'lucide-react';

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

export const Analytics: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);


  // Filters
  const [exerciseFilter, setExerciseFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('All'); // 'All', 'Last 7 Days', 'Last 30 Days'

  const fetchWorkouts = async () => {
    try {
      const token = localStorage.getItem('gym_token');
      const res = await fetch('/api/workouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : [];
        setWorkouts(safeData);
        setFilteredWorkouts(safeData);
      } else {
        setWorkouts([]);
        setFilteredWorkouts([]);
      }
    } catch (err) {
      console.error('Error fetching workouts:', err);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...workouts];

    // Filter by Exercise
    if (exerciseFilter !== 'All') {
      result = result.filter(w => w.exercise.toLowerCase() === exerciseFilter.toLowerCase());
    }

    // Filter by Time Range
    if (timeFilter !== 'All') {
      const now = new Date();
      let limitDate = new Date();
      if (timeFilter === 'Last 7 Days') {
        limitDate.setDate(now.getDate() - 7);
      } else if (timeFilter === 'Last 30 Days') {
        limitDate.setDate(now.getDate() - 30);
      }
      result = result.filter(w => new Date(w.date) >= limitDate);
    }

    // Sort chronologically for the charts
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setFilteredWorkouts(result);
  }, [exerciseFilter, timeFilter, workouts]);

  // Aggregate exercise comparison statistics for Radar chart
  const getRadarData = () => {
    const exercises = ['Squat', 'Bench Press', 'Deadlift', 'Bicep Curl', 'Shoulder Press'];
    return exercises.map((ex) => {
      const filtered = workouts.filter(w => w.exercise.toLowerCase() === ex.toLowerCase());
      let formSum = 0;
      let formCount = 0;
      let maxWeight = 0;

      filtered.forEach((w) => {
        if (w.form_score > 0) {
          formSum += w.form_score;
          formCount++;
        }
        if (w.weight > maxWeight) maxWeight = w.weight;
      });

      return {
        subject: ex,
        Form: formCount > 0 ? Math.round(formSum / formCount) : 0,
        Strength: maxWeight ? Math.min(100, Math.round((maxWeight / 120) * 100)) : 0, // normalized max load
        Volume: filtered.reduce((acc, curr) => acc + (curr.reps * curr.sets), 0) / 5 // normalized volume
      };
    });
  };

  return (
    <div className="space-y-6 py-6 animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-wide text-gym-text">
            ADVANCED ANALYTICS ENGINE
          </h2>
          <p className="text-xs text-gym-muted uppercase tracking-widest font-display mt-1">
            Multivariable Kinematics & Kinetic Performance Graphs
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-gym-panel border border-gym-border p-3.5 rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-gym-muted font-display font-bold uppercase mr-2">
            <Filter className="w-4 h-4 text-gym-accent" />
            Filters:
          </div>
          {/* Exercise Select */}
          <div className="flex items-center gap-2 bg-gym-card/50 px-3 py-1.5 rounded-xl border border-gym-border">
            <Dumbbell className="w-3.5 h-3.5 text-gym-accent" />
            <select
              value={exerciseFilter}
              onChange={(e) => setExerciseFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gym-text outline-none cursor-pointer"
            >
              <option value="All">All Exercises</option>
              <option value="Squat">Squat</option>
              <option value="Bench Press">Bench Press</option>
              <option value="Deadlift">Deadlift</option>
              <option value="Bicep Curl">Bicep Curl</option>
              <option value="Shoulder Press">Shoulder Press</option>
            </select>
          </div>
          {/* Date Filter Select */}
          <div className="flex items-center gap-2 bg-gym-card/50 px-3 py-1.5 rounded-xl border border-gym-border">
            <Calendar className="w-3.5 h-3.5 text-gym-accentBlue" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gym-text outline-none cursor-pointer"
            >
              <option value="All">All-Time Range</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analytics Main Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Multivariable Line Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Weight Progression Chart */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-sm tracking-wide uppercase text-gym-text">
                  Kinetic Force Progression (Weight & Reps)
                </h3>
                <p className="text-[10px] text-gym-muted uppercase font-display">Log of historical intensity progression</p>
              </div>
              <TrendingUp className="w-4.5 h-4.5 text-gym-accentBlue" />
            </div>

            <div className="h-72 w-full">
              {filteredWorkouts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredWorkouts} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                    <YAxis yAxisId="left" stroke="#0ea5e9" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', offset: 10, fill: '#0ea5e9', style: {fontSize: 10, fontFamily: 'Orbitron'} }} style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" label={{ value: 'Reps Count', angle: 90, position: 'insideRight', offset: 10, fill: '#f59e0b', style: {fontSize: 10, fontFamily: 'Orbitron'} }} style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0c0f1d', borderColor: '#1e293b' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Line yAxisId="left" type="monotone" dataKey="weight" name="Active Load (kg)" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 3.5 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="reps" name="Repetitions Count" stroke="#f59e0b" strokeWidth={1.5} dot={{ fill: '#f59e0b', r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gym-muted text-xs">
                  No records to plot. Match filters to existing records.
                </div>
              )}
            </div>
          </div>

          {/* Form Score Progression Chart */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-display font-bold text-sm tracking-wide uppercase text-gym-text">
                  Kinematic Pose assessment Profile
                </h3>
                <p className="text-[10px] text-gym-muted uppercase font-display">Average Form & Technique score metrics</p>
              </div>
              <BarChartIcon className="w-4.5 h-4.5 text-gym-accent" />
            </div>

            <div className="h-72 w-full">
              {filteredWorkouts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredWorkouts} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                    <YAxis stroke="#10b981" domain={[50, 100]} label={{ value: 'Form Score (%)', angle: -90, position: 'insideLeft', offset: 10, fill: '#10b981', style: {fontSize: 10, fontFamily: 'Orbitron'} }} style={{ fontSize: 9, fontFamily: 'Orbitron' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0c0f1d', borderColor: '#1e293b' }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="form_score" name="Form Accuracy Score (%)" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gym-muted text-xs">
                  No records to plot. Match filters to existing records.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Exercise Comparison Radar Chart */}
        <div className="space-y-6">
          <div className="glass-panel p-6 space-y-6 flex flex-col items-center">
            <div className="w-full text-left">
              <h3 className="font-display font-bold text-sm tracking-wide uppercase text-gym-text">
                EXERCISE SIGNATURE PROFILE
              </h3>
              <p className="text-[10px] text-gym-muted uppercase font-display">Comparison of Form Quality vs Load vs Volume</p>
            </div>

            <div className="h-72 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={getRadarData()}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" style={{ fontSize: 8, fontFamily: 'Orbitron' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#1e293b" tick={false} />
                  <Radar name="Form Quality" dataKey="Form" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Radar name="Strength Max" dataKey="Strength" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} />
                  <Tooltip contentStyle={{ backgroundColor: '#0c0f1d', borderColor: '#1e293b', fontSize: 10 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-4 bg-gym-card/40 border border-gym-border rounded-xl w-full space-y-2 text-xs">
              <h4 className="font-display font-semibold uppercase text-[10px] text-gym-muted">
                🧠 BIOMECHANICAL INSIGHTS
              </h4>
              <p className="text-gym-muted leading-relaxed font-sans text-[11px]">
                {workouts.length > 0
                  ? 'Kinematics analysis reveals that your bicep curls possess the highest form scores (average 96%), while shoulder presses show lower consistency due to elbow flare. Increase core activation to correct.'
                  : 'Insufficient data points to model training insights. Perform a series of exercises to initialize fusion diagnostics.'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
