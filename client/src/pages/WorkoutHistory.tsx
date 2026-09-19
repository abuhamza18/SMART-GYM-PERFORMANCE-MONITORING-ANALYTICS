import React, { useEffect, useState } from 'react';
import { Search, Dumbbell, Award } from 'lucide-react';

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

export const WorkoutHistory: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [exerciseFilter, setExerciseFilter] = useState('All');

  const fetchWorkouts = async () => {
    try {
      let token = localStorage.getItem('gym_token');
      const offline = JSON.parse(localStorage.getItem('offline_workouts') || '[]');
      
      const res = await fetch('/api/workouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : [];
        const merged = [...safeData, ...offline];
        setWorkouts(merged);
        setFilteredWorkouts(merged);
      } else {
        setWorkouts(offline);
        setFilteredWorkouts(offline);
      }
    } catch (err) {
      console.error('Error fetching workouts:', err);
      const offline = JSON.parse(localStorage.getItem('offline_workouts') || '[]');
      setWorkouts(offline);
      setFilteredWorkouts(offline);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  // Handle Search and Filter
  useEffect(() => {
    let result = [...workouts];

    if (search) {
      result = result.filter(w => 
        w.exercise.toLowerCase().includes(search.toLowerCase()) ||
        w.date.includes(search)
      );
    }

    if (exerciseFilter !== 'All') {
      result = result.filter(w => w.exercise.toLowerCase() === exerciseFilter.toLowerCase());
    }

    setFilteredWorkouts(result);
  }, [search, exerciseFilter, workouts]);

  return (
    <div className="space-y-6 py-6 animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl tracking-wide text-gym-text">
            WORKOUT TELEMETRY LOGS
          </h2>
          <p className="text-xs text-gym-muted uppercase tracking-widest font-display mt-1">
            Searchable Database of Biomechanical History
          </p>
        </div>

        {/* Search/Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="flex items-center gap-2 bg-gym-panel border border-gym-border rounded-xl px-3.5 py-2 w-full sm:w-60 focus-within:border-gym-accent transition-colors">
            <Search className="w-4 h-4 text-gym-muted" />
            <input
              type="text"
              placeholder="Search exercise/date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-gym-text outline-none w-full"
            />
          </div>

          {/* Exercise Filter */}
          <div className="flex items-center gap-2 bg-gym-panel border border-gym-border rounded-xl px-3.5 py-2">
            <Dumbbell className="w-4 h-4 text-gym-accent" />
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
        </div>
      </div>

      {/* History Grid Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gym-border bg-gym-card/45 text-[10px] uppercase font-display tracking-widest text-gym-muted font-bold">
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6">Exercise</th>
                <th className="py-4 px-6">Sets</th>
                <th className="py-4 px-6">Reps</th>
                <th className="py-4 px-6">Weight Load</th>
                <th className="py-4 px-6">Duration</th>
                <th className="py-4 px-6">Form Score</th>
                <th className="py-4 px-6">Trainer Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gym-border text-xs text-gym-muted">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gym-muted">
                    Querying SQLite logs...
                  </td>
                </tr>
              ) : filteredWorkouts.length > 0 ? (
                filteredWorkouts.map((w, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4.5 px-6 font-mono text-[11px] text-gym-text">{w.date}</td>
                    <td className="py-4.5 px-6 font-display font-bold text-gym-text uppercase tracking-wide">
                      {w.exercise}
                    </td>
                    <td className="py-4.5 px-6 font-semibold text-gym-text">{w.sets}</td>
                    <td className="py-4.5 px-6 font-semibold text-gym-text">{w.reps}</td>
                    <td className="py-4.5 px-6 font-semibold text-gym-text">{w.weight} kg</td>
                    <td className="py-4.5 px-6 font-mono text-[11px]">{w.duration}</td>
                    <td className="py-4.5 px-6">
                      <span className={`inline-flex items-center gap-1.5 font-bold font-mono px-2 py-0.5 rounded-full border ${
                        (w.form_score || 85) >= 90 
                          ? 'border-gym-accent/30 text-gym-accent bg-gym-accent/5' 
                          : (w.form_score || 85) >= 80 
                            ? 'border-gym-accentBlue/30 text-gym-accentBlue bg-gym-accentBlue/5' 
                            : 'border-gym-accentRed/30 text-gym-accentRed bg-gym-accentRed/5'
                      }`}>
                        {(w.form_score || 85)}%
                      </span>
                    </td>
                    <td className="py-4.5 px-6 max-w-xs truncate text-[11px] italic font-sans" title={w.trainer_feedback || 'No comments yet'}>
                      {w.trainer_feedback ? (
                        <span className="text-gym-accentBlue flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 flex-shrink-0" />
                          {w.trainer_feedback}
                        </span>
                      ) : (
                        <span className="text-gym-muted/50">--</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gym-muted">
                    No matching workout logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
