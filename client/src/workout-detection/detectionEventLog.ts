export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export class DetectionEventLog {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 50;

  constructor() {}

  public addLog(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): LogEntry {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      message,
      type
    };

    this.logs.unshift(entry); // Newest at the start
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    return entry;
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public clear() {
    this.logs = [];
  }
}
