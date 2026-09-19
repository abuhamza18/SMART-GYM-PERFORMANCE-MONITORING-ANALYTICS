import type { SensorRawData } from './sensorDataService';
import type { ExerciseConfig } from './exerciseDetection';

export interface FormMetrics {
  formScore: number;
  explanation: string;
  isShaking: boolean;
  isTooFast: boolean;
  isAsymmetric: boolean;
  speedRating: 'GOOD' | 'FAST' | 'SLOW';
}

export class FormAnalysis {
  private buffer: SensorRawData[] = [];
  private readonly bufferSize = 30; // 3-second history at 10Hz

  constructor() {}

  public addDataPoint(data: SensorRawData) {
    this.buffer.push(data);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
  }

  public analyze(config: ExerciseConfig, targetWeight: number): FormMetrics {
    if (this.buffer.length < 10) {
      return {
        formScore: 100,
        explanation: 'Calibrating posture...',
        isShaking: false,
        isTooFast: false,
        isAsymmetric: false,
        speedRating: 'GOOD'
      };
    }

    // 1. Calculate stability (standard deviation on lateral axes)
    // Lateral axes are axes perpendicular to primaryAxis
    const lateralGyros: number[] = [];
    const lateralAccels: number[] = [];
    const primarySpeeds: number[] = [];
    const loads: number[] = [];

    this.buffer.forEach(d => {
      loads.push(d.load);
      
      // Collect primary axis velocity values to measure speed
      const primaryVal = d[config.primaryAxis];
      primarySpeeds.push(primaryVal);

      // Collect lateral values for stability
      if (config.primaryAxis !== 'ax' && config.primaryAxis !== 'gx') {
        lateralAccels.push(d.ax);
        lateralGyros.push(d.gx);
      }
      if (config.primaryAxis !== 'ay' && config.primaryAxis !== 'gy') {
        // for bicep curls, primary is gz, lateral gyro is gx, gy
        if (config.primaryAxis !== 'gz') {
          lateralGyros.push(d.gy);
        }
      }
      if (config.primaryAxis !== 'az' && config.primaryAxis !== 'gz') {
        lateralAccels.push(d.az);
        lateralGyros.push(d.gz);
      }
    });

    const gyroStdev = this.getStandardDeviation(lateralGyros);
    const accelStdev = this.getStandardDeviation(lateralAccels);

    const isShaking = gyroStdev > config.maxStabilityGyro || accelStdev > config.maxStabilityAccel;

    // 2. Measure speed
    // Look at rate of change on primary axis
    let maxDelta = 0;
    for (let i = 1; i < primarySpeeds.length; i++) {
      const delta = Math.abs(primarySpeeds[i] - primarySpeeds[i - 1]);
      if (delta > maxDelta) maxDelta = delta;
    }

    // Benchmark rate of change threshold:
    // If the acceleration changes by more than 1.5 units per 100ms (high jerk), it is too fast.
    const rawSpeedThreshold = config.primaryAxis.startsWith('g') ? 18.0 : 1.35;
    const isTooFast = maxDelta > rawSpeedThreshold;
    const speedRating = isTooFast ? 'FAST' : 'GOOD';

    // 3. Measure load symmetry/consistency
    // Check if load fluctuates erratically (e.g. bar tilting)
    const loadStdev = this.getStandardDeviation(loads);
    const isAsymmetric = loadStdev > targetWeight * 0.15; // fluctuation of > 15% target weight

    // 4. Calculate score
    let score = 100;
    let deductions = 0;

    if (isShaking) {
      // Shaking deduction
      const severity = Math.min(20, Math.round((gyroStdev / config.maxStabilityGyro) * 8));
      deductions += severity;
    }
    if (isTooFast) {
      deductions += 15;
    }
    if (isAsymmetric) {
      deductions += 10;
    }

    // Range of motion check
    const minVal = Math.min(...primarySpeeds);
    const maxVal = Math.max(...primarySpeeds);
    const range = maxVal - minVal;
    const rangeShort = range < config.minAmplitude * 0.65;

    if (rangeShort) {
      deductions += 12;
    }

    score = Math.max(50, 100 - deductions);

    // 5. Select description comment
    let explanation = 'Good form! Keep going.';
    if (isShaking) {
      explanation = 'Your posture needs adjustment.';
    } else if (isTooFast) {
      explanation = 'Slow down and maintain proper movement.';
    } else if (rangeShort) {
      explanation = 'Movement range needs improvement.';
    } else if (isAsymmetric) {
      explanation = 'Maintain center balance and brace core.';
    } else {
      explanation = 'Good movement consistency.';
    }

    return {
      formScore: score,
      explanation,
      isShaking,
      isTooFast,
      isAsymmetric,
      speedRating
    };
  }

  private getStandardDeviation(array: number[]): number {
    if (array.length === 0) return 0;
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
  }
}
