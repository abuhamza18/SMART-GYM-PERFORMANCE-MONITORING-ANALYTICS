const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Mount API routes
app.use('/api', routes);

// Serve the index.html for dashboard/login redirection
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Active Session State
let activeSession = {
  exercise: 'Bench Press',
  reps: 0,
  sets: 0,
  weight: 40.0,
  calories: 0.0,
  workoutTime: '00:00:00',
  isActive: false,
  elapsedSeconds: 0,
  deviceConnected: false
};

// Simulated Telemetry State
let currentFormScore = 100;
let currentFormFeedback = "SYSTEM READY";
let repProgress = 0;
let telemetryInterval = null;

// Expose active session data via HTTP polling endpoint
app.get('/data', (req, res) => {
  res.json(activeSession);
});

let timerInterval = null;

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function calculateCalories(seconds, reps, weight) {
  // Base burn rate: ~0.08 kcal/sec (active workout)
  // Rep burn: weight * 0.04 kcal per rep
  const baseBurn = seconds * 0.08;
  const repBurn = reps * weight * 0.035;
  return parseFloat((baseBurn + repBurn).toFixed(1));
}

function broadcastState() {
  const payload = {
    type: 'session_state',
    data: activeSession
  };
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
}

function broadcastPayload(payload) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  });
}

function startTelemetrySim() {
  if (telemetryInterval) return;
  console.log("Starting high-frequency simulated sensor telemetry (10Hz)...");
  repProgress = 0;
  telemetryInterval = setInterval(() => {
    let ax = 0.0, ay = 9.8, az = 0.0;
    let gx = 0.0, gy = 0.0, gz = 0.0;
    let load = 0.0;

    const noise = (amplitude) => (Math.random() - 0.5) * amplitude;

    if (activeSession.deviceConnected) {
      if (activeSession.isActive) {
        repProgress++;
        const progressRatio = repProgress / 25; // 2.5 second rep cycle

        // Accelerometer sine wave oscillations (m/s^2)
        ax = noise(0.4);
        ay = 9.8 + 1.5 * Math.sin(2 * Math.PI * progressRatio) + noise(0.3);
        az = 0.5 * Math.cos(2 * Math.PI * progressRatio) + noise(0.3);

        // Gyroscope oscillations (deg/s)
        gx = 20.0 * Math.sin(2 * Math.PI * progressRatio) + noise(2);
        gy = noise(3);
        gz = noise(3);

        // Load Cell dynamic forces (kg)
        load = activeSession.weight + 4.0 * Math.sin(2 * Math.PI * progressRatio) + noise(0.6);

        if (repProgress >= 25) {
          // Rep completed!
          repProgress = 0;
          activeSession.reps++;
          activeSession.calories = calculateCalories(activeSession.elapsedSeconds, activeSession.reps, activeSession.weight);
          
          // Form quality evaluation
          const roll = Math.random();
          if (roll < 0.15) {
            currentFormScore = Math.floor(70 + Math.random() * 12); // 70-82%
            currentFormFeedback = Math.random() > 0.5 ? "MOVEMENT TOO FAST" : "CORRECT YOUR POSTURE";
          } else {
            currentFormScore = Math.floor(88 + Math.random() * 12); // 88-100%
            currentFormFeedback = "GOOD FORM";
          }
          
          // Notify rep complete and push state update
          broadcastPayload({
            type: 'rep_event',
            data: {
              reps: activeSession.reps,
              score: currentFormScore,
              feedback: currentFormFeedback
            }
          });
          broadcastState();
        }
      } else {
        // Connected but idle
        ax = noise(0.2);
        ay = 9.8 + noise(0.1);
        az = noise(0.2);
        gx = noise(0.5);
        gy = noise(0.5);
        gz = noise(0.5);
        load = 0.0 + Math.max(0, noise(0.1));
        currentFormFeedback = "SYSTEM READY / RESTING";
        currentFormScore = 100;
        repProgress = 0;
      }

      // Broadcast telemetry data packet
      broadcastPayload({
        type: 'telemetry',
        data: {
          ax: parseFloat(ax.toFixed(3)),
          ay: parseFloat(ay.toFixed(3)),
          az: parseFloat(az.toFixed(3)),
          gx: parseFloat(gx.toFixed(2)),
          gy: parseFloat(gy.toFixed(2)),
          gz: parseFloat(gz.toFixed(2)),
          load: parseFloat(Math.max(0, load).toFixed(2)),
          formScore: currentFormScore,
          formFeedback: currentFormFeedback,
          timestamp: Date.now()
        }
      });
    }
  }, 100); // 10Hz
}

function stopTelemetrySim() {
  if (telemetryInterval) {
    clearInterval(telemetryInterval);
    telemetryInterval = null;
    console.log("Stopped simulated sensor telemetry.");
  }
}

function startTimer() {
  if (timerInterval) return;
  activeSession.isActive = true;
  timerInterval = setInterval(() => {
    activeSession.elapsedSeconds++;
    activeSession.workoutTime = formatDuration(activeSession.elapsedSeconds);
    activeSession.calories = calculateCalories(activeSession.elapsedSeconds, activeSession.reps, activeSession.weight);
    broadcastState();
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  activeSession.isActive = false;
}

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket.');
  
  // Immediately send current session state to new client
  ws.send(JSON.stringify({
    type: 'session_state',
    data: activeSession
  }));

  ws.on('message', (message) => {
    try {
      const msg = JSON.parse(message);
      console.log('Received WebSocket message:', msg);

      switch (msg.type) {
        case 'device_connect':
          activeSession.deviceConnected = true;
          startTelemetrySim();
          broadcastState();
          break;

        case 'device_disconnect':
          activeSession.deviceConnected = false;
          stopTelemetrySim();
          broadcastState();
          break;

        case 'start_session':
          activeSession.exercise = msg.exercise || activeSession.exercise;
          activeSession.weight = parseFloat(msg.weight) || activeSession.weight;
          activeSession.reps = 0;
          activeSession.sets = 1;
          activeSession.elapsedSeconds = 0;
          activeSession.workoutTime = '00:00:00';
          activeSession.calories = 0.0;
          // Automatically flag device as connected during demo starts
          activeSession.deviceConnected = true;
          startTelemetrySim();
          startTimer();
          broadcastState();
          break;

        case 'stop_session':
          stopTimer();
          broadcastState();
          break;

        case 'rep_trigger':
          if (activeSession.isActive) {
            activeSession.reps++;
            activeSession.calories = calculateCalories(activeSession.elapsedSeconds, activeSession.reps, activeSession.weight);
            broadcastState();
          }
          break;

        case 'set_trigger':
          if (activeSession.isActive) {
            activeSession.sets++;
            activeSession.reps = 0;
            broadcastState();
          }
          break;

        case 'weight_update':
          activeSession.weight = parseFloat(msg.weight) || activeSession.weight;
          broadcastState();
          break;

        case 'reset_session':
          stopTimer();
          activeSession.reps = 0;
          activeSession.sets = 0;
          activeSession.elapsedSeconds = 0;
          activeSession.workoutTime = '00:00:00';
          activeSession.calories = 0.0;
          broadcastState();
          break;

        default:
          console.warn('Unknown message type:', msg.type);
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket.');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Smart Gym server running on http://localhost:${PORT}`);
});
