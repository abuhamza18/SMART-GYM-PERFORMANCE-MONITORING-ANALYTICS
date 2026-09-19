export type WorkoutStatus = 'PROPER_WORKOUT' | 'IMPROPER_WORKOUT' | 'NON_WORKOUT' | 'RESTING' | 'ANALYZING' | 'SENSOR_DISCONNECTED';
export type SeverityStatus = 'success' | 'warning' | 'error' | 'info' | 'critical';

export interface MovementQuality {
  isShaking: boolean;
  isTooFast: boolean;
  isAsymmetric: boolean;
  speedRating: 'GOOD' | 'FAST' | 'SLOW';
  rangeShort: boolean;
  unexpectedMovement?: boolean;
}

export interface FeedbackInput {
  exercise: string;
  workoutStatus: WorkoutStatus;
  confidence: number;
  formScore: number;
  movementQuality: MovementQuality;
  movementSpeed: number;
  movementRange: number;
  repCount: number;
  setNumber: number;
  sensorStatus: 'CONNECTED' | 'DISCONNECTED';
  simulatedComment?: string;
  weight: number;            // Current weight load
  durationSeconds: number;   // Elapsed workout duration in seconds
}

export interface FeedbackOutput {
  status: WorkoutStatus;
  message: string;
  severity: SeverityStatus;
  confidence: number;
  formScore: number;
  timestamp: string;
  id: string;
  recommendation: string;    // Main recommendation / What to Improve
  recoveryTip?: string;      // Recovery / Rest tip
  nutritionTip?: string;     // Nutrition / Hydration tip
}

interface QueuedMessage {
  message: string;
  status: WorkoutStatus;
  severity: SeverityStatus;
  durationMs: number;
  recommendation?: string;
  recoveryTip?: string;
  nutritionTip?: string;
}

export class FeedbackEngine {
  private history: FeedbackOutput[] = [];
  private latestFeedback: FeedbackOutput | null = null;

  // Trackers for event detection
  private lastRepCount = 0;
  private lastSetNumber = 0;
  private lastStatus: WorkoutStatus | null = null;
  private lastMessage = '';
  private lastFormScore = 100;

  // Queue system for temporary alerts (reps, sets, summary overrides)
  private messageQueue: QueuedMessage[] = [];
  private currentQueueItem: QueuedMessage | null = null;
  private queueItemExpiresAt = 0;

  // Stable comment tracking (cooldown & prevention of flickering/spam)
  private stableComment = 'Analyzing your movement...';
  private stableCommentStatus: WorkoutStatus = 'ANALYZING';
  private stableRecommendation = 'Keep performing the exercise while the system analyzes your motion.';
  private stableRecoveryTip = 'Allow adequate rest before your next set.';
  private stableNutritionTip = 'Support your training with balanced meals and protein-rich foods.';
  private lastCommentChangeTime = 0;
  private readonly minDisplayDurationMs = 2000; // Display for at least 2 seconds



  public getHistory(): FeedbackOutput[] {
    return this.history;
  }

  public clearHistory(): void {
    this.history = [];
    this.latestFeedback = null;
    this.stableComment = 'Analyzing your movement...';
    this.stableCommentStatus = 'ANALYZING';
    this.stableRecommendation = 'Keep performing the exercise while the system analyzes your motion.';
    this.stableRecoveryTip = 'Allow adequate rest before your next set.';
    this.stableNutritionTip = 'Support your training with balanced meals and protein-rich foods.';
    this.lastCommentChangeTime = 0;
    this.messageQueue = [];
    this.currentQueueItem = null;
    this.queueItemExpiresAt = 0;
  }

