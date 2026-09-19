export interface SensorRawData {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  load: number;
  timestamp: number;
}

export type SensorDataSource = 'SIMULATED' | 'WEBSOCKET' | 'MQTT' | 'REST';

export class SensorDataService {
  private static instance: SensorDataService;
  private listeners: ((data: SensorRawData) => void)[] = [];
  private currentSource: SensorDataSource = 'SIMULATED';

  private constructor() {}

  public static getInstance(): SensorDataService {
    if (!SensorDataService.instance) {
      SensorDataService.instance = new SensorDataService();
    }
    return SensorDataService.instance;
  }

  public subscribe(listener: (data: SensorRawData) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public publish(data: SensorRawData): void {
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in sensor data listener:', err);
      }
    });
  }

  public setSource(source: SensorDataSource): void {
    this.currentSource = source;
  }

  public getSource(): SensorDataSource {
    return this.currentSource;
  }
}
