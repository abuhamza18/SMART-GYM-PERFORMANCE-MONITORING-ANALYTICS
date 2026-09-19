import { SensorDataService } from './sensorDataService';
import type { SensorRawData } from './sensorDataService';
import { getExerciseConfig } from './exerciseDetection';
import { FormAnalysis } from './formAnalysis';
import { RepCounter } from './repCounter';
import { FeedbackEngine } from './feedbackEngine';
import type { FeedbackOutput, WorkoutStatus } from './feedbackEngine';
import { DetectionEventLog } from './detectionEventLog';
import type { LogEntry } from './detectionEventLog';

export interface WorkoutSessionSummary {
  exercise: string;
  sets: number;
  reps: number;
  avgFormScore: number;
  properReps: number;
  improperReps: number;
  nonWorkoutCount: number;
  avgConfidence: number;
  bestFormScore: number;
  summaryComment: string;
}

export interface RepCommentEntry {
  repNumber: number;
  comment: string;
  isProper: boolean;
}

export interface EngineState {
  status: WorkoutStatus;
  comment: string;
  confidence: number;
  formScore: number;
  formExplanation: string;
  reps: number;
  sets: number;
  exercise: string;
  weight: number;
  logs: LogEntry[];
  isActive: boolean;
  latestFeedback?: FeedbackOutput;
  feedbackHistory: FeedbackOutput[];
  techniqueScore: number; // Technique/Movement Quality Score
  repComments: RepCommentEntry[]; // Rep-by-rep comment history
}

export class WorkoutDetectionEngine {
  private static instance: WorkoutDetectionEngine;

  // Reusable modules
  private formAnalysis = new FormAnalysis();
  private repCounter = new RepCounter();
  private feedbackEngine = new FeedbackEngine();
  private eventLog = new DetectionEventLog();

  // Engine state variables
  private isSessionActive: boolean = false;
  private currentExercise: string = 'Bench Press';
  private targetWeight: number = 40;
  private currentSets: number = 0;
  private currentReps: number = 0;

  // Session stats tracking
  private properRepsCount: number = 0;
  private improperRepsCount: number = 0;
  private nonWorkoutCount: number = 0;
  private confidenceSum: number = 0;
  private confidenceCount: number = 0;
  private formScoreSum: number = 0;
  private formScoreCount: number = 0;
  private maxFormScore: number = 0;

  // Active status output
  private lastStatus: WorkoutStatus = 'ANALYZING';
  private lastComment: string = 'Select an exercise and perform the movement clearly.';
  private lastConfidence: number = 50;
  private lastFormScore: number = 100;
  private lastFormExplanation: string = 'Calibrating posture...';
  private lastTechniqueScore: number = 88; // Technique Score tracking
  public repComments: RepCommentEntry[] = []; // Rep comment tracker
  private sessionStartTime: number = 0; // Workout elapsed duration tracking

  // Subscriptions
  private unsubscribeSensor: (() => void) | null = null;
  private stateListeners: ((state: EngineState) => void)[] = [];

  private constructor() {}

  public static getInstance(): WorkoutDetectionEngine {
    if (!WorkoutDetectionEngine.instance) {
      WorkoutDetectionEngine.instance = new WorkoutDetectionEngine();
    }
    return WorkoutDetectionEngine.instance;
  }

  public startSession(exercise: string, weight: number) {
    this.currentExercise = exercise;
    this.targetWeight = weight;
    this.isSessionActive = true;
    this.currentSets = 1;
    this.currentReps = 0;
    this.sessionStartTime = Date.now();
    
    // Reset stats
    this.properRepsCount = 0;
    this.improperRepsCount = 0;
    this.nonWorkoutCount = 0;
    this.confidenceSum = 0;
    this.confidenceCount = 0;
    this.formScoreSum = 0;
    this.formScoreCount = 0;
    this.maxFormScore = 0;

    const config = getExerciseConfig(exercise);
    this.repCounter.reset(exercise, config);
    this.eventLog.clear();
    this.feedbackEngine.clearHistory();
    this.eventLog.addLog(`Workout detected: Starting session for ${exercise} at ${weight}kg`, 'info');

    // Subscribe to sensor updates
    if (this.unsubscribeSensor) this.unsubscribeSensor();
    this.unsubscribeSensor = SensorDataService.getInstance().subscribe(data => {
      this.handleIncomingSensorData(data);
    });

    this.notifyStateChange();
  }

