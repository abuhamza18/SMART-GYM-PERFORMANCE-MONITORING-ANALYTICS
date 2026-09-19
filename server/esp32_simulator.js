const WebSocket = require('ws');

const SERVER_URL = 'ws://localhost:3000';
let ws;

function connect() {
  console.log(`Connecting simulator to ${SERVER_URL}...`);
  ws = new WebSocket(SERVER_URL);

  ws.on('open', () => {
    console.log('Connected to Smart Gym server!');
    
    // Simulate device connection
    ws.send(JSON.stringify({ type: 'device_connect' }));
    
    // Start simulating a workout session after 2 seconds
    setTimeout(simulateWorkout, 2000);
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'session_state') {
      const s = msg.data;
      console.log(`[Server State Update] Exercise: ${s.exercise} | Reps: ${s.reps} | Set: ${s.sets} | Weight: ${s.weight}kg | Time: ${s.workoutTime} | Calories: ${s.calories} kcal`);
    }
  });

  ws.on('close', () => {
    console.log('Connection closed. Retrying in 5 seconds...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('WebSocket Error:', err.message);
  });
}

function simulateWorkout() {
  console.log('Starting simulated workout: Bench Press @ 40kg');
  
  // Start the session
  ws.send(JSON.stringify({
    type: 'start_session',
    exercise: 'Bench Press',
    weight: 40.0
  }));

  let currentSet = 1;
  let repsInSet = 0;
  const maxSets = 3;
  const repsPerSet = 15;

  const workoutInterval = setInterval(() => {
    if (repsInSet < repsPerSet) {
      repsInSet++;
      console.log(`Simulating Rep ${repsInSet}/${repsPerSet} for Set ${currentSet}...`);
      ws.send(JSON.stringify({ type: 'rep_trigger' }));
    } else {
      if (currentSet < maxSets) {
        currentSet++;
        repsInSet = 0;
        console.log(`Simulating Set Trigger: Advancing to Set ${currentSet}...`);
        ws.send(JSON.stringify({ type: 'set_trigger' }));
      } else {
        // Workout complete!
        clearInterval(workoutInterval);
        console.log('Workout complete! Stopping session.');
        ws.send(JSON.stringify({ type: 'stop_session' }));
        
        // Disconnect device after 2 seconds
        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'device_disconnect' }));
          ws.close();
          console.log('Simulator shutdown completed.');
          process.exit(0);
        }, 2000);
      }
    }
  }, 2500); // Trigger a rep every 2.5 seconds
}

// Start the simulator
connect();
