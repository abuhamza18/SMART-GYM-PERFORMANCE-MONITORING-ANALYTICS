const path = require('path');
const fs   = require('fs');

// ─── Determine Database Path ──────────────────────────────────────────────────
// On Vercel (read-only filesystem) we must use /tmp.
const isVercel = !!(process.env.VERCEL || process.env.NOW_BUILDER);
let dbPath = isVercel ? '/tmp/gym.db' : path.join(__dirname, 'gym.db');

if (isVercel) {
  const bundledPath = path.join(__dirname, 'gym.db');
  try {
    if (!fs.existsSync(dbPath) && fs.existsSync(bundledPath)) {
      fs.copyFileSync(bundledPath, dbPath);
      console.log('[DB] Copied bundled gym.db → /tmp/gym.db');
    }
  } catch (copyErr) {
    console.warn('[DB] Could not copy bundled DB:', copyErr.message);
  }
}

// ─── In-Memory Fallback Database ──────────────────────────────────────────────
// Used if native sqlite3 bindings fail to load (e.g. on serverless environments).
// Guarantees that public registration, login, and queries ALWAYS succeed!
function makeFallbackStore(reason) {
  console.log(`[DB] Initializing in-memory resilient database store (${reason})`);
  
  const hash = '$2a$10$ka6ad.L0b95fCApSO3aN0.IZ5GcrAVsRIJgqeHP6LKuivj0bwB8.y'; // password123
  let nextUserId = 6;
  let nextWorkoutId = 22;

  const users = [
    { id: 1, username: 'Mohamed', password: hash, email: 'mohamed@example.com', weight_kg: 80.0, target_calories: 600 },
    { id: 2, username: 'Sarah Chen', password: hash, email: 'sarah.chen@example.com', weight_kg: 62.5, target_calories: 450 },
    { id: 3, username: 'Alex Rivera', password: hash, email: 'alex.rivera@example.com', weight_kg: 88.0, target_calories: 750 },
    { id: 4, username: 'Emma Watson', password: hash, email: 'emma.w@example.com', weight_kg: 58.0, target_calories: 500 },
    { id: 5, username: 'Marcus Vance', password: hash, email: 'marcus.vance@example.com', weight_kg: 94.0, target_calories: 800 },
  ];

  const workouts = [
    { id: 1, user_id: 1, exercise: 'Bench Press', reps: 45, sets: 3, weight: 40.0, calories: 125, duration: '00:15:30', date: '2026-08-01', form_score: 94.5, performance_score: 96.0, trainer_feedback: 'Excellent bar velocity. Watch shoulder rotation in set 3.' },
    { id: 2, user_id: 1, exercise: 'Squat', reps: 60, sets: 4, weight: 60.0, calories: 210, duration: '00:20:00', date: '2026-08-02', form_score: 88.0, performance_score: 90.0, trainer_feedback: 'Good depth, but heels lifted slightly in the last reps.' },
    { id: 3, user_id: 1, exercise: 'Deadlift', reps: 30, sets: 3, weight: 80.0, calories: 180, duration: '00:12:45', date: '2026-08-03', form_score: 91.2, performance_score: 92.5, trainer_feedback: 'Back position was stable. Keep chest up during initial pull.' },
    { id: 4, user_id: 1, exercise: 'Bicep Curl', reps: 36, sets: 3, weight: 15.0, calories: 90, duration: '00:10:15', date: '2026-08-04', form_score: 96.0, performance_score: 95.0, trainer_feedback: 'Perfect control. No elbow swing.' },
    { id: 5, user_id: 1, exercise: 'Overhead Press', reps: 24, sets: 2, weight: 30.0, calories: 110, duration: '00:08:50', date: '2026-08-05', form_score: 85.4, performance_score: 86.0, trainer_feedback: 'Core stability was good, but avoid hyper-extending lower back.' },
    { id: 6, user_id: 2, exercise: 'Squat', reps: 48, sets: 4, weight: 50.0, calories: 160, duration: '00:18:20', date: '2026-08-10', form_score: 82.0, performance_score: 84.0, trainer_feedback: 'Knee valgus detected on bottom phase of set 3. Engage glute medius.' },
    { id: 7, user_id: 2, exercise: 'Bicep Curl', reps: 40, sets: 3, weight: 10.0, calories: 75, duration: '00:11:00', date: '2026-08-11', form_score: 94.0, performance_score: 95.0, trainer_feedback: 'Great isolation and consistent tempo.' },
    { id: 8, user_id: 2, exercise: 'Bench Press', reps: 36, sets: 3, weight: 30.0, calories: 95, duration: '00:14:10', date: '2026-08-12', form_score: 89.0, performance_score: 91.0, trainer_feedback: 'Solid bar path, maintain wrist alignment.' },
    { id: 9, user_id: 2, exercise: 'Deadlift', reps: 24, sets: 3, weight: 60.0, calories: 140, duration: '00:13:30', date: '2026-08-13', form_score: 76.5, performance_score: 78.0, trainer_feedback: 'Form warning: lumbar rounding on rep 6. Reduce load by 5kg.' },
    { id: 10, user_id: 3, exercise: 'Deadlift', reps: 35, sets: 4, weight: 110.0, calories: 260, duration: '00:22:15', date: '2026-08-08', form_score: 92.0, performance_score: 94.0, trainer_feedback: 'Powerful hip hinge mechanics and strong grip.' },
    { id: 11, user_id: 3, exercise: 'Bench Press', reps: 40, sets: 3, weight: 75.0, calories: 150, duration: '00:16:00', date: '2026-08-09', form_score: 78.0, performance_score: 80.0, trainer_feedback: 'Form warning: bar tilted right during lockout. Equalize push.' },
    { id: 12, user_id: 3, exercise: 'Overhead Press', reps: 28, sets: 3, weight: 45.0, calories: 130, duration: '00:12:00', date: '2026-08-11', form_score: 84.0, performance_score: 85.5, trainer_feedback: 'Slight head obstruction on ascent. Push head through at top.' },
    { id: 13, user_id: 3, exercise: 'Squat', reps: 50, sets: 4, weight: 90.0, calories: 240, duration: '00:21:00', date: '2026-08-13', form_score: 91.0, performance_score: 93.0, trainer_feedback: 'Strong quad activation and consistent depth.' },
    { id: 14, user_id: 4, exercise: 'Bicep Curl', reps: 45, sets: 3, weight: 12.0, calories: 85, duration: '00:12:30', date: '2026-08-07', form_score: 98.0, performance_score: 99.0, trainer_feedback: 'Flawless rep execution and smooth eccentric control.' },
    { id: 15, user_id: 4, exercise: 'Squat', reps: 40, sets: 3, weight: 45.0, calories: 130, duration: '00:15:00', date: '2026-08-09', form_score: 91.5, performance_score: 92.0, trainer_feedback: 'Deep squat depth with vertical spine.' },
    { id: 16, user_id: 4, exercise: 'Overhead Press', reps: 20, sets: 2, weight: 22.5, calories: 75, duration: '00:09:40', date: '2026-08-11', form_score: 79.0, performance_score: 81.0, trainer_feedback: 'Form warning: elbow flaring out. Keep elbows tucked 45 deg.' },
    { id: 17, user_id: 4, exercise: 'Bench Press', reps: 30, sets: 3, weight: 27.5, calories: 88, duration: '00:13:00', date: '2026-08-13', form_score: 95.0, performance_score: 96.0, trainer_feedback: 'Great chest drive and steady breathing.' },
    { id: 18, user_id: 5, exercise: 'Squat', reps: 60, sets: 5, weight: 120.0, calories: 320, duration: '00:25:00', date: '2026-08-06', form_score: 95.5, performance_score: 97.0, trainer_feedback: 'Elite squat power and immaculate brace.' },
    { id: 19, user_id: 5, exercise: 'Bench Press', reps: 48, sets: 4, weight: 95.0, calories: 210, duration: '00:19:30', date: '2026-08-08', form_score: 93.0, performance_score: 94.5, trainer_feedback: 'Strong leg drive and crisp lockout.' },
    { id: 20, user_id: 5, exercise: 'Deadlift', reps: 20, sets: 2, weight: 140.0, calories: 220, duration: '00:11:10', date: '2026-08-10', form_score: 81.0, performance_score: 82.0, trainer_feedback: 'Form warning: fast eccentric drop. Lower bar under control.' },
    { id: 21, user_id: 5, exercise: 'Bicep Curl', reps: 36, sets: 3, weight: 20.0, calories: 105, duration: '00:10:45', date: '2026-08-12', form_score: 89.0, performance_score: 90.0, trainer_feedback: 'Good volume. Minor torso sway on final set.' }
  ];

  return {
    get(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      const p = Array.isArray(params) ? params : [params];
      const s = (sql || '').toLowerCase();

      // SELECT id FROM users WHERE LOWER(email) = ?
      if (s.includes('from users') && s.includes('email') && (s.includes('lower(email) = ?') || s.includes('email = ?'))) {
        const emailArg = (p[0] || '').toLowerCase();
        const user = users.find(u => (u.email || '').toLowerCase() === emailArg);
        return process.nextTick(() => cb(null, user ? { id: user.id, email: user.email, username: user.username } : undefined));
      }

      // SELECT id FROM users WHERE LOWER(username) = LOWER(?)
      if (s.includes('from users') && s.includes('username') && !s.includes('email')) {
        const nameArg = (p[0] || '').toLowerCase();
        const user = users.find(u => (u.username || '').toLowerCase() === nameArg);
        return process.nextTick(() => cb(null, user ? { id: user.id } : undefined));
      }

      // SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)
      if (s.includes('from users') && (s.includes('or lower') || s.includes('or username'))) {
        const ident1 = (p[0] || '').toLowerCase();
        const ident2 = (p[1] || p[0] || '').toLowerCase();
        const user = users.find(u =>
          (u.email || '').toLowerCase() === ident1 ||
          (u.username || '').toLowerCase() === ident1 ||
          (u.email || '').toLowerCase() === ident2 ||
          (u.username || '').toLowerCase() === ident2
        );
        return process.nextTick(() => cb(null, user ? { ...user } : undefined));
      }

      // SELECT COUNT(*) AS count FROM users
      if (s.includes('count(*)')) {
        return process.nextTick(() => cb(null, { count: users.length }));
      }

      // SELECT * FROM workouts WHERE id = ? AND user_id = ?
      if (s.includes('from workouts') && s.includes('user_id = ?')) {
        const wId = Number(p[0]);
        const uId = Number(p[1]);
        const item = workouts.find(w => w.id === wId && w.user_id === uId);
        return process.nextTick(() => cb(null, item ? { ...item } : undefined));
      }

      process.nextTick(() => cb(null, undefined));
    },

    all(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      const p = Array.isArray(params) ? params : [params];
      const s = (sql || '').toLowerCase();

      // SELECT * FROM workouts WHERE user_id = ? ORDER BY id DESC LIMIT 50
      if (s.includes('from workouts') && s.includes('user_id = ?')) {
        const uId = Number(p[0]);
        const list = workouts.filter(w => w.user_id === uId).sort((a, b) => b.id - a.id).slice(0, 50);
        return process.nextTick(() => cb(null, list.map(x => ({ ...x }))));
      }

      // SELECT id, username, email, weight_kg, target_calories FROM users ORDER BY id ASC
      if (s.includes('from users') && !s.includes('workouts')) {
        const list = users.map(u => ({ id: u.id, username: u.username, email: u.email, weight_kg: u.weight_kg, target_calories: u.target_calories }));
        return process.nextTick(() => cb(null, list));
      }

      // SELECT w.*, u.username, u.email FROM workouts w JOIN users u
      if (s.includes('workouts') && s.includes('join users')) {
        const list = workouts.map(w => {
          const u = users.find(x => x.id === w.user_id) || {};
          return { ...w, username: u.username || 'Athlete', email: u.email || '' };
        }).sort((a, b) => b.id - a.id).slice(0, 100);
        return process.nextTick(() => cb(null, list));
      }

      process.nextTick(() => cb(null, []));
    },

    run(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      const p = Array.isArray(params) ? params : [params];
      const s = (sql || '').toLowerCase();

      // INSERT INTO users
      if (s.includes('insert into users')) {
        const username = p[0];
        const password = p[1];
        const email = p[2];
        const weight_kg = p[3] || 75.0;
        const target_calories = p[4] || 500;

        // Check unique email and username
        if (users.some(u => (u.email || '').toLowerCase() === (email || '').toLowerCase())) {
          return process.nextTick(() => {
            if (typeof cb === 'function') cb(new Error('UNIQUE constraint failed: users.email'));
          });
        }
        if (users.some(u => (u.username || '').toLowerCase() === (username || '').toLowerCase())) {
          return process.nextTick(() => {
            if (typeof cb === 'function') cb(new Error('UNIQUE constraint failed: users.username'));
          });
        }

        const newUser = {
          id: nextUserId++,
          username,
          password,
          email,
          weight_kg,
          target_calories,
        };
        users.push(newUser);
        return process.nextTick(() => {
          if (typeof cb === 'function') {
            cb.call({ lastID: newUser.id, changes: 1 }, null);
          }
        });
      }

      // UPDATE users SET password = ? WHERE LOWER(email) = ?
      if (s.includes('update users set password = ?')) {
        const newPassword = p[0];
        const emailArg = (p[1] || '').toLowerCase();
        const user = users.find(u => (u.email || '').toLowerCase() === emailArg);
        if (user) {
          user.password = newPassword;
        }
        return process.nextTick(() => {
          if (typeof cb === 'function') {
            cb.call({ changes: user ? 1 : 0 }, null);
          }
        });
      }

      // INSERT INTO workouts
      if (s.includes('insert into workouts')) {
        const [user_id, exercise, reps, sets, weight, calories, duration, date, form_score, performance_score, trainer_feedback] = p;
        const newWorkout = {
          id: nextWorkoutId++,
          user_id: Number(user_id),
          exercise: exercise || 'Workout',
          reps: Number(reps || 0),
          sets: Number(sets || 1),
          weight: Number(weight || 0),
          calories: Number(calories || 0),
          duration: duration || '00:00:00',
          date: date || new Date().toISOString().split('T')[0],
          form_score: Number(form_score || 0),
          performance_score: Number(performance_score || 0),
          trainer_feedback: trainer_feedback || ''
        };
        workouts.push(newWorkout);
        return process.nextTick(() => {
          if (typeof cb === 'function') {
            cb.call({ lastID: newWorkout.id, changes: 1 }, null);
          }
        });
      }

      // DELETE FROM workouts WHERE id = ? AND user_id = ?
      if (s.includes('delete from workouts')) {
        const wId = Number(p[0]);
        const uId = Number(p[1]);
        const idx = workouts.findIndex(w => w.id === wId && w.user_id === uId);
        if (idx !== -1) workouts.splice(idx, 1);
        return process.nextTick(() => {
          if (typeof cb === 'function') {
            cb.call({ changes: idx !== -1 ? 1 : 0 }, null);
          }
        });
      }

      // UPDATE workouts SET trainer_feedback = ? WHERE id = ?
      if (s.includes('update workouts set trainer_feedback')) {
        const feedback = p[0];
        const wId = Number(p[1]);
        const w = workouts.find(x => x.id === wId);
        if (w) w.trainer_feedback = feedback;
        return process.nextTick(() => {
          if (typeof cb === 'function') {
            cb.call({ changes: w ? 1 : 0 }, null);
          }
        });
      }

      // Fallback for PRAGMA or schema creation
      process.nextTick(() => {
        if (typeof cb === 'function') {
          cb.call({ changes: 0 }, null);
        }
      });
    },

    prepare(sql) {
      return {
        run: (...args) => {
          const fn = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : () => {};
          fn(null);
        },
        finalize: (cb) => { if (cb) cb(); }
      };
    },

    serialize(fn) {
      if (fn) fn();
    },

    close(cb) {
      if (cb) cb(null);
    }
  };
}

