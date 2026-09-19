const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let dbPath = path.join(__dirname, 'gym.db');

// Handle Vercel serverless read-only filesystem by using /tmp/gym.db
if (process.env.VERCEL || process.env.NOW_BUILDER) {
  const tmpPath = path.join('/tmp', 'gym.db');
  try {
    if (!fs.existsSync(tmpPath) && fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, tmpPath);
    }
    dbPath = tmpPath;
  } catch (e) {
    console.warn('Vercel copy db warning, using /tmp/gym.db:', e);
    dbPath = tmpPath;
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // Create Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT,
        weight_kg REAL DEFAULT 75.0,
        target_calories INTEGER DEFAULT 500
      )
    `);

    // Create Workouts Table
    db.run(`
      CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        exercise TEXT NOT NULL,
        reps INTEGER DEFAULT 0,
        sets INTEGER DEFAULT 0,
        weight REAL DEFAULT 0.0,
        calories REAL DEFAULT 0.0,
        duration TEXT NOT NULL,
        date TEXT NOT NULL,
        form_score REAL DEFAULT 0.0,
        performance_score REAL DEFAULT 0.0,
        trainer_feedback TEXT DEFAULT '',
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Seed default athletes and workout history for Trainer Supervision Portal
    db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (!row || row.count <= 1) {
        seedRosterData();
      }
    });
  });
}

function seedRosterData() {
  const hash = '$2a$10$ka6ad.L0b95fCApSO3aN0.IZ5GcrAVsRIJgqeHP6LKuivj0bwB8.y'; // 'password123'
  const athletes = [
    ['Mohamed', hash, 'mohamed@example.com', 80.0, 600],
    ['Sarah Chen', hash, 'sarah.chen@example.com', 62.5, 450],
    ['Alex Rivera', hash, 'alex.rivera@example.com', 88.0, 750],
    ['Emma Watson', hash, 'emma.w@example.com', 58.0, 500],
    ['Marcus Vance', hash, 'marcus.vance@example.com', 94.0, 800]
  ];

  athletes.forEach(([name, pword, email, weight, cals]) => {
    db.run(
      "INSERT OR IGNORE INTO users (username, password, email, weight_kg, target_calories) VALUES (?, ?, ?, ?, ?)",
      [name, pword, email, weight, cals]
    );
  });

  // Fetch all user IDs and insert rich workout histories
  db.all("SELECT id, username FROM users", (err, users) => {
    if (err || !users) return;

    const userMap = {};
    users.forEach(u => { userMap[u.username] = u.id; });

    const workouts = [
      // Mohamed
      [userMap['Mohamed'], 'Bench Press', 45, 3, 40.0, 125, '00:15:30', '2026-08-01', 94.5, 96.0, 'Excellent bar velocity. Watch shoulder rotation in set 3.'],
      [userMap['Mohamed'], 'Squat', 60, 4, 60.0, 210, '00:20:00', '2026-08-02', 88.0, 90.0, 'Good depth, but heels lifted slightly in the last reps.'],
      [userMap['Mohamed'], 'Deadlift', 30, 3, 80.0, 180, '00:12:45', '2026-08-03', 91.2, 92.5, 'Back position was stable. Keep chest up during initial pull.'],
      [userMap['Mohamed'], 'Bicep Curl', 36, 3, 15.0, 90, '00:10:15', '2026-08-04', 96.0, 95.0, 'Perfect control. No elbow swing.'],
      [userMap['Mohamed'], 'Overhead Press', 24, 2, 30.0, 110, '00:08:50', '2026-08-05', 85.4, 86.0, 'Core stability was good, but avoid hyper-extending lower back.'],

      // Sarah Chen
      [userMap['Sarah Chen'], 'Squat', 48, 4, 50.0, 160, '00:18:20', '2026-08-10', 82.0, 84.0, 'Knee valgus detected on bottom phase of set 3. Engage glute medius.'],
      [userMap['Sarah Chen'], 'Bicep Curl', 40, 3, 10.0, 75, '00:11:00', '2026-08-11', 94.0, 95.0, 'Great isolation and consistent tempo.'],
      [userMap['Sarah Chen'], 'Bench Press', 36, 3, 30.0, 95, '00:14:10', '2026-08-12', 89.0, 91.0, 'Solid bar path, maintain wrist alignment.'],
      [userMap['Sarah Chen'], 'Deadlift', 24, 3, 60.0, 140, '00:13:30', '2026-08-13', 76.5, 78.0, 'Form warning: lumbar rounding on rep 6. Reduce load by 5kg.'],

      // Alex Rivera
      [userMap['Alex Rivera'], 'Deadlift', 35, 4, 110.0, 260, '00:22:15', '2026-08-08', 92.0, 94.0, 'Powerful hip hinge mechanics and strong grip.'],
      [userMap['Alex Rivera'], 'Bench Press', 40, 3, 75.0, 150, '00:16:00', '2026-08-09', 78.0, 80.0, 'Form warning: bar tilted right during lockout. Equalize push.'],
      [userMap['Alex Rivera'], 'Overhead Press', 28, 3, 45.0, 130, '00:12:00', '2026-08-11', 84.0, 85.5, 'Slight head obstruction on ascent. Push head through at top.'],
      [userMap['Alex Rivera'], 'Squat', 50, 4, 90.0, 240, '00:21:00', '2026-08-13', 91.0, 93.0, 'Strong quad activation and consistent depth.'],

      // Emma Watson
      [userMap['Emma Watson'], 'Bicep Curl', 45, 3, 12.0, 85, '00:12:30', '2026-08-07', 98.0, 99.0, 'Flawless rep execution and smooth eccentric control.'],
      [userMap['Emma Watson'], 'Squat', 40, 3, 45.0, 130, '00:15:00', '2026-08-09', 91.5, 92.0, 'Deep squat depth with vertical spine.'],
      [userMap['Emma Watson'], 'Overhead Press', 20, 2, 22.5, 75, '00:09:40', '2026-08-11', 79.0, 81.0, 'Form warning: elbow flaring out. Keep elbows tucked 45 deg.'],
      [userMap['Emma Watson'], 'Bench Press', 30, 3, 27.5, 88, '00:13:00', '2026-08-13', 95.0, 96.0, 'Great chest drive and steady breathing.'],

      // Marcus Vance
      [userMap['Marcus Vance'], 'Squat', 60, 5, 120.0, 320, '00:25:00', '2026-08-06', 95.5, 97.0, 'Elite squat power and immaculate brace.'],
      [userMap['Marcus Vance'], 'Bench Press', 48, 4, 95.0, 210, '00:19:30', '2026-08-08', 93.0, 94.5, 'Strong leg drive and crisp lockout.'],
      [userMap['Marcus Vance'], 'Deadlift', 20, 2, 140.0, 220, '00:11:10', '2026-08-10', 81.0, 82.0, 'Form warning: fast eccentric drop. Lower bar under control.'],
      [userMap['Marcus Vance'], 'Bicep Curl', 36, 3, 20.0, 105, '00:10:45', '2026-08-12', 89.0, 90.0, 'Good volume. Minor torso sway on final set.']
    ];

    const stmt = db.prepare("INSERT INTO workouts (user_id, exercise, reps, sets, weight, calories, duration, date, form_score, performance_score, trainer_feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    workouts.forEach(w => {
      if (w[0]) stmt.run(w);
    });
    stmt.finalize();
    console.log('Seeded multi-athlete roster & telemetry logs.');
  });
}

module.exports = db;
