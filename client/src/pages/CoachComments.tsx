import React from 'react';
import { 
  MessageSquare, 
  Activity, 
  TrendingUp, 
  History, 
  Droplet,
  UtensilsCrossed
} from 'lucide-react';
import type { EngineState } from '../workout-detection/workoutDetectionEngine';

interface CoachCommentsProps {
  detectionState: EngineState;
}

export const CoachComments: React.FC<CoachCommentsProps> = ({ detectionState }) => {
  const getStatusColor = (status: string, alpha: number = 1) => {
    switch (status) {
      case 'PROPER_WORKOUT':
        return `rgba(34, 197, 94, ${alpha})`; // Green
      case 'IMPROPER_WORKOUT':
        return `rgba(234, 179, 8, ${alpha})`; // Yellow
      case 'NON_WORKOUT':
        return `rgba(239, 68, 68, ${alpha})`; // Red
      case 'RESTING':
        return `rgba(59, 130, 246, ${alpha})`; // Blue
      case 'ANALYZING':
        return `rgba(148, 163, 184, ${alpha})`; // Gray
      default:
        return `rgba(148, 163, 184, ${alpha})`;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PROPER_WORKOUT': return '🟢 PROPER WORKOUT';
      case 'IMPROPER_WORKOUT': return '🟡 IMPROVE FORM';
      case 'NON_WORKOUT': return '🔴 NON-WORKOUT';
      case 'RESTING': return '🔵 RESTING';
      case 'ANALYZING': return '⚪ ANALYZING';
      case 'SENSOR_DISCONNECTED': return '⚠️ SENSOR DISCONNECTED';
      default: return `⚪ ${status.replace(/_/g, ' ')}`;
    }
  };

  const latestFeedback = detectionState.latestFeedback;
  const currentComment = detectionState.comment || "Waiting for movement data...";
  const recommendation = latestFeedback?.recommendation || "Keep performing the exercise while the system analyzes your motion.";
  const recoveryTip = latestFeedback?.recoveryTip || "Allow adequate rest before your next set.";
  const nutritionTip = latestFeedback?.nutritionTip || "Support your training with balanced meals and protein-rich foods.";

  // Dynamic training recommendation text based on form and sets
  const getTrainingRecommendation = () => {
    if (detectionState.sets > 1 && detectionState.formScore < 80) {
      return "Your form decreased during later sets. Consider more recovery between sets.";
    }
    if (detectionState.formScore >= 90) {
      return "Your current form is consistent. Focus on maintaining the same technique.";
    }
    if (detectionState.formScore > 80 && detectionState.feedbackHistory.length > 2) {
      return "Your movement quality is improving. Continue focusing on controlled repetitions.";
    }
    return "Focus on maintaining consistent technique and avoiding sudden changes in tempo.";
  };

  return (
    <div className="space-y-8 py-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h2 className="font-display font-black text-2xl tracking-wider text-gym-text flex items-center gap-2.5">
          <MessageSquare className="w-7 h-7 text-gym-accent" />
          SMART COACH COMMENTS
        </h2>
        <p className="text-xs text-gym-muted uppercase font-display tracking-wider mt-1">
          Personalized workout feedback and improvement recommendations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Spans 2 columns): Smart Coach main feedback and sections */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. CURRENT COACH COMMENT CARD */}
          <div className="glass-panel p-6 border border-gym-border/80 relative overflow-hidden">
            <h3 className="font-display font-bold text-xs uppercase tracking-widest text-gym-muted mb-4">
              SMART COACH
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Comment text and status badge */}
              <div className="space-y-4">
                <div 
                  className="px-4 py-2.5 rounded-xl border text-center font-display font-black text-sm max-w-max uppercase tracking-wider"
                  style={{
                    backgroundColor: getStatusColor(detectionState.status, 0.05),
                    borderColor: getStatusColor(detectionState.status, 0.35),
                    color: getStatusColor(detectionState.status, 1)
                  }}
                >
                  {getStatusLabel(detectionState.status)}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gym-muted uppercase tracking-wider font-display">
                    Coach Comment:
                  </span>
                  <p className="text-base font-sans font-semibold text-gym-text leading-relaxed italic">
                    "{currentComment}"
                  </p>
                </div>
              </div>

              {/* Form metrics */}
              <div className="space-y-4 bg-gym-card/40 border border-gym-border/50 p-5 rounded-2xl">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-display font-bold uppercase text-gym-muted">
                    <span>Form Score</span>
                    <span className="text-gym-accent font-mono text-sm">
                      {isNaN(detectionState.formScore) ? 0 : Math.round(detectionState.formScore)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-gym-border/60 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gym-accent transition-all duration-500"
                      style={{ width: `${isNaN(detectionState.formScore) ? 0 : Math.max(0, Math.min(100, Math.round(detectionState.formScore)))}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-display border-t border-gym-border/30 pt-3">
                  <span className="text-gym-muted font-bold uppercase text-[10px]">Confidence:</span>
                  <span className="text-gym-text font-black text-sm" style={{ color: getStatusColor(detectionState.status) }}>
                    {isNaN(detectionState.confidence) ? 50 : Math.round(detectionState.confidence)}%
                  </span>
                </div>
              </div>

            </div>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gym-accent to-gym-accentBlue" />
          </div>

          {/* 2 & 3. WHAT TO IMPROVE and TRAINING RECOMMENDATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* WHAT TO IMPROVE CARD */}
            <div className="glass-panel p-5 space-y-3.5 border border-gym-border/60">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-gym-accentYellow flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-gym-accentYellow" />
                WHAT TO IMPROVE
              </h4>
              <div className="bg-gym-card/30 border border-gym-border/40 p-4 rounded-xl space-y-2 min-h-24 flex flex-col justify-center">
                <span className="text-[10px] font-black text-gym-muted uppercase font-display leading-none">
                  Core recommendation:
                </span>
                <p className="text-xs text-gym-text leading-relaxed font-semibold italic">
                  "{recommendation}"
                </p>
              </div>
            </div>

            {/* TRAINING RECOMMENDATIONS CARD */}
            <div className="glass-panel p-5 space-y-3.5 border border-gym-border/60">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-gym-accentBlue flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-gym-accentBlue" />
                TRAINING RECOMMENDATION
              </h4>
              <div className="bg-gym-card/30 border border-gym-border/40 p-4 rounded-xl space-y-2 min-h-24 flex flex-col justify-center">
                <span className="text-[10px] font-black text-gym-muted uppercase font-display leading-none">
                  Technique focus:
                </span>
                <p className="text-xs text-gym-text leading-relaxed font-semibold italic">
                  "{getTrainingRecommendation()}"
                </p>
              </div>
            </div>

          </div>

          {/* 5. COMMENT HISTORY LIST */}
          <div className="glass-panel p-6 space-y-4 border border-gym-border/60">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-gym-text flex items-center gap-2">
              <History className="w-4 h-4 text-gym-accent" />
              COMMENT HISTORY
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-display">
                <thead>
                  <tr className="border-b border-gym-border/60 text-gym-muted uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Workout State</th>
                    <th className="py-3 px-4 text-center">Form Score</th>
                    <th className="py-3 px-4">Comment</th>
                    <th className="py-3 px-4">What to Improve</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gym-border/30">
                  {detectionState.feedbackHistory && detectionState.feedbackHistory.length > 0 ? (
                    detectionState.feedbackHistory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gym-card/25 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-gym-text">
                          {item.timestamp}
                        </td>
                        <td className="py-3.5 px-4 font-bold">
                          <span 
                            className="px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider block text-center"
                            style={{
                              backgroundColor: getStatusColor(item.status || 'ANALYZING', 0.05),
                              borderColor: getStatusColor(item.status || 'ANALYZING', 0.3),
                              color: getStatusColor(item.status || 'ANALYZING', 1)
                            }}
                          >
                            {(item.status || 'ANALYZING').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-gym-accent">
                          {isNaN(item.formScore) ? 0 : Math.round(item.formScore)}%
                        </td>
                        <td className="py-3.5 px-4 text-gym-text font-medium max-w-xs truncate italic">
                          "{item.message}"
                        </td>
                        <td className="py-3.5 px-4 text-gym-muted leading-relaxed max-w-sm">
                          {item.recommendation}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gym-muted font-medium italic">
                        No previous comments logged yet. Start a Live Workout to record feedback.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column (Spans 1 column): Recovery & Nutrition guidelines */}
        <div className="space-y-6">
          
          {/* 4. RECOVERY & NUTRITION CARD */}
          <div className="glass-panel p-6 space-y-5 border border-gym-border/70 relative overflow-hidden">
            <h4 className="font-display font-bold text-xs uppercase tracking-widest text-gym-muted">
              RECOVERY & NUTRITION
            </h4>

            {/* Hydration advice card */}
            <div className="p-4 bg-gym-card/40 border border-gym-border/50 rounded-xl space-y-2 flex items-start gap-3">
              <Droplet className="w-5 h-5 text-gym-accentBlue shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gym-muted uppercase tracking-wider font-display">
                  Hydration Advice
                </span>
                <p className="text-xs text-gym-text leading-relaxed leading-normal">
                  "{recoveryTip}"
                </p>
              </div>
            </div>

            {/* Nutrition advice card */}
            <div className="p-4 bg-gym-card/40 border border-gym-border/50 rounded-xl space-y-2 flex items-start gap-3">
              <UtensilsCrossed className="w-5 h-5 text-gym-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gym-muted uppercase tracking-wider font-display">
                  Dietary Guideline
                </span>
                <p className="text-xs text-gym-text leading-relaxed leading-normal font-sans">
                  "{nutritionTip}"
                </p>
              </div>
            </div>

            <div className="text-[9px] text-gym-muted italic border-t border-gym-border/30 pt-3 leading-snug">
              * Nutrition and recovery suggestions support overall physical growth. No medical diagnosis or dosage prescription is implied.
            </div>

            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-gym-accentBlue to-gym-accent" />
          </div>

        </div>

      </div>
    </div>
  );
};