// ─── Open / Create SQLite Database ───────────────────────────────────────────
let db;

try {
  const sqlite3 = require('sqlite3').verbose();

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('[DB] Error opening SQLite database:', err.message);
      db = makeFallbackStore(err.message);
    } else {
      console.log('[DB] Connected to SQLite at:', dbPath);
      initDb();
    }
  });
} catch (loadErr) {
  console.warn('[DB] sqlite3 native module not available; activating fallback store:', loadErr.message);
  db = makeFallbackStore('native sqlite3 unavailable');
}

// ─── Schema Initialisation ────────────────────────────────────────────────────
function initDb() {
  db.serialize(() => {
    // Enable WAL mode for better concurrent access
    db.run('PRAGMA journal_mode=WAL');

    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        username        TEXT    UNIQUE NOT NULL,
        password        TEXT    NOT NULL,
        email           TEXT    UNIQUE,
        weight_kg       REAL    DEFAULT 75.0,
        target_calories INTEGER DEFAULT 500
      )
    `, (err) => {
      if (err) console.error('[DB] Error creating users table:', err.message);
    });

    // Workouts table
    db.run(`
      CREATE TABLE IF NOT EXISTS workouts (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id           INTEGER NOT NULL,
        exercise          TEXT    NOT NULL,
        reps              INTEGER DEFAULT 0,
        sets              INTEGER DEFAULT 0,
        weight            REAL    DEFAULT 0.0,
        calories          REAL    DEFAULT 0.0,
        duration          TEXT    NOT NULL,
        date              TEXT    NOT NULL,
        form_score        REAL    DEFAULT 0.0,
        performance_score REAL    DEFAULT 0.0,
        trainer_feedback  TEXT    DEFAULT '',
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) console.error('[DB] Error creating workouts table:', err.message);
      else seedIfEmpty();
    });
  });
}