  /**
   * Main entry point to process a new telemetry/workout frame.
   */
  public process(input: FeedbackInput): FeedbackOutput {
    const now = Date.now();
    const timestampStr = new Date().toTimeString().split(' ')[0]; // "19:04:21"

    // 1. Check for Rep / Set completion triggers to populate override queue
    this.checkRepSetTriggers(input);

    // 2. Determine raw status & message from override queue OR normal classification
    let status: WorkoutStatus;
    let message = '';
    let severity: SeverityStatus = 'info';
    let recommendation = '';
    let recoveryTip = '';
    let nutritionTip = '';

    if (this.currentQueueItem && now < this.queueItemExpiresAt) {
      // Use queue override
      status = this.currentQueueItem.status;
      message = this.currentQueueItem.message;
      severity = this.currentQueueItem.severity;
      recommendation = this.currentQueueItem.recommendation || 'Keep performing controlled repetitions.';
      recoveryTip = this.currentQueueItem.recoveryTip || 'Allow adequate recovery before starting.';
      nutritionTip = this.currentQueueItem.nutritionTip || 'Support your training with balanced meals.';
    } else {
      // Process next queued message if available
      if (this.messageQueue.length > 0) {
        this.currentQueueItem = this.messageQueue.shift()!;
        this.queueItemExpiresAt = now + this.currentQueueItem.durationMs;
        status = this.currentQueueItem.status;
        message = this.currentQueueItem.message;
        severity = this.currentQueueItem.severity;
        recommendation = this.currentQueueItem.recommendation || 'Keep performing controlled repetitions.';
        recoveryTip = this.currentQueueItem.recoveryTip || 'Allow adequate recovery before starting.';
        nutritionTip = this.currentQueueItem.nutritionTip || 'Support your training with balanced meals.';
      } else {
        // Clear override
        this.currentQueueItem = null;

        // Perform standard state classification with personal coach rules
        const result = this.resolveCoachFeedback(input);

        // State-change detection & Feedback cooldown & Duplicate message prevention:
        // 1. Status changes override the display duration immediately for high responsiveness
        // 2. Otherwise, we check if the minDisplayDuration has elapsed before updating comment
        const statusChanged = result.status !== this.stableCommentStatus;
        const timeElapsed = (now - this.lastCommentChangeTime) >= this.minDisplayDurationMs;

        if (statusChanged || timeElapsed) {
          if (result.comment !== this.stableComment || statusChanged) {
            this.stableComment = result.comment;
            this.stableCommentStatus = result.status;
            this.stableRecommendation = result.recommendation;
            this.stableRecoveryTip = result.recoveryTip;
            this.stableNutritionTip = result.nutritionTip;
            this.lastCommentChangeTime = now;
          }
        }

        status = this.stableCommentStatus;
        message = this.stableComment;
        recommendation = this.stableRecommendation;
        recoveryTip = this.stableRecoveryTip;
        nutritionTip = this.stableNutritionTip;

        // Map severity to status
        if (status === 'PROPER_WORKOUT') severity = 'success';
        else if (status === 'IMPROPER_WORKOUT') severity = 'warning';
        else if (status === 'NON_WORKOUT') severity = 'error';
        else if (status === 'RESTING' || status === 'ANALYZING') severity = 'info';
        else severity = 'critical';
      }
    }

    // 3. Construct Feedback Output
    const currentFeedback: FeedbackOutput = {
      status,
      message,
      severity,
      confidence: input.confidence,
      formScore: input.formScore,
      timestamp: timestampStr,
      id: Math.random().toString(36).substring(2, 9),
      recommendation,
      recoveryTip,
      nutritionTip
    };

    // 4. Implement Cooldown, Suppression & Change Detection for History Log
    const stateChanged = status !== this.lastStatus;
    const messageChanged = message !== this.lastMessage;
    const formChangedSignificantly = Math.abs(input.formScore - this.lastFormScore) >= 10;
    
    // We emit an event in the history logs when state/message changes or form drops significantly
    const shouldEmit = !this.latestFeedback || stateChanged || messageChanged || formChangedSignificantly;

    if (shouldEmit) {
      this.history.unshift(currentFeedback);
      if (this.history.length > 100) {
        this.history.pop();
      }
      this.latestFeedback = currentFeedback;
    } else if (this.latestFeedback) {
      // Update confidence and score in place on the latest item to keep real-time stats fresh
      this.latestFeedback.confidence = input.confidence;
      this.latestFeedback.formScore = input.formScore;
      this.latestFeedback.timestamp = timestampStr;
      this.latestFeedback.recommendation = recommendation;
      this.latestFeedback.recoveryTip = recoveryTip;
      this.latestFeedback.nutritionTip = nutritionTip;
    } else {
      this.latestFeedback = currentFeedback;
    }

    // Save trackers
    this.lastRepCount = input.repCount;
    this.lastSetNumber = input.setNumber;
    this.lastStatus = status;
    this.lastMessage = message;
    this.lastFormScore = input.formScore;

    return this.latestFeedback;
  }

