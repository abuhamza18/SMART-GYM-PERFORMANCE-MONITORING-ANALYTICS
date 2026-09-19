export interface ExerciseConfig {
  name: string;
  primaryAxis: 'ax' | 'ay' | 'az' | 'gx' | 'gy' | 'gz';
  minDurationMs: number;
  maxDurationMs: number;
  minAmplitude: number; // minimum acceleration swing (or gyro swing) to count as active movement
  maxStabilityGyro: number; // threshold for shaking/tremor on lateral gyro axes
  maxStabilityAccel: number; // threshold for shaking/tremor on lateral accel axes
  minLoadRatio: number; // minimum percentage of target weight that must be loaded
}

export const EXERCISE_CONFIGS: Record<string, ExerciseConfig> = {
  'Squat': {
    name: 'Squat',
    primaryAxis: 'ay',
    minDurationMs: 1600,
    maxDurationMs: 4000,
    minAmplitude: 1.2, // ay swing around 9.8
    maxStabilityGyro: 12.0, // gy/gz should be stable
    maxStabilityAccel: 0.8, // lateral sway ax/az
    minLoadRatio: 0.7, // squat uses load cell
  },
  'Bicep Curl': {
    name: 'Bicep Curl',
    primaryAxis: 'gz',
    minDurationMs: 1400,
    maxDurationMs: 3500,
    minAmplitude: 25.0, // gz angular speed swing
    maxStabilityGyro: 15.0, // gx/gy stability
    maxStabilityAccel: 0.6,
    minLoadRatio: 0.4,
  },
  'Bench Press': {
    name: 'Bench Press',
    primaryAxis: 'ay',
    minDurationMs: 1500,
    maxDurationMs: 3800,
    minAmplitude: 1.0,
    maxStabilityGyro: 8.0, // bench press should be extremely stable in rotation
    maxStabilityAccel: 0.5, // ax/az shaking
    minLoadRatio: 0.8,
  },
  'Shoulder Press': {
    name: 'Shoulder Press',
    primaryAxis: 'ay',
    minDurationMs: 1400,
    maxDurationMs: 3600,
    minAmplitude: 1.2,
    maxStabilityGyro: 10.0,
    maxStabilityAccel: 0.6,
    minLoadRatio: 0.6,
  },
  'Deadlift': {
    name: 'Deadlift',
    primaryAxis: 'ay',
    minDurationMs: 1800,
    maxDurationMs: 4500,
    minAmplitude: 0.8,
    maxStabilityGyro: 15.0,
    maxStabilityAccel: 1.2,
    minLoadRatio: 0.9, // Deadlift requires heaviest load cell engagement
  }
};

// Also normalize names in case "Overhead Press" is used in place of "Shoulder Press"
export function getExerciseConfig(name: string): ExerciseConfig {
  const normName = name === 'Overhead Press' ? 'Shoulder Press' : name;
  return EXERCISE_CONFIGS[normName] || EXERCISE_CONFIGS['Bench Press'];
}