  public nextSet() {
    if (!this.isSessionActive) return;
    this.currentSets++;
    const lastReps = this.currentReps;
    this.currentReps = 0;
    const config = getExerciseConfig(this.currentExercise);
    this.repCounter.reset(this.currentExercise, config);
    this.eventLog.addLog(`Set ${this.currentSets} started.`, 'info');
    
    // Feed set complete override event into FeedbackEngine
    const feedbackInput = {
      exercise: this.currentExercise,
      workoutStatus: 'RESTING' as const,
      confidence: 95,
      formScore: this.formScoreCount > 0 ? Math.round(this.formScoreSum / this.formScoreCount) : 90,
      movementQuality: {
        isShaking: false,
        isTooFast: false,
        isAsymmetric: false,
        speedRating: 'GOOD' as const,
        rangeShort: false
      },
      movementSpeed: 0,
      movementRange: 0,
      repCount: lastReps,
      setNumber: this.currentSets,
      sensorStatus: 'CONNECTED' as const,
      weight: this.targetWeight,
      durationSeconds: this.sessionStartTime > 0 ? Math.floor((Date.now() - this.sessionStartTime) / 1000) : 0
    };
    
    const feedback = this.feedbackEngine.process(feedbackInput);
    this.lastStatus = feedback.status;
    this.lastComment = feedback.message;
    this.lastConfidence = feedback.confidence;

    this.notifyStateChange();
  }

  public stopSession(): WorkoutSessionSummary {
    this.isSessionActive = false;
    this.sessionStartTime = 0;
    if (this.unsubscribeSensor) {
      this.unsubscribeSensor();
      this.unsubscribeSensor = null;
    }
    
    this.eventLog.addLog('Workout session ended.', 'info');
    const summary = this.generateSummary();
    this.notifyStateChange();
    return summary;
  }

  public resetSession() {
    this.isSessionActive = false;
    this.sessionStartTime = 0;
    this.currentReps = 0;
    this.currentSets = 0;
    if (this.unsubscribeSensor) {
      this.unsubscribeSensor();
      this.unsubscribeSensor = null;
    }
    this.eventLog.clear();
    this.feedbackEngine.clearHistory();
    this.lastStatus = 'ANALYZING';
    this.lastComment = 'Waiting for sensor data...';
    this.lastConfidence = 50;
    this.lastFormScore = 100;
    this.lastTechniqueScore = 88;
    this.repComments = [];
    this.notifyStateChange();
  }

