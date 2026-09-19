// Auth Verification
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

// Helper: duration HH:MM:SS to seconds
function durationToSeconds(str) {
  const parts = str.split(':');
  if (parts.length !== 3) return 0;
  return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
}

// Helper: seconds to HH:MM:SS
function secondsToDuration(totalSecs) {
  const h = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSecs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

async function loadAnalytics() {
  try {
    const response = await fetch('/api/workouts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to load metrics data');

    const workouts = await response.json();

    // Aggregations
    let totalSecs = 0;
    let totalCals = 0;
    let totalVol = 0;
    let totalSets = 0;

    const exerciseMap = {};
    const dailyCalsMap = {};

    // Get last 7 calendar days labels
    const daysOfWeek = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isoDate = d.toISOString().split('T')[0];
      dailyCalsMap[isoDate] = 0;
      
      // Label formatted as "MM/DD" or "DD/MM"
      const parts = isoDate.split('-');
      daysOfWeek.push({
        iso: isoDate,
        label: `${parts[2]}/${parts[1]}`
      });
    }

    workouts.forEach((w) => {
      totalSecs += durationToSeconds(w.duration);
      totalCals += w.calories;
      totalVol += w.sets * w.reps * w.weight;
      totalSets += w.sets;

      // Group by exercise type
      exerciseMap[w.exercise] = (exerciseMap[w.exercise] || 0) + w.reps;

      // Group by date (only if within our 7-day range)
      if (dailyCalsMap[w.date] !== undefined) {
        dailyCalsMap[w.date] += w.calories;
      }
    });

    // Populate Overview metrics in UI
    document.getElementById('stat-total-duration').textContent = secondsToDuration(totalSecs);
    document.getElementById('stat-total-calories').textContent = Math.round(totalCals).toLocaleString();
    document.getElementById('stat-total-volume').textContent = Math.round(totalVol).toLocaleString();
    document.getElementById('stat-total-sets').textContent = totalSets;

    // Build Chart datasets
    const weeklyLabels = daysOfWeek.map(d => d.label);
    const weeklyData = daysOfWeek.map(d => dailyCalsMap[d.iso]);

    const exercises = Object.keys(exerciseMap);
    const exerciseData = Object.values(exerciseMap);

    renderWeeklyChart(weeklyLabels, weeklyData);
    renderExerciseChart(exercises, exerciseData);

  } catch (err) {
    console.error('Analytics load error:', err);
  }
}

// Chart.js renderers with premium colors & gradients
function renderWeeklyChart(labels, data) {
  const ctx = document.getElementById('weeklyProgressChart').getContext('2d');
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, '#7c3aed'); // Violet
  gradient.addColorStop(1, 'rgba(124, 58, 237, 0.05)');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Calories Burned (kcal)',
        data: data,
        backgroundColor: gradient,
        borderColor: '#7c3aed',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
        hoverBackgroundColor: '#a78bfa'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Outfit'
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.03)'
          },
          ticks: {
            color: '#94a3b8',
            font: {
              family: 'Outfit'
            }
          }
        }
      }
    }
  });
}

function renderExerciseChart(labels, data) {
  const ctx = document.getElementById('exerciseDistributionChart').getContext('2d');

  if (labels.length === 0) {
    // Show default placeholder if empty
    labels = ['No exercises logged'];
    data = [1];
  }

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#7c3aed', // Violet
          '#06b6d4', // Cyan
          '#10b981', // Emerald
          '#f43f5e', // Rose
          '#eab308'  // Amber
        ],
        borderWidth: 1,
        borderColor: '#0b0f19'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#94a3b8',
            font: {
              family: 'Outfit',
              size: 12
            },
            padding: 15,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1
        }
      },
      cutout: '70%'
    }
  });
}

loadAnalytics();
