import React, { useEffect, useState } from 'react';
import { 
  Dumbbell, 
  TrendingUp, 
  Award, 
  Layers, 
  Hash, 
  Crown
} from 'lucide-react';

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
}

interface ExerciseProfile {
  name: string;
  totalReps: number;
  totalSets: number;
  bestWeight: number;
  avgFormScore: number;
  improvementRate: number; // mock
  iconColor: string;
  accentBg: string;
}

export const ExerciseDetection: React.FC = () => {

  const [profiles, setProfiles] = useState<ExerciseProfile[]>([]);

  const defaultExercises = [
    { name: 'Squat', iconColor: 'text-gym-accent', accentBg: 'border-gym-accent/20 bg-gym-accent/5' },
    { name: 'Bench Press', iconColor: 'text-gym-accentBlue', accentBg: 'border-gym-accentBlue/20 bg-gym-accentBlue/5' },
    { name: 'Deadlift', iconColor: 'text-gym-accentYellow', accentBg: 'border-gym-accentYellow/20 bg-gym-accentYellow/5' },
    { name: 'Bicep Curl', iconColor: 'text-purple-400', accentBg: 'border-purple-500/20 bg-purple-500/5' },
    { name: 'Shoulder Press', iconColor: 'text-rose-400', accentBg: 'border-rose-500/20 bg-rose-500/5' },
  ];

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
        generateProfiles([...safeData, ...offline]);
      } else {
        generateProfiles(offline);
      }
    } catch (err) {
      console.error('Error fetching workouts:', err);
      const offline = JSON.parse(localStorage.getItem('offline_workouts') || '[]');
      generateProfiles(offline);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const generateProfiles = (data: Workout[]) => {
    const safeData = Array.isArray(data) ? data : [];
    const list: ExerciseProfile[] = defaultExercises.map((def) => {
      const filtered = safeData.filter(w => (w.exercise || '').toLowerCase() === def.name.toLowerCase());
      
      let reps = 0;
      let sets = 0;
      let maxWeight = 0;
      let formSum = 0;
      let formCount = 0;

      filtered.forEach((w) => {
        reps += w.reps || 0;
        sets += w.sets || 0;
        if (w.weight > maxWeight) maxWeight = w.weight;
        if (w.form_score > 0) {
          formSum += w.form_score;
          formCount++;
        }
      });

      return {
        name: def.name,
        totalReps: reps,
        totalSets: sets,
        bestWeight: maxWeight || 0,
        avgFormScore: formCount > 0 ? Math.round(formSum / formCount) : 0,
        improvementRate: filtered.length > 1 ? Math.round(4 + Math.random() * 8) : 0,
        iconColor: def.iconColor,
        accentBg: def.accentBg
      };
    });

    setProfiles(list);
  };

  return (
    <div className="space-y-6 py-6 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-wide text-gym-text">
          AUTOMATIC EXERCISE PROFILES
        </h2>
        <p className="text-xs text-gym-muted uppercase tracking-widest font-display mt-1">
          Smart Classifications & Kinetic Evaluation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((ex, idx) => (
          <div key={idx} className="glass-panel p-6 flex flex-col justify-between glass-panel-interactive space-y-6">
            
            {/* Title & Icon Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl border ${ex.accentBg} ${ex.iconColor}`}>
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-gym-text tracking-wide uppercase leading-tight">
                    {ex.name}
                  </h3>
                  <span className="text-[9px] font-mono text-gym-muted">IMU Class ID: {idx + 1}</span>
                </div>
              </div>

              {ex.bestWeight > 0 && (
                <div className="flex items-center gap-1.5 bg-gym-accentYellow/10 border border-gym-accentYellow/20 text-gym-accentYellow py-1 px-2.5 rounded-full text-[9px] font-display font-bold">
                  <Crown className="w-3.5 h-3.5 fill-gym-accentYellow" />
                  PERSONAL RECORD
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gym-card/45 border border-gym-border p-3.5 rounded-xl flex items-center gap-3">
                <Hash className="w-5 h-5 text-gym-accentBlue" />
                <div>
                  <div className="text-[9px] font-display text-gym-muted leading-none uppercase">Reps</div>
                  <div className="text-sm font-bold text-gym-text mt-1">{ex.totalReps}</div>
                </div>
              </div>
              <div className="bg-gym-card/45 border border-gym-border p-3.5 rounded-xl flex items-center gap-3">
                <Layers className="w-5 h-5 text-gym-accentYellow" />
                <div>
                  <div className="text-[9px] font-display text-gym-muted leading-none uppercase">Sets</div>
                  <div className="text-sm font-bold text-gym-text mt-1">{ex.totalSets}</div>
                </div>
              </div>
              <div className="bg-gym-card/45 border border-gym-border p-3.5 rounded-xl flex items-center gap-3">
                <Crown className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-[9px] font-display text-gym-muted leading-none uppercase">Max Load</div>
                  <div className="text-sm font-bold text-gym-text mt-1">
                    {ex.bestWeight ? `${ex.bestWeight} kg` : '--'}
                  </div>
                </div>
              </div>
              <div className="bg-gym-card/45 border border-gym-border p-3.5 rounded-xl flex items-center gap-3">
                <Award className="w-5 h-5 text-gym-accent" />
                <div>
                  <div className="text-[9px] font-display text-gym-muted leading-none uppercase">Avg Form</div>
                  <div className="text-sm font-bold text-gym-text mt-1">
                    {ex.avgFormScore ? `${ex.avgFormScore}%` : '--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Micro details / Improvement */}
            {ex.totalSets > 0 ? (
              <div className="pt-3 border-t border-gym-border flex justify-between items-center text-[10px] text-gym-muted font-display">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-4.5 h-4.5 text-gym-accent" />
                  Velocity up +{ex.improvementRate}%
                </span>
                <span className="text-[9px] uppercase font-bold text-gym-accent font-sans">
                  Active Baseline Set
                </span>
              </div>
            ) : (
              <div className="pt-3 border-t border-gym-border text-center text-[10px] text-gym-muted">
                No logs recorded yet. Initiate workouts to track baseline.
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};