  public subscribe(listener: (state: EngineState) => void): () => void {
    this.stateListeners.push(listener);
    // Send initial state
    listener(this.getEngineState());
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  public getEngineState(): EngineState {
    const history = this.feedbackEngine.getHistory();
    return {
      status: this.lastStatus,
      comment: this.lastComment,
      confidence: this.lastConfidence,
      formScore: this.lastFormScore,
      formExplanation: this.lastFormExplanation,
      reps: this.currentReps,
      sets: this.currentSets,
      exercise: this.currentExercise,
      weight: this.targetWeight,
      logs: this.eventLog.getLogs(),
      isActive: this.isSessionActive,
      latestFeedback: history[0],
      feedbackHistory: history,
      techniqueScore: this.lastTechniqueScore,
      repComments: this.repComments
    };
  }

  private calculateTechniqueScore(
    formScore: number,
    isShaking: boolean,
    isAsymmetric: boolean,
    rangeShort: boolean,
    isTooFast: boolean,
    speedRating: string
  ): number {
    // 1. Form Score component (40%)
    const formPart = formScore * 0.40;

    // 2. Consistency component (20%): deduct if shaking or asymmetric
    let consistency = 100;
    if (isShaking) consistency -= 15;
    if (isAsymmetric) consistency -= 15;
    const consistencyPart = Math.max(50, consistency) * 0.20;

    // 3. Movement Range component (15%): deduct if short range
    const rangePart = (rangeShort ? 65 : 100) * 0.15;

    // 4. Movement Speed component (15%): deduct if too fast or slow
    let speedVal = 100;
    if (isTooFast || speedRating === 'FAST') {
      speedVal = 60;
    } else if (speedRating === 'SLOW') {
      speedVal = 80;
    }
    const speedPart = speedVal * 0.15;

    // 5. Rep Quality component (10%): ratio of proper reps in current session
    const totalReps = this.properRepsCount + this.improperRepsCount;
    const repQuality = totalReps > 0 ? (this.properRepsCount / totalReps) * 100 : 100;
    const repQualityPart = repQuality * 0.10;

    // Sum and round (cap between 0 and 100)
    const totalScore = Math.round(formPart + consistencyPart + rangePart + speedPart + repQualityPart);
    return Math.max(0, Math.min(100, totalScore));
  }

  private handleIncomingSensorData(data: SensorRawData) {
    if (!this.isSessionActive) return;

    const config = getExerciseConfig(this.currentExercise);
    
    // Add point to analyzer
    this.formAnalysis.addDataPoint(data);
    
    // 1. Run form analysis
    const formMetrics = this.formAnalysis.analyze(config, this.targetWeight);
    
    // Extract overrides if provided by the Demo Simulator
    const simData = data as any;
    
    const isShaking = simData.simulatedQuality?.isShaking ?? formMetrics.isShaking;
    const isTooFast = simData.simulatedQuality?.isTooFast ?? formMetrics.isTooFast;
    const isAsymmetric = simData.simulatedQuality?.isAsymmetric ?? formMetrics.isAsymmetric;
    const speedRating = simData.simulatedQuality?.speedRating ?? formMetrics.speedRating;
    const rangeShort = simData.simulatedQuality?.rangeShort ?? (simData.simulatedFormScore !== undefined ? simData.simulatedFormScore < 80 : formMetrics.formScore < 80 && Math.random() < 0.1);

    this.lastFormScore = simData.simulatedFormScore ?? formMetrics.formScore;
    this.lastFormExplanation = formMetrics.explanation;

    // 2. Determine raw detection status
    let rawStatus: WorkoutStatus = 'PROPER_WORKOUT';
    
    const primaryVal = data[config.primaryAxis] as number;
    const baseline = config.primaryAxis.startsWith('g') ? 0 : 9.8;
    const isStationary = Math.abs(primaryVal - baseline) < config.minAmplitude * 0.15;
    const isNoLoad = data.load < 1.0;

    if (simData.simulatedStatus !== undefined) {
      rawStatus = simData.simulatedStatus as WorkoutStatus;
    } else {
      if (isStationary) {
        rawStatus = 'RESTING';
      } else if (isNoLoad) {
        rawStatus = 'NON_WORKOUT';
      } else if (isShaking || isTooFast || isAsymmetric) {
        rawStatus = 'IMPROPER_WORKOUT';
      }
    }

    // Accumulate stats if not in non-workout state
    if (rawStatus !== 'NON_WORKOUT') {
      this.formScoreSum += this.lastFormScore;
      this.formScoreCount++;
      if (this.lastFormScore > this.maxFormScore) {
        this.maxFormScore = this.lastFormScore;
      }
    } else {
      this.nonWorkoutCount++;
    }

    // 3. Confidence score evaluation
    let calculatedConfidence = 50;
    if (rawStatus === 'PROPER_WORKOUT') {
      calculatedConfidence = Math.round(85 + (this.lastFormScore - 50) * 0.3); // 85% to 100%
    } else if (rawStatus === 'IMPROPER_WORKOUT') {
      calculatedConfidence = Math.round(75 + (100 - this.lastFormScore) * 0.25); // 75% to 88%
    } else if (rawStatus === 'RESTING') {
      calculatedConfidence = 95;
    } else if (rawStatus === 'NON_WORKOUT') {
      calculatedConfidence = 85;
    } else {
      calculatedConfidence = 60;
    }

    const confidence = simData.simulatedConfidence ?? calculatedConfidence;
    this.confidenceSum += confidence;
    this.confidenceCount++;

    // 4. Run rep detection (Only evaluate reps when NOT in non-workout state!)
    let repEvent = null;
    if (rawStatus !== 'NON_WORKOUT') {
      repEvent = this.repCounter.processDataPoint(data, {
        isShaking,
        isTooFast
      });
    }

    if (repEvent) {
      this.currentReps = repEvent.repNumber;
      
      // Determine comments for recent list:
      let repMsg = 'Good form.';
      if (!repEvent.isProper) {
        if (isTooFast) {
          repMsg = 'Slow down.';
        } else if (rangeShort) {
          repMsg = 'Improve movement range.';
        } else {
          repMsg = 'Form needs attention.';
        }
      } else {
        repMsg = 'Good form.';
      }

      this.repComments.unshift({
        repNumber: repEvent.repNumber,
        comment: repMsg,
        isProper: repEvent.isProper
      });

      if (this.repComments.length > 20) {
        this.repComments.pop();
      }

      if (repEvent.isProper) {
        this.properRepsCount++;
        this.eventLog.addLog(`Rep ${repEvent.repNumber} completed (Good Form).`, 'success');
      } else {
        this.improperRepsCount++;
        this.eventLog.addLog(`Rep ${repEvent.repNumber} completed. Warning: ${repEvent.reason}`, 'warning');
      }
    }

    // 5. Feed into central FeedbackEngine
    const durationSeconds = this.sessionStartTime > 0 ? Math.floor((Date.now() - this.sessionStartTime) / 1000) : 0;
    
    const feedbackInput = {
      exercise: this.currentExercise,
      workoutStatus: rawStatus,
      confidence,
      formScore: this.lastFormScore,
      movementQuality: {
        isShaking,
        isTooFast,
        isAsymmetric,
        speedRating,
        rangeShort,
        unexpectedMovement: simData.simulatedQuality?.unexpectedMovement
      },
      movementSpeed: Math.abs(primaryVal - baseline),
      movementRange: config.minAmplitude,
      repCount: this.currentReps,
      setNumber: this.currentSets,
      sensorStatus: 'CONNECTED' as const,
      simulatedComment: simData.simulatedComment,
      weight: this.targetWeight,
      durationSeconds: durationSeconds
    };

    const feedback = this.feedbackEngine.process(feedbackInput);
    
    this.lastStatus = feedback.status;
    this.lastComment = feedback.message;
    this.lastConfidence = feedback.confidence;
    this.lastFormScore = feedback.formScore;

    // Calculate Technique Score
    this.lastTechniqueScore = this.calculateTechniqueScore(
      this.lastFormScore,
      isShaking,
      isAsymmetric,
      rangeShort,
      isTooFast,
      speedRating
    );

    // Periodic warnings in event logs
    if (rawStatus === 'IMPROPER_WORKOUT' && Math.random() < 0.02) {
      this.eventLog.addLog(`Improper movement detected: ${this.lastComment}`, 'warning');
    }

    this.notifyStateChange();
  }

  private generateSummary(): WorkoutSessionSummary {
    const avgForm = this.formScoreCount > 0 ? Math.round(this.formScoreSum / this.formScoreCount) : 100;
    const avgConf = this.confidenceCount > 0 ? Math.round(this.confidenceSum / this.confidenceCount) : 90;
    const totalReps = this.properRepsCount + this.improperRepsCount;

    let summaryComment = '';
    if (totalReps === 0) {
      summaryComment = 'No workout movements were completed during this session. Please select an exercise and attempt consistent repetitions.';
    } else {
      const properRatio = this.properRepsCount / totalReps;
      if (properRatio >= 0.9) {
        summaryComment = `Excellent workout session! Your ${this.currentExercise} form was outstanding with ${this.properRepsCount} proper reps out of ${totalReps}. Focus on keeping the load stable and you can consider increasing the weight slightly.`;
      } else if (properRatio >= 0.7) {
        summaryComment = `Good effort on your ${this.currentExercise}. You performed ${this.properRepsCount} out of ${totalReps} repetitions with proper form. Keep your movement speed consistent and focus on a full range of motion.`;
      } else if (this.improperRepsCount > 0) {
        summaryComment = `Workout completed, but your form needs some attention. Focus on slowing down the movement and maintaining joint stability. You had ${this.improperRepsCount} reps with posture warnings.`;
      } else {
        summaryComment = `Workout session completed. You logged ${totalReps} total repetitions with an average form accuracy of ${avgForm}%. Maintain a controlled tempo in your next session.`;
      }
    }

    return {
      exercise: this.currentExercise,
      sets: this.currentSets,
      reps: totalReps,
      avgFormScore: avgForm,
      properReps: this.properRepsCount,
      improperReps: this.improperRepsCount,
      nonWorkoutCount: Math.round(this.nonWorkoutCount / 10),
      avgConfidence: avgConf,
      bestFormScore: this.maxFormScore || 100,
      summaryComment
    };
  }

  private notifyStateChange() {
    const state = this.getEngineState();
    this.stateListeners.forEach(listener => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error updating state listener:', err);
      }
    });
  }
}
