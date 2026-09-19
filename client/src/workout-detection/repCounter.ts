import type { SensorRawData } from './sensorDataService';
import type { ExerciseConfig } from './exerciseDetection';

export interface RepEvent {
  repNumber: number;
  durationMs: number;
  isProper: boolean;
  reason?: string;
  maxLoad: number;
}

export class RepCounter {
  private config: ExerciseConfig | null = null;
  private repCount: number = 0;
  
  // State machine variables
  private state: 'IDLE' | 'PHASE_1' | 'PHASE_2' = 'IDLE';
  private repStartTime: number = 0;
  private peakValue: number = 0;
  private maxLoadInRep: number = 0;
  
  // High-frequency history for peak detection
  private history: number[] = [];
  private readonly historyLimit = 15; // 1.5s window
  
  constructor() {}

  public reset(_exercise: string, config: ExerciseConfig) {
    this.config = config;
    this.repCount = 0;
    this.state = 'IDLE';
    this.repStartTime = 0;
    this.peakValue = 0;
    this.maxLoadInRep = 0;
    this.history = [];
  }

  public getRepCount(): number {
    return this.repCount;
  }

  /**
   * Processes a single raw data point and returns a RepEvent if a repetition is completed.
   */
  public processDataPoint(data: SensorRawData, formAnalysis: { isShaking: boolean; isTooFast: boolean }): RepEvent | null {
    if (!this.config) return null;

    const value = data[this.config.primaryAxis] as number;
    this.history.push(value);
    if (this.history.length > this.historyLimit) {
      this.history.shift();
    }

    // Keep track of maximum load during this rep
    if (data.load > this.maxLoadInRep) {
      this.maxLoadInRep = data.load;
    }

    const baseline = this.config.primaryAxis.startsWith('g') ? 0 : 9.8;
    const deviation = value - baseline;
    const threshold = this.config.minAmplitude * 0.4; // 40% of peak amplitude to trigger transitions

    const now = data.timestamp;

    switch (this.state) {
      case 'IDLE':
        // Start phase 1 when we deviate significantly from baseline
        if (Math.abs(deviation) > threshold) {
          this.state = 'PHASE_1';
          this.repStartTime = now;
          this.peakValue = value;
          this.maxLoadInRep = data.load;
        }
        break;

      case 'PHASE_1':
        // Update peak value
        if (Math.abs(value - baseline) > Math.abs(this.peakValue - baseline)) {
          this.peakValue = value;
        }

        // Transition to phase 2 when the signal crosses baseline or swings in opposite direction
        const crossedBaseline = (this.peakValue - baseline > 0 && deviation < -threshold) || 
                              (this.peakValue - baseline < 0 && deviation > threshold);

        if (crossedBaseline) {
          this.state = 'PHASE_2';
        }

        // Timeout fallback: if rep takes too long without completing, reset to IDLE
        if (now - this.repStartTime > 6000) {
          this.state = 'IDLE';
        }
        break;

      case 'PHASE_2':
        // Rep is completed when the signal returns near baseline
        if (Math.abs(deviation) < threshold * 0.5) {
          const duration = now - this.repStartTime;
          this.state = 'IDLE';

          // Validate rep constraints (duration and amplitude)
          const isValidDuration = duration >= this.config.minDurationMs && duration <= this.config.maxDurationMs;
          const amplitudeAchieved = Math.abs(this.peakValue - baseline);
          const isValidAmplitude = amplitudeAchieved >= this.config.minAmplitude * 0.7;
          const isLoadSufficient = data.load >= this.config.minLoadRatio * this.maxLoadInRep;

          if (isValidDuration && isValidAmplitude) {
            this.repCount++;
            
            // Determine if the form was proper or improper during this rep
            let isProper = true;
            let reason = 'Good form! Keep going.';
            
            if (formAnalysis.isTooFast || duration < this.config.minDurationMs) {
              isProper = false;
              reason = 'Slow down and maintain proper movement.';
            } else if (formAnalysis.isShaking) {
              isProper = false;
              reason = 'Your posture needs adjustment.';
            } else if (!isLoadSufficient || data.load < this.config.minLoadRatio * 10) { // arbitrary threshold for load cell connectivity
              isProper = false;
              reason = 'Workout not detected. Please position yourself correctly.';
            }

            const event: RepEvent = {
              repNumber: this.repCount,
              durationMs: duration,
              isProper,
              reason,
              maxLoad: this.maxLoadInRep
            };

            return event;
          }
        }

        // Timeout fallback
        if (now - this.repStartTime > 6000) {
          this.state = 'IDLE';
        }
        break;
    }

    return null;
  }
}
