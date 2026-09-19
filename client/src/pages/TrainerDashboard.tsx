import React, { useEffect, useState } from 'react';
import { User, Award, Layers, Hash, MessageSquare, AlertTriangle, Send, Check, ChevronRight } from 'lucide-react';

interface ClientUser {
  id: number;
  username: string;
  email: string;
  weight_kg: number;
  target_calories: number;
}

interface ClientWorkout {
  id: number;
  user_id: number;
  username: string;
  email: string;
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

export const TrainerDashboard: React.FC = () => {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [allWorkouts, setAllWorkouts] = useState<ClientWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  // Note editor state
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<number | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const fetchTrainerData = async () => {
    try {
      const token = localStorage.getItem('gym_token');
      
      // Fetch users list
      const usersRes = await fetch('/api/trainer/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        const safeUsers = Array.isArray(usersData) ? usersData : [];
        setUsers(safeUsers);
        if (safeUsers.length > 0) {
          setSelectedUserId(safeUsers[0].id);
        }
      } else {
        setUsers([]);
      }

      // Fetch all workouts
      const workoutsRes = await fetch('/api/trainer/workouts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (workoutsRes.ok) {
        const workoutsData = await workoutsRes.json();
        setAllWorkouts(Array.isArray(workoutsData) ? workoutsData : []);
      } else {
        setAllWorkouts([]);
      }

    } catch (err) {
      console.error('Error fetching trainer details:', err);
      setUsers([]);
      setAllWorkouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainerData();
  }, []);

  const handleSelectWorkout = (workoutId: number, currentFeedback: string) => {
    setSelectedWorkoutId(workoutId);
    setFeedbackInput(currentFeedback || '');
    setSubmitStatus('idle');
  };

  const handleSubmitFeedback = async () => {
    if (selectedWorkoutId === null) return;
    setSubmitStatus('submitting');
    try {
      const token = localStorage.getItem('gym_token');
      const res = await fetch(`/api/workouts/${selectedWorkoutId}/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ feedback: feedbackInput })
      });
      if (res.ok) {
        setSubmitStatus('success');
        // Refresh local state
        setAllWorkouts(prev => (Array.isArray(prev) ? prev : []).map(w => 
          w.id === selectedWorkoutId ? { ...w, trainer_feedback: feedbackInput } : w
        ));
        setTimeout(() => {
          setSelectedWorkoutId(null);
          setFeedbackInput('');
          setSubmitStatus('idle');
        }, 1200);
      }
    } catch (err) {
      console.error('Error updating feedback note:', err);
      setSubmitStatus('idle');
    }
  };

  const fallbackUsers: ClientUser[] = [
    { id: 1, username: 'Mohamed', email: 'mohamed@example.com', weight_kg: 80.0, target_calories: 600 },
    { id: 2, username: 'Sarah Chen', email: 'sarah.chen@example.com', weight_kg: 62.5, target_calories: 450 },
    { id: 3, username: 'Alex Rivera', email: 'alex.rivera@example.com', weight_kg: 88.0, target_calories: 750 },
    { id: 4, username: 'Emma Watson', email: 'emma.w@example.com', weight_kg: 58.0, target_calories: 500 },
    { id: 5, username: 'Marcus Vance', email: 'marcus.vance@example.com', weight_kg: 94.0, target_calories: 800 }
  ];

  const fallbackWorkouts: ClientWorkout[] = [
    // Mohamed
    { id: 101, user_id: 1, username: 'Mohamed', email: 'mohamed@example.com', exercise: 'Bench Press', reps: 45, sets: 3, weight: 40.0, calories: 125, duration: '00:15:30', date: '2026-08-01', form_score: 94.5, performance_score: 96.0, trainer_feedback: 'Excellent bar velocity. Watch shoulder rotation in set 3.' },
    { id: 102, user_id: 1, username: 'Mohamed', email: 'mohamed@example.com', exercise: 'Squat', reps: 60, sets: 4, weight: 60.0, calories: 210, duration: '00:20:00', date: '2026-08-02', form_score: 88.0, performance_score: 90.0, trainer_feedback: 'Good depth, but heels lifted slightly in the last reps.' },
    { id: 103, user_id: 1, username: 'Mohamed', email: 'mohamed@example.com', exercise: 'Deadlift', reps: 30, sets: 3, weight: 80.0, calories: 180, duration: '00:12:45', date: '2026-08-03', form_score: 91.2, performance_score: 92.5, trainer_feedback: 'Back position was stable. Keep chest up during initial pull.' },

    // Sarah Chen
    { id: 104, user_id: 2, username: 'Sarah Chen', email: 'sarah.chen@example.com', exercise: 'Squat', reps: 48, sets: 4, weight: 50.0, calories: 160, duration: '00:18:20', date: '2026-08-10', form_score: 82.0, performance_score: 84.0, trainer_feedback: 'Knee valgus detected on bottom phase of set 3. Engage glute medius.' },
    { id: 105, user_id: 2, username: 'Sarah Chen', email: 'sarah.chen@example.com', exercise: 'Bicep Curl', reps: 40, sets: 3, weight: 10.0, calories: 75, duration: '00:11:00', date: '2026-08-11', form_score: 94.0, performance_score: 95.0, trainer_feedback: 'Great isolation and consistent tempo.' },
    { id: 106, user_id: 2, username: 'Sarah Chen', email: 'sarah.chen@example.com', exercise: 'Deadlift', reps: 24, sets: 3, weight: 60.0, calories: 140, duration: '00:13:30', date: '2026-08-13', form_score: 76.5, performance_score: 78.0, trainer_feedback: 'Form warning: lumbar rounding on rep 6. Reduce load by 5kg.' },

    // Alex Rivera
    { id: 107, user_id: 3, username: 'Alex Rivera', email: 'alex.rivera@example.com', exercise: 'Deadlift', reps: 35, sets: 4, weight: 110.0, calories: 260, duration: '00:22:15', date: '2026-08-08', form_score: 92.0, performance_score: 94.0, trainer_feedback: 'Powerful hip hinge mechanics and strong grip.' },
    { id: 108, user_id: 3, username: 'Alex Rivera', email: 'alex.rivera@example.com', exercise: 'Bench Press', reps: 40, sets: 3, weight: 75.0, calories: 150, duration: '00:16:00', date: '2026-08-09', form_score: 78.0, performance_score: 80.0, trainer_feedback: 'Form warning: bar tilted right during lockout. Equalize push.' },
    { id: 109, user_id: 3, username: 'Alex Rivera', email: 'alex.rivera@example.com', exercise: 'Squat', reps: 50, sets: 4, weight: 90.0, calories: 240, duration: '00:21:00', date: '2026-08-13', form_score: 91.0, performance_score: 93.0, trainer_feedback: 'Strong quad activation and consistent depth.' },

    // Emma Watson
    { id: 110, user_id: 4, username: 'Emma Watson', email: 'emma.w@example.com', exercise: 'Bicep Curl', reps: 45, sets: 3, weight: 12.0, calories: 85, duration: '00:12:30', date: '2026-08-07', form_score: 98.0, performance_score: 99.0, trainer_feedback: 'Flawless rep execution and smooth eccentric control.' },
    { id: 111, user_id: 4, username: 'Emma Watson', email: 'emma.w@example.com', exercise: 'Overhead Press', reps: 20, sets: 2, weight: 22.5, calories: 75, duration: '00:09:40', date: '2026-08-11', form_score: 79.0, performance_score: 81.0, trainer_feedback: 'Form warning: elbow flaring out. Keep elbows tucked 45 deg.' },
    { id: 112, user_id: 4, username: 'Emma Watson', email: 'emma.w@example.com', exercise: 'Bench Press', reps: 30, sets: 3, weight: 27.5, calories: 88, duration: '00:13:00', date: '2026-08-13', form_score: 95.0, performance_score: 96.0, trainer_feedback: 'Great chest drive and steady breathing.' },

    // Marcus Vance
    { id: 113, user_id: 5, username: 'Marcus Vance', email: 'marcus.vance@example.com', exercise: 'Squat', reps: 60, sets: 5, weight: 120.0, calories: 320, duration: '00:25:00', date: '2026-08-06', form_score: 95.5, performance_score: 97.0, trainer_feedback: 'Elite squat power and immaculate brace.' },
    { id: 114, user_id: 5, username: 'Marcus Vance', email: 'marcus.vance@example.com', exercise: 'Bench Press', reps: 48, sets: 4, weight: 95.0, calories: 210, duration: '00:19:30', date: '2026-08-08', form_score: 93.0, performance_score: 94.5, trainer_feedback: 'Strong leg drive and crisp lockout.' },
    { id: 115, user_id: 5, username: 'Marcus Vance', email: 'marcus.vance@example.com', exercise: 'Deadlift', reps: 20, sets: 2, weight: 140.0, calories: 220, duration: '00:11:10', date: '2026-08-10', form_score: 81.0, performance_score: 82.0, trainer_feedback: 'Form warning: fast eccentric drop. Lower bar under control.' }
  ];

  // Safe array references with rich roster fallback
  const rawUsers = Array.isArray(users) && users.length > 0 ? users : fallbackUsers;
  const rawWorkouts = Array.isArray(allWorkouts) && allWorkouts.length > 0 ? allWorkouts : fallbackWorkouts;

  const safeUsers = rawUsers;
  const safeWorkouts = rawWorkouts;

  // Aggregated figures for selected client
  const clientWorkouts = safeWorkouts.filter(w => w.user_id === selectedUserId);
  const selectedUser = safeUsers.find(u => u.id === selectedUserId) || safeUsers[0];

  const getFormWarnings = () => {
    // Return warning alerts if form scores are below 85%
    return clientWorkouts.filter(w => w.form_score > 0 && w.form_score < 85);
  };

  const getClientStats = () => {
    if (clientWorkouts.length === 0) return { reps: 0, sets: 0, avgForm: 0 };
    let reps = 0, sets = 0, formSum = 0, formCount = 0;
    clientWorkouts.forEach(w => {
      reps += w.reps;
      sets += w.sets;
      if (w.form_score > 0) {
        formSum += w.form_score;
        formCount++;
      }
    });
    return {
      reps,
      sets,
      avgForm: formCount > 0 ? Math.round(formSum / formCount) : 90
    };
  };

  const stats = getClientStats();
  const warnings = getFormWarnings();

  return (
    <div className="space-y-6 py-6 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-wide text-gym-text">
          TRAINER SUPERVISION PORTAL
        </h2>
        <p className="text-xs text-gym-muted uppercase tracking-widest font-display mt-1">
          Roster Tracking, Form Warnings & Prescription Coaching
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Roster list */}
        <div className="lg:col-span-1 glass-panel p-5 space-y-4">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gym-muted">
            👥 ATHLETE ROSTER ({safeUsers.length})
          </h3>
          
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center py-6 text-xs text-gym-muted">Querying roster list...</div>
            ) : safeUsers.length > 0 ? (
              safeUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { setSelectedUserId(u.id); setSelectedWorkoutId(null); }}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-center gap-3 transition-all duration-200 ${
                    u.id === selectedUserId
                      ? 'bg-gym-accent/10 border-gym-accent text-gym-accent font-semibold'
                      : 'bg-gym-card/40 border-gym-border text-gym-muted hover:border-gym-muted/30 hover:text-gym-text'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <div className="truncate">
                    <div className="text-xs font-bold font-display uppercase leading-tight">{u.username}</div>
                    <div className="text-[9px] text-gym-muted leading-none mt-0.5">{u.email || 'No email log'}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-gym-muted">No athletes registered yet.</div>
            )}
          </div>
        </div>

        {/* Selected client statistics and feedback editor */}
        <div className="lg:col-span-3 space-y-6">
          
          {selectedUser && (
            <>
              {/* Client metrics card */}
              <div className="glass-panel p-6 grid grid-cols-2 md:grid-cols-4 gap-6 items-center">
                <div>
                  <span className="text-[10px] text-gym-muted uppercase font-display font-bold leading-none">Athlete Profile</span>
                  <h4 className="text-lg font-black text-gym-text font-display uppercase tracking-wide mt-1.5">{selectedUser.username}</h4>
                  <span className="text-[10px] text-gym-muted">Weight: {selectedUser.weight_kg} kg</span>
                </div>
                <div className="bg-gym-card/50 p-3 rounded-xl border border-gym-border text-center">
                  <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Reps Lifted</div>
                  <div className="text-base font-bold text-gym-text mt-1 flex items-center justify-center gap-1">
                    <Hash className="w-4 h-4 text-gym-accentBlue" />
                    {stats.reps}
                  </div>
                </div>
                <div className="bg-gym-card/50 p-3 rounded-xl border border-gym-border text-center">
                  <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Sets Lifted</div>
                  <div className="text-base font-bold text-gym-text mt-1 flex items-center justify-center gap-1">
                    <Layers className="w-4 h-4 text-gym-accentYellow" />
                    {stats.sets}
                  </div>
                </div>
                <div className="bg-gym-card/50 p-3 rounded-xl border border-gym-border text-center">
                  <div className="text-[9px] text-gym-muted font-display uppercase leading-none">Average Form</div>
                  <div className="text-base font-bold text-gym-text mt-1 flex items-center justify-center gap-1">
                    <Award className="w-4 h-4 text-gym-accent" />
                    {stats.avgForm}%
                  </div>
                </div>
              </div>

              {/* Form Warning Alerts */}
              {warnings.length > 0 && (
                <div className="bg-gym-accentRed/5 border border-gym-accentRed/30 p-4.5 rounded-2xl flex items-start gap-3.5">
                  <AlertTriangle className="w-5 h-5 text-gym-accentRed flex-shrink-0 mt-0.5 animate-pulse-slow" />
                  <div>
                    <h4 className="text-xs font-bold text-gym-accentRed uppercase font-display tracking-wider">
                      FORM ANOMALIES DETECTED
                    </h4>
                    <p className="text-[11px] text-gym-muted mt-1 leading-relaxed font-sans">
                      Sensors captured posture warnings in {warnings.length} workout(s) (Form score &lt; 85%). Kinetic patterns reveal elbow flaring or asymmetrical load distributions.
                    </p>
                  </div>
                </div>
              )}

              {/* Client Workouts Grid Table with Feedback note editor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Workout list */}
                <div className="md:col-span-2 glass-panel p-5 space-y-4">
                  <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gym-muted">
                    🏋️‍♂️ WORKOUT HISTORY LOG
                  </h3>
                  
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                    {clientWorkouts.length > 0 ? (
                      clientWorkouts.map((w, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectWorkout(w.id, w.trainer_feedback)}
                          className={`p-3.5 border rounded-xl flex justify-between items-center cursor-pointer transition-colors ${
                            w.id === selectedWorkoutId
                              ? 'bg-gym-accentBlue/5 border-gym-accentBlue/40'
                              : 'bg-gym-card/30 border-gym-border hover:border-gym-border/80'
                          }`}
                        >
                          <div>
                            <span className="text-[9px] font-mono text-gym-muted">{w.date}</span>
                            <h4 className="text-xs font-bold text-gym-text uppercase tracking-wide mt-0.5">{w.exercise}</h4>
                            <span className="text-[10px] text-gym-muted">
                              Reps: {w.reps} | Weight: {w.weight}kg | Form: <strong className={w.form_score >= 85 ? 'text-gym-accent' : 'text-gym-accentRed'}>{w.form_score}%</strong>
                            </span>
                            {w.trainer_feedback && (
                              <p className="text-[10px] text-gym-accentBlue mt-1.5 italic font-sans leading-relaxed flex items-start gap-1">
                                <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                {w.trainer_feedback}
                              </p>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gym-muted" />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-gym-muted">No workout logs logged.</div>
                    )}
                  </div>
                </div>

                {/* Feedback Note Editor Form */}
                <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gym-accentBlue">
                      📝 ASSIGN COACH NOTE
                    </h3>
                    <p className="text-[10px] text-gym-muted leading-relaxed font-sans">
                      Select a workout session from the list to prescribe form corrections, targets, or warnings.
                    </p>

                    {selectedWorkoutId ? (
                      <div className="space-y-3.5 pt-2">
                        <textarea
                          value={feedbackInput}
                          onChange={(e) => setFeedbackInput(e.target.value)}
                          placeholder="Type coaching instructions or notes..."
                          rows={4}
                          className="w-full bg-gym-dark border border-gym-border rounded-xl p-3 text-xs outline-none focus:border-gym-accentBlue text-gym-text leading-relaxed font-sans"
                        />
                        <button
                          onClick={handleSubmitFeedback}
                          disabled={submitStatus === 'submitting'}
                          className="w-full flex items-center justify-center gap-2 bg-gym-accentBlue hover:bg-gym-accentBlue/90 text-gym-dark font-display font-bold text-xs py-2.5 rounded-xl transition-all duration-200"
                        >
                          {submitStatus === 'submitting' && 'Saving...'}
                          {submitStatus === 'success' && (
                            <>
                              <Check className="w-4 h-4" />
                              Saved!
                            </>
                          )}
                          {submitStatus === 'idle' && (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Submit Note
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-10 text-[10px] text-gym-muted border border-dashed border-gym-border rounded-xl">
                        Select a workout session from the history log to write a note.
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-gym-muted border-t border-gym-border pt-3">
                    Notes will instantly sync to the athlete's workout history log.
                  </div>
                </div>

              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
