import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { LiveWorkout } from './pages/LiveWorkout';
import { ExerciseDetection } from './pages/ExerciseDetection';
import { Analytics } from './pages/Analytics';
import { WorkoutHistory } from './pages/WorkoutHistory';
import { SensorMonitoring } from './pages/SensorMonitoring';
import { TrainerDashboard } from './pages/TrainerDashboard';
import { ProfileSettings } from './pages/ProfileSettings';
import { CoachComments } from './pages/CoachComments';
import { Login } from './pages/Login';

// Workout detection module imports
import { SensorDataService } from './workout-detection/sensorDataService';
import { DemoSensorGenerator } from './workout-detection/demoSensorGenerator';
import { WorkoutDetectionEngine } from './workout-detection/workoutDetectionEngine';
import type { EngineState } from './workout-detection/workoutDetectionEngine';

interface SessionState {
  exercise: string;
  reps: number;
  sets: number;
  weight: number;
  calories: number;
  workoutTime: string;
  isActive: boolean;
  deviceConnected: boolean;
}

interface TelemetryData {
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
}

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('gym_token'));
  const [username, setUsername] = useState<string>(localStorage.getItem('gym_user') || '');

  // Telemetry states
  const [espConnected, setEspConnected] = useState(false);
  const [espPowered, setEspPowered] = useState(true); // Interactive power state for ESP32-WROOM-32
  const [demoMode, setDemoMode] = useState(true); // Default demo mode to true to make the demo work instantly
  const [telemetryData, setTelemetryData] = useState<TelemetryData | null>(null);
  
  const effectiveEspConnected = espPowered && (espConnected || demoMode);

  const handleToggleEspPower = () => {
    setEspPowered(prev => {
      const nextState = !prev;
      if (!nextState) {
        demoGeneratorRef.current.stop();
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'device_disconnect' }));
        }
      } else {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && demoMode) {
          wsRef.current.send(JSON.stringify({ type: 'device_connect' }));
        }
      }
      return nextState;
    });
  };
  
  const [activeSession, setActiveSession] = useState<SessionState>({
    exercise: 'Bench Press',
    reps: 0,
    sets: 0,
    weight: 40.0,
    calories: 0.0,
    workoutTime: '00:00:00',
    isActive: false,
    deviceConnected: false
  });

  // Detection Engine state
  const [detectionState, setDetectionState] = useState<EngineState>(
    WorkoutDetectionEngine.getInstance().getEngineState()
  );

  const wsRef = useRef<WebSocket | null>(null);
  const demoGeneratorRef = useRef<DemoSensorGenerator>(new DemoSensorGenerator());

  // Handle Authentication
  const handleLoginSuccess = (newToken: string, newUsername: string) => {
    localStorage.setItem('gym_token', newToken);
    localStorage.setItem('gym_user', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    setToken(null);
    setUsername('');
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  // Sync WebSocket Telemetry into Client-Side Detection Engine
  useEffect(() => {
    if (!token) return;

    const connectWS = () => {
      const loc = window.location;
      const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = import.meta.env.MODE === 'production' 
        ? `${protocol}//${loc.host}/ws` 
        : `ws://localhost:3000`; // direct connect in dev
      
      console.log(`Connecting WebSocket to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected to Smart Gym server!');
        setEspConnected(true);
        if (demoMode) {
          ws.send(JSON.stringify({ type: 'device_connect' }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'session_state') {
            setActiveSession(msg.data);
            setEspConnected(msg.data.deviceConnected);
          } else if (msg.type === 'telemetry') {
            // Feed raw websocket telemetry directly into our client-side detection service
            SensorDataService.getInstance().publish({
              ax: msg.data.ax,
              ay: msg.data.ay,
              az: msg.data.az,
              gx: msg.data.gx,
              gy: msg.data.gy,
              gz: msg.data.gz,
              load: msg.data.load,
              timestamp: msg.data.timestamp || Date.now()
            });
          }
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection lost. Reconnecting in 3s...');
        setEspConnected(false);
        setTimeout(connectWS, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, demoMode]);

  // Sync Client-Side Sensor Telemetry to Oscilloscope and local telemetryData state
  useEffect(() => {
    const unsubscribeSensor = SensorDataService.getInstance().subscribe(data => {
      const engine = WorkoutDetectionEngine.getInstance();
      const state = engine.getEngineState();
      setTelemetryData({
        ax: data.ax,
        ay: data.ay,
        az: data.az,
        gx: data.gx,
        gy: data.gy,
        gz: data.gz,
        load: data.load,
        formScore: state.formScore,
        formFeedback: state.comment,
        timestamp: data.timestamp
      });
    });

    return () => {
      unsubscribeSensor();
    };
  }, []);

  // Sync Workout Detection state
  useEffect(() => {
    const unsubscribeEngine = WorkoutDetectionEngine.getInstance().subscribe(state => {
      setDetectionState(state);
      // Sync reps/sets back to ActiveSession so normal displays don't break
      setActiveSession(prev => ({
        ...prev,
        reps: state.reps,
        sets: state.sets,
        exercise: state.exercise,
        weight: state.weight,
        isActive: state.isActive
      }));
    });

    return () => {
      unsubscribeEngine();
    };
  }, []);

  // Handle local simulation duration timer when WebSocket is offline
  useEffect(() => {
    let timer: any = null;
    if (!espConnected && activeSession.isActive) {
      let seconds = 0;
      timer = setInterval(() => {
        seconds++;
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        setActiveSession(prev => ({
          ...prev,
          workoutTime: `${h}:${m}:${s}`
        }));
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [espConnected, activeSession.isActive]);

  // Sync Demo Mode toggle
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const action = demoMode ? 'device_connect' : 'device_disconnect';
      wsRef.current.send(JSON.stringify({ type: action }));
    }
    
    // Stop local simulator if demoMode is turned off
    if (!demoMode) {
      demoGeneratorRef.current.stop();
    }
  }, [demoMode]);

  const wsSend = (payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };

  const triggerSimStart = (exercise: string, weight: number) => {
    // Start backend session if WS active
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsSend({
        type: 'start_session',
        exercise,
        weight
      });
    } else {
      // Offline fallback state update
      setActiveSession(prev => ({
        ...prev,
        isActive: true,
        exercise,
        weight,
        reps: 0,
        sets: 1,
        workoutTime: '00:00:00',
        calories: 0.0
      }));
    }

    // Start client-side detection engine
    WorkoutDetectionEngine.getInstance().startSession(exercise, weight);

    // If demoMode is enabled, spin up the local physics simulator
    if (demoMode) {
      demoGeneratorRef.current.start(exercise, weight);
    }
  };

  const triggerSimStop = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsSend({ type: 'stop_session' });
    } else {
      setActiveSession(prev => ({ ...prev, isActive: false }));
    }

    // Stop local simulator
    demoGeneratorRef.current.stop();
  };

  const triggerSimReset = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsSend({ type: 'reset_session' });
    } else {
      setActiveSession(prev => ({
        ...prev,
        isActive: false,
        reps: 0,
        sets: 0,
        workoutTime: '00:00:00',
        calories: 0.0
      }));
    }

    // Stop and reset engine
    demoGeneratorRef.current.stop();
    WorkoutDetectionEngine.getInstance().resetSession();
    setTelemetryData(null);
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Router>
      <div className="flex bg-gym-dark min-h-screen">
        <Sidebar espConnected={effectiveEspConnected} />
        
        <div className="flex-1 flex flex-col min-h-screen">
          <Header 
            username={username} 
            espConnected={effectiveEspConnected} 
            demoMode={demoMode} 
            setDemoMode={setDemoMode} 
            onLogout={handleLogout}
          />
          
          <main className="flex-1 px-8 py-6 overflow-y-auto">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route 
                path="/dashboard" 
                element={
                  <Dashboard 
                    activeSession={activeSession} 
                    triggerSimStart={triggerSimStart} 
                    detectionState={detectionState}
                  />
                } 
              />
              <Route 
                path="/live" 
                element={
                  <LiveWorkout 
                    activeSession={activeSession} 
                    telemetryData={telemetryData} 
                    wsSend={wsSend} 
                    triggerSimStart={triggerSimStart}
                    triggerSimStop={triggerSimStop}
                    triggerSimReset={triggerSimReset}
                    detectionState={detectionState}
                    demoMode={demoMode}
                    setDemoMode={setDemoMode}
                  />
                } 
              />
              <Route 
                path="/coach-comments" 
                element={<CoachComments detectionState={detectionState} />} 
              />
              <Route path="/exercises" element={<ExerciseDetection />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/history" element={<WorkoutHistory />} />
              <Route 
                path="/sensors" 
                element={
                  <SensorMonitoring 
                    espConnected={effectiveEspConnected} 
                    telemetryData={telemetryData} 
                    espPowered={espPowered}
                    onToggleEspPower={handleToggleEspPower}
                  />
                } 
              />
              <Route path="/trainer" element={<TrainerDashboard />} />
              <Route path="/profile" element={<ProfileSettings />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};