  /**
   * Helper to inspect if rep or set count changed and load alert queue.
   */
  private checkRepSetTriggers(input: FeedbackInput): void {
    const repNumStr = input.repCount.toString().padStart(2, '0');
    
    const defaultRecov = 'Take an appropriate rest before your next set.';
    const defaultNutri = 'Include protein-rich foods as part of your regular meals.';

    // 1. Rep Completed Event
    if (input.repCount > this.lastRepCount && input.repCount > 0 && input.workoutStatus !== 'NON_WORKOUT') {
      const isProper = input.formScore >= 75 && 
                       !input.movementQuality.isTooFast && 
                       !input.movementQuality.isShaking && 
                       !input.movementQuality.rangeShort;

      // Clear standard message queue to prioritize rep completion alert
      this.messageQueue = [];
      this.currentQueueItem = null;

      if (isProper) {
        this.messageQueue.push({
          message: `REP ${repNumStr} COMPLETED`,
          status: 'PROPER_WORKOUT',
          severity: 'success',
          durationMs: 1200,
          recommendation: 'Good consistency across your repetitions.',
          recoveryTip: defaultRecov,
          nutritionTip: defaultNutri
        });
        
        // Dynamic success suggestion
        this.messageQueue.push({
          message: '✓ Good rep.',
          status: 'PROPER_WORKOUT',
          severity: 'success',
          durationMs: 1500,
          recommendation: 'Your form is stable at this load. Keep the movement controlled.',
          recoveryTip: defaultRecov,
          nutritionTip: 'Include protein-rich foods as part of your regular meals to support recovery.'
        });
      } else {
        this.messageQueue.push({
          message: `REP ${repNumStr} COMPLETED`,
          status: 'IMPROPER_WORKOUT',
          severity: 'warning',
          durationMs: 1200,
          recommendation: 'Your repetitions are becoming less consistent.',
          recoveryTip: 'Consider taking a longer rest period.',
          nutritionTip: defaultNutri
        });
        
        this.messageQueue.push({
          message: '⚠ Form needs attention.',
          status: 'IMPROPER_WORKOUT',
          severity: 'warning',
          durationMs: 1200,
          recommendation: 'Try to maintain a controlled movement.',
          recoveryTip: 'Allow enough recovery before starting the next set.',
          nutritionTip: defaultNutri
        });

        // Determine specific issue comment to display
        let issueComment = 'Slow down during the movement.';
        let recStr = 'Prioritize controlled movement.';
        
        if (input.movementQuality.rangeShort) {
          issueComment = 'Complete the full movement range.';
          recStr = 'Try to maintain a consistent movement range.';
        } else if (input.movementQuality.isShaking) {
          issueComment = 'Try to maintain a more controlled movement.';
          recStr = 'Stabilize your posture and brace your core.';
        } else if (input.movementQuality.isAsymmetric) {
          issueComment = 'Keep your movement consistent.';
          recStr = 'Focus on balanced force distribution.';
        }

        this.messageQueue.push({
          message: `"${issueComment}"`,
          status: 'IMPROPER_WORKOUT',
          severity: 'warning',
          durationMs: 1800,
          recommendation: recStr,
          recoveryTip: 'Take a longer rest to restore technique.',
          nutritionTip: defaultNutri
        });
      }
    }

    // Target Reps reached trigger (Target Reps = 12)
    if (input.repCount === 12 && this.lastRepCount === 11) {
      this.messageQueue.push({
        message: 'TARGET REPS COMPLETED',
        status: 'PROPER_WORKOUT',
        severity: 'success',
        durationMs: 1500,
        recommendation: 'Target reps completed. Good work.',
        recoveryTip: 'Take your rest period before the next set.',
        nutritionTip: 'Support training growth with protein-rich foods.'
      });
    }

    // 2. Set Completed Event
    if (input.setNumber > this.lastSetNumber && this.lastSetNumber > 0) {
      const setNumStr = this.lastSetNumber.toString().padStart(2, '0');
      this.messageQueue = [];
      this.currentQueueItem = null;
      
      this.messageQueue.push({
        message: `SET ${setNumStr} COMPLETED`,
        status: 'RESTING',
        severity: 'info',
        durationMs: 1500,
        recommendation: 'Set completed successfully. Take an appropriate rest.',
        recoveryTip: 'Allow adequate recovery before starting your next set.',
        nutritionTip: 'Support training with balanced meals containing protein and carbs.'
      });
    }
  }

