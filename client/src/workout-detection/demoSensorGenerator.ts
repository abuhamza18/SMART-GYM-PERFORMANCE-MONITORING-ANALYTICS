import { SensorDataService } from './sensorDataService';
import type { SensorRawData } from './sensorDataService';
import { WorkoutDetectionEngine } from './workoutDetectionEngine';

export type DemoFormCondition = 'PROPER' | 'TOO_FAST' | 'SHAKING' | 'RESTING' | 'NON_WORKOUT' | 'ANALYZING';

export interface SimulatedSensorData extends SensorRawData {
  simulatedStatus?: string;
  simulatedConfidence?: number;
  simulatedFormScore?: number;
  simulatedComment?: string; // Explicit simulated comment override
  simulatedQuality?: {
    isShaking: boolean;
    isTooFast: boolean;
    isAsymmetric: boolean;
    speedRating: 'GOOD' | 'FAST' | 'SLOW';
    rangeShort: boolean;
    unexpectedMovement?: boolean;
  };
}

export class DemoSensorGenerator {
  private intervalId: any = null;
  private isRunning: boolean = false;
  private currentExercise: string = 'Bench Press';
  private currentWeight: number = 40;
  
  // Simulation tracking variables
  private startTime: number = 0;
  private timeOffset: number = 0;
  private repProgress: number = 0;
  private totalRepsCount: number = 0;
  
  // To avoid calling nextSet multiple times
  private setTriggered: boolean = false;

  constructor() {}

