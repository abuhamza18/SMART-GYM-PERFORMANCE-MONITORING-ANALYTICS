import React, { useEffect, useRef } from 'react';
import { Cpu, Wifi, HardDrive, RefreshCw, Power } from 'lucide-react';

interface SensorMonitoringProps {
  espConnected: boolean;
  telemetryData: {
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    load: number;
    formScore: number;
    formFeedback: string;
    timestamp: number;
  } | null;
  espPowered?: boolean;
  onToggleEspPower?: () => void;
}

export const SensorMonitoring: React.FC<SensorMonitoringProps> = ({ 
  espConnected, 
  telemetryData,
  espPowered = true,
  onToggleEspPower
}) => {
  // Oscilloscope canvas references
  const accCanvasRef = useRef<HTMLCanvasElement>(null);
  const gyroCanvasRef = useRef<HTMLCanvasElement>(null);

  // Buffers for canvas drawing
  const accHistoryRef = useRef<{ ax: number; ay: number; az: number }[]>([]);
  const gyroHistoryRef = useRef<{ gx: number; gy: number; gz: number }[]>([]);

  const isNodeActive = espConnected && espPowered;

  // Update history buffers
  useEffect(() => {
    if (telemetryData && isNodeActive) {
      const accHist = accHistoryRef.current;
      accHist.push({
        ax: telemetryData.ax,
        ay: telemetryData.ay,
        az: telemetryData.az
      });
      if (accHist.length > 100) accHist.shift();

      const gyroHist = gyroHistoryRef.current;
      gyroHist.push({
        gx: telemetryData.gx,
        gy: telemetryData.gy,
        gz: telemetryData.gz
      });
      if (gyroHist.length > 100) gyroHist.shift();
    } else if (!isNodeActive) {
      accHistoryRef.current = [];
      gyroHistoryRef.current = [];
    }
  }, [telemetryData, isNodeActive]);

  // Oscilloscope rendering loop
  useEffect(() => {
    let animId = 0;
    const accCanvas = accCanvasRef.current;
    const gyroCanvas = gyroCanvasRef.current;
    if (!accCanvas || !gyroCanvas) return;

    const accCtx = accCanvas.getContext('2d');
    const gyroCtx = gyroCanvas.getContext('2d');
    if (!accCtx || !gyroCtx) return;

    const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = '#05070c';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 0.5;
      const step = 20;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // Baseline
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();
    };

    const drawOfflineOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number, text: string) => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = 'bold 12px Orbitron, sans-serif';
      ctx.fillStyle = '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText(text, w / 2, h / 2);
    };

    const draw = () => {
      const w = accCanvas.width;
      const h = accCanvas.height;

      // Draw Accel Canvas
      drawGrid(accCtx, w, h);
      if (isNodeActive) {
        const accHist = accHistoryRef.current;
        if (accHist.length > 1) {
          // AX - Red
          accCtx.strokeStyle = '#ef4444';
          accCtx.lineWidth = 1.5;
          accCtx.beginPath();
          accHist.forEach((pt, idx) => {
            const x = (idx / 100) * w;
            const y = (h / 2) - (pt.ax * 8);
            if (idx === 0) accCtx.moveTo(x, y);
            else accCtx.lineTo(x, y);
          });
          accCtx.stroke();

          // AY - Green
          accCtx.strokeStyle = '#10b981';
          accCtx.lineWidth = 1.5;
          accCtx.beginPath();
          accHist.forEach((pt, idx) => {
            const x = (idx / 100) * w;
            const val = pt.ay - 9.8;
            const y = (h / 2) - (val * 8);
            if (idx === 0) accCtx.moveTo(x, y);
            else accCtx.lineTo(x, y);
          });
          accCtx.stroke();

          // AZ - Blue
          accCtx.strokeStyle = '#3b82f6';
          accCtx.lineWidth = 1.5;
          accCtx.beginPath();
          accHist.forEach((pt, idx) => {
            const x = (idx / 100) * w;
            const y = (h / 2) - (pt.az * 8);
            if (idx === 0) accCtx.moveTo(x, y);
            else accCtx.lineTo(x, y);
          });
          accCtx.stroke();
        }
      } else {
        drawOfflineOverlay(accCtx, w, h, 'ESP32 NODE POWERED OFF / DISCONNECTED');
      }

      // Draw Gyro Canvas
      drawGrid(gyroCtx, w, h);
      if (isNodeActive) {
        const gyroHist = gyroHistoryRef.current;
        if (gyroHist.length > 1) {
          // GX - Red
          gyroCtx.strokeStyle = '#ef4444';
          gyroCtx.lineWidth = 1.5;
          gyroCtx.beginPath();
          gyroHist.forEach((pt, idx) => {
            const x = (idx / 100) * w;
            const y = (h / 2) - (pt.gx * 1);
            if (idx === 0) gyroCtx.moveTo(x, y);
            else gyroCtx.lineTo(x, y);
          });
          gyroCtx.stroke();

          // GY - Green
          gyroCtx.strokeStyle = '#10b981';
          gyroCtx.lineWidth = 1.5;
          gyroCtx.beginPath();
          gyroHist.forEach((pt, idx) => {
            const x = (idx / 100) * w;
            const y = (h / 2) - (pt.gy * 1);
            if (idx === 0) gyroCtx.moveTo(x, y);
            else gyroCtx.lineTo(x, y);
          });
          gyroCtx.stroke();

          // GZ - Blue
          gyroCtx.strokeStyle = '#3b82f6';
          gyroCtx.lineWidth = 1.5;
          gyroCtx.beginPath();
          gyroHist.forEach((pt, idx) => {
            const x = (idx / 100) * w;
            const y = (h / 2) - (pt.gz * 1);
            if (idx === 0) gyroCtx.moveTo(x, y);
            else gyroCtx.lineTo(x, y);
          });
          gyroCtx.stroke();
        }
      } else {
        drawOfflineOverlay(gyroCtx, w, h, 'ESP32 NODE POWERED OFF / DISCONNECTED');
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [isNodeActive]);

  return (
    <div className="space-y-6 py-6 animate-fade-in">
      <div>
        <h2 className="font-display font-bold text-2xl tracking-wide text-gym-text">
          HARDWARE DIAGNOSTIC TELEMETRY
        </h2>
        <p className="text-xs text-gym-muted uppercase tracking-widest font-display mt-1">
          MCU Sensor Interfaces, Core Pings & Dynamic Signal Analysis
        </p>
      </div>

      {/* Connection & Status Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ESP32 Status */}
        <div className="glass-panel p-5 flex items-center justify-between transition-all duration-300 hover:border-gym-border/80">
          <div className="space-y-1.5">
            <span className="text-[10px] text-gym-muted font-display uppercase tracking-widest font-bold flex items-center gap-1.5">
              Processor Node
              {isNodeActive ? (
                <span className="inline-block w-2 h-2 rounded-full bg-gym-accent animate-ping" />
              ) : (
                <span className="inline-block w-2 h-2 rounded-full bg-gym-accentRed" />
              )}
            </span>
            <h4 className="text-base font-bold text-gym-text tracking-wide font-display">ESP32-WROOM-32</h4>
            <span className="text-[10px] text-gym-muted font-mono leading-none block">
              IP: {isNodeActive ? '192.168.4.1' : '0.0.0.0 (OFF)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-display font-bold transition-all duration-300 ${
              isNodeActive 
                ? 'border-gym-accent/30 text-gym-accent bg-gym-accent/5 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                : 'border-gym-accentRed/30 text-gym-accentRed bg-gym-accentRed/5'
            }`}>
              <Cpu className={`w-3.5 h-3.5 ${isNodeActive ? 'animate-pulse-slow' : ''}`} />
              {isNodeActive ? 'CONNECTED' : 'DISCONNECTED'}
            </div>

            {/* ON / OFF Power Button */}
            <button
              onClick={onToggleEspPower}
              type="button"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-display font-bold text-[11px] transition-all duration-300 shadow-md ${
                espPowered
                  ? 'border-gym-accent/50 bg-gym-accent/15 text-gym-accent hover:bg-gym-accent/25 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'border-slate-700 bg-slate-800/90 text-slate-400 hover:bg-gym-accentRed/20 hover:border-gym-accentRed/40 hover:text-gym-accentRed'
              }`}
              title={espPowered ? "Click to Power OFF ESP32 Node" : "Click to Power ON ESP32 Node"}
            >
              <Power className={`w-3.5 h-3.5 ${espPowered ? 'text-gym-accent animate-pulse-slow' : 'text-slate-400'}`} />
              <span>{espPowered ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* IMU Sensor Status */}
        <div className="glass-panel p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-gym-muted font-display uppercase tracking-widest font-bold">
              Inertial Measurement Unit
            </span>
            <h4 className="text-base font-bold text-gym-text tracking-wide font-display">MPU9052 (I2C)</h4>
            <span className="text-[10px] text-gym-muted font-mono leading-none block">Address: 0x68</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-display font-bold ${
            espConnected 
              ? 'border-gym-accent/30 text-gym-accent bg-gym-accent/5' 
              : 'border-gym-accentRed/30 text-gym-accentRed bg-gym-accentRed/5'
          }`}>
            <RefreshCw className={`w-3.5 h-3.5 ${espConnected ? 'animate-spin' : ''}`} />
            {espConnected ? 'STABLE' : 'OFFLINE'}
          </div>
        </div>

        {/* Load Cell Sensor Status */}
        <div className="glass-panel p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-gym-muted font-display uppercase tracking-widest font-bold">
              Strain Transducer
            </span>
            <h4 className="text-base font-bold text-gym-text tracking-wide font-display">HX711 Amplifier</h4>
            <span className="text-[10px] text-gym-muted font-mono leading-none block">SPS: 80 Samples/sec</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-display font-bold ${
            espConnected 
              ? 'border-gym-accent/30 text-gym-accent bg-gym-accent/5' 
              : 'border-gym-accentRed/30 text-gym-accentRed bg-gym-accentRed/5'
          }`}>
            <HardDrive className="w-3.5 h-3.5" />
            {espConnected ? 'CALIBRATED' : 'OFFLINE'}
          </div>
        </div>

      </div>

      {/* Raw Oscilloscope Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Accel Scope */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-gym-text uppercase">
                MPU9052 Accelerometer Waveform
              </h3>
              <p className="text-[10px] text-gym-muted uppercase font-display">Units: m/s² | Scale: 1x</p>
            </div>
            {/* Waveform legends */}
            <div className="flex gap-3 text-[9px] font-mono">
              <span className="text-red-400">X-axis (ax)</span>
              <span className="text-gym-accent">Y-axis (ay)</span>
              <span className="text-blue-400">Z-axis (az)</span>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-gym-border bg-gym-dark">
            <canvas ref={accCanvasRef} width="500" height="200" className="w-full h-auto block" />
          </div>
          <div className="flex justify-between text-[10px] text-gym-muted font-mono">
            <span>Live value: ax = {telemetryData?.ax != null ? telemetryData.ax.toFixed(2) : '0.00'}</span>
            <span>ay = {telemetryData?.ay != null ? telemetryData.ay.toFixed(2) : '0.00'}</span>
            <span>az = {telemetryData?.az != null ? telemetryData.az.toFixed(2) : '0.00'}</span>
          </div>
        </div>

        {/* Gyro Scope */}
        <div className="glass-panel p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-gym-text uppercase">
                MPU9052 Gyroscope Angular Rate
              </h3>
              <p className="text-[10px] text-gym-muted uppercase font-display">Units: deg/s | Scale: 1x</p>
            </div>
            {/* legends */}
            <div className="flex gap-3 text-[9px] font-mono">
              <span className="text-red-400">X-rate (gx)</span>
              <span className="text-gym-accent">Y-rate (gy)</span>
              <span className="text-blue-400">Z-rate (gz)</span>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden border border-gym-border bg-gym-dark">
            <canvas ref={gyroCanvasRef} width="500" height="200" className="w-full h-auto block" />
          </div>
          <div className="flex justify-between text-[10px] text-gym-muted font-mono">
            <span>Live value: gx = {telemetryData?.gx != null ? telemetryData.gx.toFixed(1) : '0.0'}</span>
            <span>gy = {telemetryData?.gy != null ? telemetryData.gy.toFixed(1) : '0.0'}</span>
            <span>gz = {telemetryData?.gz != null ? telemetryData.gz.toFixed(1) : '0.0'}</span>
          </div>
        </div>

      </div>

      {/* Extra Telemetry stats details */}
      <div className="glass-panel p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center font-display">
        <div>
          <div className="text-[10px] text-gym-muted uppercase font-bold">WIFI Link Signal</div>
          <div className="text-xl font-black text-gym-accent mt-2 flex items-center justify-center gap-1.5">
            <Wifi className="w-5 h-5 text-gym-accent" />
            {espConnected ? 'Excellent (-58 dBm)' : '--'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gym-muted uppercase font-bold">Data Package Rate</div>
          <div className="text-xl font-black text-gym-accentBlue mt-2">
            {espConnected ? '10.2 packets/sec' : '--'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gym-muted uppercase font-bold">Force Transducer load</div>
          <div className="text-xl font-black text-gym-accentYellow mt-2">
            {espConnected && telemetryData != null ? `${(telemetryData.load ?? 0).toFixed(1)} kg` : '--'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-gym-muted uppercase font-bold">Active Fusion Errors</div>
          <div className="text-xl font-black text-purple-400 mt-2">
            {espConnected ? '0 Detected' : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};