  /**
   * Core prioritized resolver engine.
   */
  private resolveCoachFeedback(input: FeedbackInput): {
    status: WorkoutStatus;
    comment: string;
    recommendation: string;
    recoveryTip: string;
    nutritionTip: string;
  } {
    let status = input.workoutStatus;
    let comment = '';
    let recommendation = 'Keep the current load and focus on controlled repetitions.';
    let recoveryTip = 'Take an appropriate rest before your next set.';
    let nutritionTip = 'Support your training with balanced meals and protein-rich foods.';

    // Base Nutrition tips
    const nutritionTips = [
      'Support your training with balanced meals containing protein, carbohydrates, healthy fats, fruits and vegetables.',
      'Include protein-rich foods as part of your regular meals to support normal growth and recovery.',
      'Good training also requires adequate food and rest.'
    ];
    // Rotate tip based on timestamp to keep it dynamic but stable
    const nutritionIndex = Math.max(0, Math.floor(Date.now() / 20000)) % nutritionTips.length;
    nutritionTip = nutritionTips[nutritionIndex];

    const isShaking = input.movementQuality.isShaking;
    const isAsymmetric = input.movementQuality.isAsymmetric;
    const isTooFast = input.movementQuality.isTooFast || input.movementQuality.speedRating === 'FAST';
    const rangeShort = input.movementQuality.rangeShort;

    // Check for simulated comment overrides first
    if (input.simulatedComment) {
      comment = input.simulatedComment;
      
      if (comment.includes('inconsistent') || comment.includes('load') || comment.includes('reducing')) {
        status = 'IMPROPER_WORKOUT';
        recommendation = 'Consider reducing the load and focus on controlled repetitions.';
        recoveryTip = 'Allow enough recovery before continuing.';
      } else if (comment.includes('fast') || comment.includes('Slow')) {
        status = 'IMPROPER_WORKOUT';
        recommendation = 'Slow down and prioritize controlled movement.';
      } else if (comment.includes('range') || comment.includes('small') || comment.includes('full')) {
        status = 'IMPROPER_WORKOUT';
        recommendation = 'Try to maintain a consistent movement range.';
      } else if (comment.includes('Rest') || comment.includes('rest') || comment.includes('detected')) {
        status = 'RESTING';
        recommendation = 'Take an appropriate rest before your next set.';
        recoveryTip = 'Rest detected. Recover before starting your next set.';
      } else if (comment.includes('correction')) {
        status = 'PROPER_WORKOUT';
        recommendation = 'Your recent form score is improving. Keep focusing on technique.';
      } else if (comment.includes('No workout')) {
        status = 'NON_WORKOUT';
        recommendation = 'Please start the selected exercise.';
      }

      if (input.durationSeconds > 120) {
        recoveryTip = 'Good session. Remember to stay hydrated and allow adequate recovery.';
      }

      return { status, comment, recommendation, recoveryTip, nutritionTip };
    }

    // 1. Safety/Technique Concerns (Shaking/Asymmetric and poor form)
    if (input.formScore < 75 && (isShaking || isAsymmetric)) {
      if (isShaking) {
        comment = 'Your posture needs adjustment to maintain control.';
      } else {
        comment = 'Keep your movement symmetric to prevent uneven load.';
      }
      recommendation = 'Focus on maintaining a controlled technique and brace your core.';
      recoveryTip = 'Allow enough recovery before continuing.';
    }
    // 2. Excessive Load (Weight > 30kg and poor form)
    else if (input.weight > 30 && input.formScore < 75) {
      comment = 'Your form is becoming inconsistent. Consider reducing the load and focusing on controlled repetitions.';
      recommendation = 'Consider reducing the load and focus on controlled repetitions.';
      recoveryTip = 'Take an appropriate rest before your next set.';
    }
    // 3. Poor Movement Quality (Speed / Range)
    else if (input.formScore < 80 && (isTooFast || rangeShort)) {
      if (isTooFast) {
        comment = 'Your repetitions are becoming too fast. Slow down and prioritize controlled movement.';
        recommendation = 'Slow down and prioritize controlled movement.';
      } else {
        comment = 'Try to maintain a consistent movement range.';
        
        const key = input.exercise.toUpperCase();
        if (key.includes('SQUAT')) {
          recommendation = 'Try to complete the full squat range.';
        } else if (key.includes('CURL')) {
          recommendation = 'Complete the full curl movement.';
        } else {
          recommendation = 'Try to maintain a consistent movement range.';
        }
      }
    }
    // 4. Rest/Recovery
    else if (status === 'RESTING') {
      comment = 'Rest detected. Recover before starting your next set.';
      recommendation = 'Take your rest period and start the next set when ready.';
      recoveryTip = 'Take an appropriate rest before your next set.';
    }
    // 5. Workout Consistency / Progress (Form decreasing across sets)
    else if (input.setNumber > 1 && input.formScore < 80) {
      comment = 'Form quality is decreasing across sets. Consider reducing the load or taking more rest.';
      recommendation = 'Consider reducing the load or taking more rest.';
      recoveryTip = 'Take an appropriate rest before your next set.';
    }
    // 6. General nutrition/hydration (elapsed time warning)
    else if (input.durationSeconds > 120) {
      comment = 'Good session. Remember to stay hydrated and allow adequate recovery.';
      recommendation = 'Keep the current load and focus on controlled repetitions.';
      recoveryTip = 'Remember to stay hydrated during your workout.';
    }
    // 7. Positive Encouragement (Proper workout)
    else if (status === 'PROPER_WORKOUT') {
      if (input.formScore >= 90) {
        comment = 'Excellent movement quality. Keep your current technique.';
      } else {
        comment = 'Your form is stable at this load. Keep the movement controlled.';
      }
      recommendation = 'Keep the current load and focus on controlled repetitions.';
    }
    else {
      // Bypasses to analyzing
      comment = 'Analyzing your movement...';
      recommendation = 'Keep performing the exercise while the system analyzes your motion.';
    }

    return { status, comment, recommendation, recoveryTip, nutritionTip };
  }
}