// ─── Demo Data Seeding ────────────────────────────────────────────────────────
function seedIfEmpty() {
  db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
    if (err) { console.warn('[DB] Seed check error:', err.message); return; }
    if (!row || row.count === 0) {
      console.log('[DB] Empty database detected — seeding demo roster…');
      seedRosterData();
    }
  });
}

function seedRosterData() {
  const hash = '$2a$10$ka6ad.L0b95fCApSO3aN0.IZ5GcrAVsRIJgqeHP6LKuivj0bwB8.y'; // password123

  const athletes = [
    ['Mohamed',      hash, 'mohamed@example.com',       80.0, 600],
    ['Sarah Chen',   hash, 'sarah.chen@example.com',    62.5, 450],
    ['Alex Rivera',  hash, 'alex.rivera@example.com',   88.0, 750],
    ['Emma Watson',  hash, 'emma.w@example.com',        58.0, 500],
    ['Marcus Vance', hash, 'marcus.vance@example.com',  94.0, 800],
  ];

  db.serialize(() => {
    athletes.forEach(([name, pw, email, weight, cals]) => {
      db.run(
        'INSERT OR IGNORE INTO users (username, password, email, weight_kg, target_calories) VALUES (?, ?, ?, ?, ?)',
        [name, pw, email, weight, cals],
        (err) => { if (err) console.warn('[DB] Seed user error:', err.message); }
      );
    });

    db.all('SELECT id, username FROM users', (err, users) => {
      if (err || !users) return;

      const userMap = {};
      users.forEach(u => { userMap[u.username] = u.id; });

      const workouts = [
        [userMap['Mohamed'], 'Bench Press',     45, 3,  40.0, 125, '00:15:30', '2026-08-01', 94.5, 96.0, 'Excellent bar velocity. Watch shoulder rotation in set 3.'],
        [userMap['Mohamed'], 'Squat',            60, 4,  60.0, 210, '00:20:00', '2026-08-02', 88.0, 90.0, 'Good depth, but heels lifted slightly in the last reps.'],
        [userMap['Mohamed'], 'Deadlift',         30, 3,  80.0, 180, '00:12:45', '2026-08-03', 91.2, 92.5, 'Back position was stable. Keep chest up during initial pull.'],
        [userMap['Mohamed'], 'Bicep Curl',       36, 3,  15.0,  90, '00:10:15', '2026-08-04', 96.0, 95.0, 'Perfect control. No elbow swing.'],
        [userMap['Mohamed'], 'Overhead Press',   24, 2,  30.0, 110, '00:08:50', '2026-08-05', 85.4, 86.0, 'Core stability was good, but avoid hyper-extending lower back.'],
        [userMap['Sarah Chen'], 'Squat',         48, 4,  50.0, 160, '00:18:20', '2026-08-10', 82.0, 84.0, 'Knee valgus detected on bottom phase of set 3. Engage glute medius.'],
        [userMap['Sarah Chen'], 'Bicep Curl',    40, 3,  10.0,  75, '00:11:00', '2026-08-11', 94.0, 95.0, 'Great isolation and consistent tempo.'],
        [userMap['Sarah Chen'], 'Bench Press',   36, 3,  30.0,  95, '00:14:10', '2026-08-12', 89.0, 91.0, 'Solid bar path, maintain wrist alignment.'],
        [userMap['Sarah Chen'], 'Deadlift',      24, 3,  60.0, 140, '00:13:30', '2026-08-13', 76.5, 78.0, 'Form warning: lumbar rounding on rep 6. Reduce load by 5kg.'],
        [userMap['Alex Rivera'], 'Deadlift',     35, 4, 110.0, 260, '00:22:15', '2026-08-08', 92.0, 94.0, 'Powerful hip hinge mechanics and strong grip.'],
        [userMap['Alex Rivera'], 'Bench Press',  40, 3,  75.0, 150, '00:16:00', '2026-08-09', 78.0, 80.0, 'Form warning: bar tilted right during lockout. Equalize push.'],
        [userMap['Alex Rivera'], 'Overhead Press',28,3,  45.0, 130, '00:12:00', '2026-08-11', 84.0, 85.5, 'Slight head obstruction on ascent. Push head through at top.'],
        [userMap['Alex Rivera'], 'Squat',        50, 4,  90.0, 240, '00:21:00', '2026-08-13', 91.0, 93.0, 'Strong quad activation and consistent depth.'],
        [userMap['Emma Watson'], 'Bicep Curl',   45, 3,  12.0,  85, '00:12:30', '2026-08-07', 98.0, 99.0, 'Flawless rep execution and smooth eccentric control.'],
        [userMap['Emma Watson'], 'Squat',        40, 3,  45.0, 130, '00:15:00', '2026-08-09', 91.5, 92.0, 'Deep squat depth with vertical spine.'],
        [userMap['Emma Watson'], 'Overhead Press',20,2,  22.5,  75, '00:09:40', '2026-08-11', 79.0, 81.0, 'Form warning: elbow flaring out. Keep elbows tucked 45 deg.'],
        [userMap['Emma Watson'], 'Bench Press',  30, 3,  27.5,  88, '00:13:00', '2026-08-13', 95.0, 96.0, 'Great chest drive and steady breathing.'],
        [userMap['Marcus Vance'], 'Squat',       60, 5, 120.0, 320, '00:25:00', '2026-08-06', 95.5, 97.0, 'Elite squat power and immaculate brace.'],
        [userMap['Marcus Vance'], 'Bench Press', 48, 4,  95.0, 210, '00:19:30', '2026-08-08', 93.0, 94.5, 'Strong leg drive and crisp lockout.'],
        [userMap['Marcus Vance'], 'Deadlift',    20, 2, 140.0, 220, '00:11:10', '2026-08-10', 81.0, 82.0, 'Form warning: fast eccentric drop. Lower bar under control.'],
        [userMap['Marcus Vance'], 'Bicep Curl',  36, 3,  20.0, 105, '00:10:45', '2026-08-12', 89.0, 90.0, 'Good volume. Minor torso sway on final set.'],
      ];

      const stmt = db.prepare(
        'INSERT INTO workouts (user_id, exercise, reps, sets, weight, calories, duration, date, form_score, performance_score, trainer_feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );
      workouts.forEach(w => { if (w[0]) stmt.run(w); });
      stmt.finalize(() => {
        console.log('[DB] Seeded multi-athlete roster & telemetry logs.');
      });
    });
  });
}

module.exports = db;