  public start(exercise: string, weight: number) {
    if (this.isRunning) this.stop();
    
    this.currentExercise = exercise;
    this.currentWeight = weight;
    this.isRunning = true;
    this.startTime = Date.now();
    this.timeOffset = 0;
    this.repProgress = 0;
    this.totalRepsCount = 0;
    this.setTriggered = false;

    const sensorService = SensorDataService.getInstance();
    
    this.intervalId = setInterval(() => {
      this.timeOffset += 0.1; // 100ms steps
      
      const data = this.generateDataPoint();
      sensorService.publish(data);
    }, 100);
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  private generateDataPoint(): SimulatedSensorData {
    const ts = Date.now();
    const elapsed = (ts - this.startTime) / 1000; // in seconds
    const noise = (amp: number) => (Math.random() - 0.5) * amp;

    // Define conditions based on the user-requested timeline:
    // 0s - 5s: NON_WORKOUT -> "No workout detected."
    // 5s - 8s: ANALYZING -> "Analyzing your movement..."
    // 8s - 13s: PROPER_WORKOUT -> "Good form. Keep going."
    // 13s - 18s: IMPROPER_WORKOUT (Too Fast) -> "Slow down your movement."
    // 18s - 23s: PROPER_WORKOUT -> "Good correction."
    // 23s+: RESTING -> "Rest detected. Ready for the next set."
    
    let activeCondition: DemoFormCondition = 'PROPER';
    let simulatedStatus = 'PROPER_WORKOUT';
    let simulatedConfidence = 95;
    let simulatedFormScore = 94;
    let simulatedComment = 'Good form. Keep going.';
    let simulatedQuality: {
      isShaking: boolean;
      isTooFast: boolean;
      isAsymmetric: boolean;
      speedRating: 'GOOD' | 'FAST' | 'SLOW';
      rangeShort: boolean;
      unexpectedMovement?: boolean;
    } = {
      isShaking: false,
      isTooFast: false,
      isAsymmetric: false,
      speedRating: 'GOOD',
      rangeShort: false,
      unexpectedMovement: false
    };

    if (elapsed < 5) {
      activeCondition = 'NON_WORKOUT';
      simulatedStatus = 'NON_WORKOUT';
      simulatedConfidence = 85;
      simulatedFormScore = 50;
      simulatedComment = 'No workout detected.';
      simulatedQuality.unexpectedMovement = true;
    } else if (elapsed < 8) {
      activeCondition = 'ANALYZING';
      simulatedStatus = 'ANALYZING';
      simulatedConfidence = 45; // Below 60% threshold
      simulatedFormScore = 100;
      simulatedComment = 'Analyzing your movement...';
    } else if (elapsed < 13) {
      activeCondition = 'PROPER';
      simulatedStatus = 'PROPER_WORKOUT';
      simulatedConfidence = 94;
      simulatedFormScore = 88;
      simulatedComment = 'Good form. Keep going.';
    } else if (elapsed < 18) {
      activeCondition = 'TOO_FAST';
      simulatedStatus = 'IMPROPER_WORKOUT';
      simulatedConfidence = 88;
      simulatedFormScore = 65;
      simulatedComment = 'Slow down your movement.';
      simulatedQuality.isTooFast = true;
      simulatedQuality.speedRating = 'FAST' as const;
    } else if (elapsed < 23) {
      activeCondition = 'PROPER';
      simulatedStatus = 'PROPER_WORKOUT';
      simulatedConfidence = 96;
      simulatedFormScore = 94;
      simulatedComment = 'Good correction.';
    } else {
      activeCondition = 'RESTING';
      simulatedStatus = 'RESTING';
      simulatedConfidence = 98;
      simulatedFormScore = 90;
      simulatedComment = 'Rest detected. Ready for the next set.';

      // Trigger Set completed exactly once at transition
      if (!this.setTriggered) {
        this.setTriggered = true;
        // Schedule nextSet on engine
        setTimeout(() => {
          WorkoutDetectionEngine.getInstance().nextSet();
        }, 10);
      }
    }

    // Default stationary baseline
    let ax = noise(0.15);
    let ay = 9.8 + noise(0.15);
    let az = noise(0.15);
    let gx = noise(0.4);
    let gy = noise(0.4);
    let gz = noise(0.4);
    let load = 0.0;

    if (activeCondition === 'RESTING') {
      load = 0.0 + Math.max(0, noise(0.1));
      return {
        ax, ay, az, gx, gy, gz, load, timestamp: ts,
        simulatedStatus,
        simulatedConfidence,
        simulatedFormScore,
        simulatedComment,
        simulatedQuality
      };
    }

    if (activeCondition === 'NON_WORKOUT') {
      ax = Math.sin(this.timeOffset * 5) * 1.5 + noise(0.5);
      ay = 9.8 + Math.cos(this.timeOffset * 3) * 1.2 + noise(0.5);
      az = Math.sin(this.timeOffset * 2) * 0.8 + noise(0.5);
      gx = Math.cos(this.timeOffset * 4) * 35.0 + noise(10);
      gy = Math.sin(this.timeOffset * 3) * 20.0 + noise(10);
      gz = Math.cos(this.timeOffset * 5) * 15.0 + noise(10);
      load = Math.max(0, 0.5 + noise(0.2)); // Low load cell engagement
      return {
        ax, ay, az, gx, gy, gz, load, timestamp: ts,
        simulatedStatus,
        simulatedConfidence,
        simulatedFormScore,
        simulatedComment,
        simulatedQuality
      };
    }

    // Active movement rep progress simulation
    const repDuration = activeCondition === 'TOO_FAST' ? 1.2 : 2.6;
    const increment = 0.1 / repDuration;
    this.repProgress += increment;

    if (this.repProgress >= 1.0) {
      this.repProgress = 0.0;
      this.totalRepsCount++;
    }

    const angle = this.repProgress * Math.PI * 2;
    const sinVal = Math.sin(angle);
    const cosVal = Math.cos(angle);

    switch (this.currentExercise) {
      case 'Squat':
        ay = 9.8 + sinVal * 2.2 + noise(0.2);
        ax = noise(0.3);
        az = cosVal * 0.6 + noise(0.3);
        gx = sinVal * 8.0 + noise(1.0);
        gy = noise(1.5);
        gz = noise(1.5);
        load = this.currentWeight + (sinVal > 0 ? sinVal * 8.5 : -sinVal * 4.0) + noise(0.5);
        break;

      case 'Bicep Curl':
        ay = 9.8 + cosVal * 1.5 + noise(0.15);
        ax = sinVal * 0.8 + noise(0.2);
        az = noise(0.2);
        gz = sinVal * 45.0 + noise(1.5);
        gx = noise(2.0);
        gy = noise(2.0);
        load = this.currentWeight * Math.max(0.2, Math.sin(this.repProgress * Math.PI)) + noise(0.3);
        break;

      case 'Bench Press':
        ay = 9.8 + sinVal * 1.8 + noise(0.1);
        ax = noise(0.15);
        az = noise(0.15);
        gx = noise(1.2);
        gy = noise(1.2);
        gz = noise(1.2);
        load = this.currentWeight + sinVal * 3.5 + noise(0.4);
        break;

      case 'Shoulder Press':
      case 'Overhead Press':
        ay = 9.8 + sinVal * 2.0 + noise(0.15);
        ax = noise(0.2);
        az = cosVal * 0.4 + noise(0.2);
        gx = noise(1.5);
        gy = noise(1.5);
        gz = noise(1.5);
        load = this.currentWeight + sinVal * 2.5 + noise(0.3);
        break;

      case 'Deadlift':
        ay = 9.8 + sinVal * 1.4 + noise(0.25);
        ax = cosVal * 1.0 + noise(0.3);
        az = noise(0.3);
        gx = sinVal * 15.0 + noise(2.0);
        gy = noise(2.0);
        gz = noise(2.0);
        if (this.repProgress < 0.1 || this.repProgress > 0.9) {
          load = this.currentWeight * 0.2 + noise(0.5);
        } else {
          load = this.currentWeight + (sinVal > 0 ? sinVal * 12.0 : 0) + noise(1.0);
        }
        break;

      default:
        ay = 9.8 + sinVal * 1.5 + noise(0.2);
        load = this.currentWeight + noise(0.5);
        break;
    }

    return {
      ax: parseFloat(ax.toFixed(3)),
      ay: parseFloat(ay.toFixed(3)),
      az: parseFloat(az.toFixed(3)),
      gx: parseFloat(gx.toFixed(2)),
      gy: parseFloat(gy.toFixed(2)),
      gz: parseFloat(gz.toFixed(2)),
      load: parseFloat(Math.max(0, load).toFixed(2)),
      timestamp: ts,
      simulatedStatus,
      simulatedConfidence,
      simulatedFormScore,
      simulatedComment,
      simulatedQuality
    };
  }
}
