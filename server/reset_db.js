const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dbPath = path.join(__dirname, 'gym.db');

// Delete existing database file to reset completely
if (fs.existsSync(dbPath)) {
  try {
    fs.unlinkSync(dbPath);
    console.log('Deleted existing gym.db file.');
  } catch (err) {
    console.error('Error deleting gym.db:', err);
  }
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Created fresh SQLite database.');
  initDb();
});

function initDb() {
  db.serialize(() => {
    // Create Users Table
    db.run(`
      CREATE TABLE users (
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
      CREATE TABLE workouts (
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

    // Insert athletes with password 'password123'
    const hash = '$2a$10$ka6ad.L0b95fCApSO3aN0.IZ5GcrAVsRIJgqeHP6LKuivj0bwB8.y';
    const athletes = [
      [1, 'Mohamed', hash, 'mohamed@example.com', 80.0, 600],
      [2, 'Sarah Chen', hash, 'sarah.chen@example.com', 62.5, 450],
      [3, 'Alex Rivera', hash, 'alex.rivera@example.com', 88.0, 750],
      [4, 'Emma Watson', hash, 'emma.w@example.com', 58.0, 500],
      [5, 'Marcus Vance', hash, 'marcus.vance@example.com', 94.0, 800]
    ];

    const userStmt = db.prepare("INSERT INTO users (id, username, password, email, weight_kg, target_calories) VALUES (?, ?, ?, ?, ?, ?)");
    athletes.forEach(a => userStmt.run(a));
    userStmt.finalize(() => {
      console.log('Seeded 5 roster athletes.');
      insertMockWorkouts();
    });
  });
}

function insertMockWorkouts() {
  const mockWorkouts = [
    // Mohamed (id 1)
    [1, 'Bench Press', 45, 3, 40.0, 125, '00:15:30', '2026-08-01', 94.5, 96.0, 'Excellent bar velocity. Watch shoulder rotation in set 3.'],
    [1, 'Squat', 60, 4, 60.0, 210, '00:20:00', '2026-08-02', 88.0, 90.0, 'Good depth, but heels lifted slightly in the last reps.'],
    [1, 'Deadlift', 30, 3, 80.0, 180, '00:12:45', '2026-08-03', 91.2, 92.5, 'Back position was stable. Keep chest up during initial pull.'],
    [1, 'Bicep Curl', 36, 3, 15.0, 90, '00:10:15', '2026-08-04', 96.0, 95.0, 'Perfect control. No elbow swing.'],
    [1, 'Overhead Press', 24, 2, 30.0, 110, '00:08:50', '2026-08-05', 85.4, 86.0, 'Core stability was good, but avoid hyper-extending lower back.'],

    // Sarah Chen (id 2)
    [2, 'Squat', 48, 4, 50.0, 160, '00:18:20', '2026-08-10', 82.0, 84.0, 'Knee valgus detected on bottom phase of set 3. Engage glute medius.'],
    [2, 'Bicep Curl', 40, 3, 10.0, 75, '00:11:00', '2026-08-11', 94.0, 95.0, 'Great isolation and consistent tempo.'],
    [2, 'Bench Press', 36, 3, 30.0, 95, '00:14:10', '2026-08-12', 89.0, 91.0, 'Solid bar path, maintain wrist alignment.'],
    [2, 'Deadlift', 24, 3, 60.0, 140, '00:13:30', '2026-08-13', 76.5, 78.0, 'Form warning: lumbar rounding on rep 6. Reduce load by 5kg.'],

    // Alex Rivera (id 3)
    [3, 'Deadlift', 35, 4, 110.0, 260, '00:22:15', '2026-08-08', 92.0, 94.0, 'Powerful hip hinge mechanics and strong grip.'],
    [3, 'Bench Press', 40, 3, 75.0, 150, '00:16:00', '2026-08-09', 78.0, 80.0, 'Form warning: bar tilted right during lockout. Equalize push.'],
    [3, 'Overhead Press', 28, 3, 45.0, 130, '00:12:00', '2026-08-11', 84.0, 85.5, 'Slight head obstruction on ascent. Push head through at top.'],
    [3, 'Squat', 50, 4, 90.0, 240, '00:21:00', '2026-08-13', 91.0, 93.0, 'Strong quad activation and consistent depth.'],

    // Emma Watson (id 4)
    [4, 'Bicep Curl', 45, 3, 12.0, 85, '00:12:30', '2026-08-07', 98.0, 99.0, 'Flawless rep execution and smooth eccentric control.'],
    [4, 'Squat', 40, 3, 45.0, 130, '00:15:00', '2026-08-09', 91.5, 92.0, 'Deep squat depth with vertical spine.'],
    [4, 'Overhead Press', 20, 2, 22.5, 75, '00:09:40', '2026-08-11', 79.0, 81.0, 'Form warning: elbow flaring out. Keep elbows tucked 45 deg.'],
    [4, 'Bench Press', 30, 3, 27.5, 88, '00:13:00', '2026-08-13', 95.0, 96.0, 'Great chest drive and steady breathing.'],

    // Marcus Vance (id 5)
    [5, 'Squat', 60, 5, 120.0, 320, '00:25:00', '2026-08-06', 95.5, 97.0, 'Elite squat power and immaculate brace.'],
    [5, 'Bench Press', 48, 4, 95.0, 210, '00:19:30', '2026-08-08', 93.0, 94.5, 'Strong leg drive and crisp lockout.'],
    [5, 'Deadlift', 20, 2, 140.0, 220, '00:11:10', '2026-08-10', 81.0, 82.0, 'Form warning: fast eccentric drop. Lower bar under control.'],
    [5, 'Bicep Curl', 36, 3, 20.0, 105, '00:10:45', '2026-08-12', 89.0, 90.0, 'Good volume. Minor torso sway on final set.']
  ];

  const stmt = db.prepare("INSERT INTO workouts (user_id, exercise, reps, sets, weight, calories, duration, date, form_score, performance_score, trainer_feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  mockWorkouts.forEach((w) => stmt.run(w));
  stmt.finalize((err) => {
    if (err) {
      console.error('Error seeding workouts:', err);
    } else {
      console.log('Seeded multi-athlete telemetry workout history.');
      db.close(() => {
        console.log('Database reset complete.');
        process.exit(0);
      });
    }
  });
}
