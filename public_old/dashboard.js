// Auth Enforcement
const token = localStorage.getItem('gym_token');
const username = localStorage.getItem('gym_username') || 'Guest';

if (!token) {
  window.location.href = '/login.html';
}

document.getElementById('username-display').textContent = username;

// Logout handler
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('gym_token');
  localStorage.removeItem('gym_username');
  window.location.href = '/login.html';
});

// WebSocket Telemetry Connection
let socket;
const wsScheme = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
const wsUrl = `${wsScheme}${window.location.host}`;
let activeSessionData = null;

function connectWebSocket() {
  console.log(`Connecting to telemetry server at ${wsUrl}`);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('Telemetry channel connected.');
  };

  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'session_state') {
      updateDashboard(message.data);
    }
  };

  socket.onclose = () => {
    console.warn('Telemetry channel disconnected. Retrying in 3 seconds...');
    setTimeout(connectWebSocket, 3000);
  };

  socket.onerror = (err) => {
    console.error('WebSocket Error:', err);
  };
}

// UI Telemetry Update
function updateDashboard(session) {
  const previousReps = activeSessionData ? activeSessionData.reps : 0;
  const previousSets = activeSessionData ? activeSessionData.sets : 0;
  
  activeSessionData = session;

  // Sync inputs if not focused
  if (document.activeElement !== document.getElementById('workout-exercise')) {
    document.getElementById('workout-exercise').value = session.exercise;
  }
  if (document.activeElement !== document.getElementById('workout-weight')) {
    document.getElementById('workout-weight').value = session.weight;
  }
  if (document.activeElement !== document.getElementById('sim-weight-input')) {
    document.getElementById('sim-weight-input').value = session.weight;
  }

  // Update text content
  updateMetricText('metric-reps', session.reps, previousReps !== session.reps);
  updateMetricText('metric-sets', session.sets, previousSets !== session.sets);
  updateMetricText('metric-weight', session.weight);
  updateMetricText('metric-calories', session.calories.toFixed(1));
  updateMetricText('metric-duration', session.workoutTime);

  // Update Connection Status Badge
  const statusBadge = document.getElementById('esp-status');
  if (session.deviceConnected) {
    statusBadge.textContent = '🟢 Connected';
    statusBadge.className = 'status-badge status-connected';
    
    // Enable simulator workout controls
    document.getElementById('sim-btn-power').textContent = 'Power OFF ESP32';
    document.getElementById('sim-btn-power').className = 'btn btn-danger btn-sm';
    document.getElementById('sim-btn-rep').disabled = false;
    document.getElementById('sim-btn-set').disabled = false;
    document.getElementById('sim-weight-input').disabled = false;
  } else {
    statusBadge.textContent = '🔴 Disconnected';
    statusBadge.className = 'status-badge status-disconnected';
    
    // Disable simulator workout controls
    document.getElementById('sim-btn-power').textContent = 'Power ON ESP32';
    document.getElementById('sim-btn-power').className = 'btn btn-outline btn-sm';
    document.getElementById('sim-btn-rep').disabled = true;
    document.getElementById('sim-btn-set').disabled = true;
    document.getElementById('sim-weight-input').disabled = true;
  }

  // Update console action button states
  if (session.isActive) {
    document.getElementById('btn-start').disabled = true;
    document.getElementById('btn-stop').disabled = false;
    document.getElementById('workout-exercise').disabled = true;
    document.getElementById('workout-weight').disabled = true;
    document.getElementById('btn-save-session').style.display = 'none';
  } else {
    document.getElementById('btn-start').disabled = false;
    document.getElementById('btn-stop').disabled = true;
    document.getElementById('workout-exercise').disabled = false;
    document.getElementById('workout-weight').disabled = false;
    
    // Show Save button if we have a valid elapsed session
    if (session.elapsedSeconds > 0) {
      document.getElementById('btn-save-session').style.display = 'block';
    } else {
      document.getElementById('btn-save-session').style.display = 'none';
    }
  }
}

// Micro-animation pulsing when increments happen
function updateMetricText(id, value, pulse = false) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
    if (pulse) {
      el.classList.add('pulse');
      setTimeout(() => el.classList.remove('pulse'), 150);
    }
  }
}

// Console Commands
document.getElementById('btn-start').addEventListener('click', () => {
  const exercise = document.getElementById('workout-exercise').value;
  const weight = parseFloat(document.getElementById('workout-weight').value) || 0;
  
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'start_session',
      exercise,
      weight
    }));
  }
});

document.getElementById('btn-stop').addEventListener('click', () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'stop_session' }));
  }
});

document.getElementById('btn-reset').addEventListener('click', () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'reset_session' }));
  }
});

// Sync inputs change back to socket
document.getElementById('workout-weight').addEventListener('change', (e) => {
  const weight = parseFloat(e.target.value) || 0;
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'weight_update', weight }));
  }
});

// Save session to HTTP database API
document.getElementById('btn-save-session').addEventListener('click', async () => {
  if (!activeSessionData) return;

  const alerts = document.getElementById('dashboard-alerts');
  alerts.innerHTML = '';

  const payload = {
    exercise: activeSessionData.exercise,
    reps: activeSessionData.reps,
    sets: activeSessionData.sets,
    weight: activeSessionData.weight,
    calories: activeSessionData.calories,
    duration: activeSessionData.workoutTime
  };

  try {
    const response = await fetch('/api/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to save workout session');
    }

    alerts.innerHTML = `<div class="alert alert-success">Workout session saved successfully!</div>`;
    
    // Reset session in UI/Server after saving
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'reset_session' }));
    }
    
    // Refresh history sidebar table
    loadRecentWorkouts();
  } catch (err) {
    alerts.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
  }
});

// Embedded Simulator Actions
document.getElementById('sim-btn-power').addEventListener('click', () => {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;

  const isConnected = activeSessionData ? activeSessionData.deviceConnected : false;
  if (isConnected) {
    socket.send(JSON.stringify({ type: 'device_disconnect' }));
  } else {
    socket.send(JSON.stringify({ type: 'device_connect' }));
  }
});

document.getElementById('sim-btn-rep').addEventListener('click', () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'rep_trigger' }));
  }
});

document.getElementById('sim-btn-set').addEventListener('click', () => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'set_trigger' }));
  }
});

document.getElementById('sim-weight-input').addEventListener('change', (e) => {
  const weight = parseFloat(e.target.value) || 0;
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'weight_update', weight }));
  }
});

// Fetch & Populate Recent Workouts List
async function loadRecentWorkouts() {
  const tableBody = document.getElementById('recent-workouts-table');
  
  try {
    const response = await fetch('/api/workouts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to load history');

    const workouts = await response.json();
    tableBody.innerHTML = '';

    if (workouts.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">No workouts recorded yet.</td></tr>`;
      return;
    }

    // Display top 8 recent workouts in sidebar
    workouts.slice(0, 8).forEach((w) => {
      // Reformat Date (YYYY-MM-DD -> DD/MM)
      const dateParts = w.date.split('-');
      const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : w.date;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${formattedDate}</td>
        <td><strong>${w.exercise}</strong></td>
        <td>${w.reps}</td>
        <td>${w.weight} kg</td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--danger-color);">Error loading recent sessions.</td></tr>`;
  }
}

// Initial Bootstrapping
connectWebSocket();
loadRecentWorkouts();
