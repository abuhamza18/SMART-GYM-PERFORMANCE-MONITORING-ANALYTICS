const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('./database');

const router = express.Router();

// ─── JWT Secret ───────────────────────────────────────────────────────────────
// Set JWT_SECRET as a Vercel environment variable in production.
// Never commit a real secret — the fallback below is only for local dev.
const JWT_SECRET = process.env.JWT_SECRET || 'smart-gym-local-dev-secret-change-in-production';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function dbError(res, err) {
  const msg = (err && err.message) || '';
  if (msg.includes('unavailable') || msg.includes('sqlite3')) {
    return res.status(503).json({ error: 'Database is temporarily unavailable. Please try again shortly.' });
  }
  console.error('[routes] DB error:', msg);
  return res.status(500).json({ error: 'An unexpected server error occurred. Please try again.' });
}

// ─── Middleware ───────────────────────────────────────────────────────────────
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// ─── JWT Auth Middleware ──────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// ─── POST /register ───────────────────────────────────────────────────────────
router.post('/register', (req, res) => {
  // ── 1. Extract & sanitise inputs ──────────────────────────────────────────
  const fullName        = (req.body.fullName || req.body.username || '').trim();
  const email           = (req.body.email    || '').trim().toLowerCase();
  const password        = req.body.password        || '';
  const confirmPassword = req.body.confirmPassword || '';

  // ── 2. Validate Full Name ─────────────────────────────────────────────────
  if (!fullName) {
    return res.status(400).json({ error: 'Full name is required.' });
  }
  if (fullName.length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters long.' });
  }
  if (fullName.length > 100) {
    return res.status(400).json({ error: 'Full name must not exceed 100 characters.' });
  }

  // ── 3. Validate Email ─────────────────────────────────────────────────────
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // ── 4. Validate Password ──────────────────────────────────────────────────
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  if (password.length > 128) {
    return res.status(400).json({ error: 'Password must not exceed 128 characters.' });
  }

  // ── 5. Validate Confirm Password (when provided by client) ────────────────
  // confirmPassword is validated client-side too, but also checked here.
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }

  // ── 6. Check for duplicate email ─────────────────────────────────────────
  db.get(
    'SELECT id FROM users WHERE LOWER(email) = ?',
    [email],
    (emailErr, existingByEmail) => {
      if (emailErr) return dbError(res, emailErr);

      if (existingByEmail) {
        return res.status(409).json({
          error: 'An account with this email address already exists. Please sign in instead.',
        });
      }

      // ── 7. Resolve unique username ───────────────────────────────────────
      db.get(
        'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
        [fullName],
        (userErr, existingByName) => {
          if (userErr) return dbError(res, userErr);

          // If the name is taken, append a random 3-digit suffix
          const finalUsername = existingByName
            ? `${fullName}_${String(Math.floor(100 + Math.random() * 900))}`
            : fullName;

          // ── 8. Hash password securely ────────────────────────────────────
          let hashedPassword;
          try {
            hashedPassword = bcrypt.hashSync(password, 12); // cost 12 for production
          } catch (hashErr) {
            console.error('[register] bcrypt error:', hashErr.message);
            return res.status(500).json({ error: 'An unexpected error occurred while securing your password. Please try again.' });
          }

          // ── 9. Insert new user ───────────────────────────────────────────
          db.run(
            'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
            [finalUsername, hashedPassword, email],
            function (insertErr) {
              if (insertErr) {
                // Catch any UNIQUE constraint race condition
                if (insertErr.message && insertErr.message.includes('UNIQUE')) {
                  return res.status(409).json({
                    error: 'An account with this email address already exists. Please sign in instead.',
                  });
                }
                return dbError(res, insertErr);
              }

              const userId = this.lastID;

              // ── 10. Issue JWT ────────────────────────────────────────────
              let token;
              try {
                token = jwt.sign(
                  { id: userId, username: finalUsername, email },
                  JWT_SECRET,
                  { expiresIn: '7d' }
                );
              } catch (jwtErr) {
                console.error('[register] JWT sign error:', jwtErr.message);
                // Registration succeeded but token failed — still return success
                // so the user can log in manually.
                return res.status(201).json({
                  message: 'Account created successfully! Please sign in.',
                  username: finalUsername,
                  email,
                });
              }

              // ── 11. Return success ───────────────────────────────────────
              return res.status(201).json({
                message:  'Account created successfully!',
                token,
                username: finalUsername,
                email,
                user: { id: userId, username: finalUsername, email },
              });
            }
          );
        }
      );
    }
  );
});

// ─── POST /login ──────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const identifier = (req.body.email || req.body.username || '').trim();
  const password   = req.body.password || '';

  if (!identifier) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  db.get(
    'SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)',
    [identifier, identifier],
    (err, user) => {
      if (err) return dbError(res, err);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email address or password.' });
      }

      let validPassword;
      try {
        validPassword = bcrypt.compareSync(password, user.password);
      } catch (cmpErr) {
        console.error('[login] bcrypt compare error:', cmpErr.message);
        return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' });
      }

      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email address or password.' });
      }

      let token;
      try {
        token = jwt.sign(
          { id: user.id, username: user.username, email: user.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
      } catch (jwtErr) {
        console.error('[login] JWT sign error:', jwtErr.message);
        return res.status(500).json({ error: 'Could not create session token. Please try again.' });
      }

      return res.json({
        message:  'Login successful',
        token,
        username: user.username,
        email:    user.email,
      });
    }
  );
});

// ─── POST /forgot-password ────────────────────────────────────────────────────
router.post('/forgot-password', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  db.get('SELECT id, email, username FROM users WHERE LOWER(email) = ?', [email], (err, user) => {
    if (err) return dbError(res, err);
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    let resetToken;
    try {
      resetToken = jwt.sign(
        { id: user.id, email: user.email, purpose: 'reset-password' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
    } catch (jwtErr) {
      return res.status(500).json({ error: 'Could not generate reset token. Please try again.' });
    }

    return res.json({
      message:    'Password reset instructions have been sent to your email address.',
      resetToken,
    });
  });
});

// ─── POST /reset-password ─────────────────────────────────────────────────────
router.post('/reset-password', (req, res) => {
  const email    = (req.body.email    || '').trim().toLowerCase();
  const password = req.body.password  || '';

  if (!email || !password) {
    return res.status(400).json({ error: 'Email address and new password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  let hashedPassword;
  try {
    hashedPassword = bcrypt.hashSync(password, 12);
  } catch (hashErr) {
    return res.status(500).json({ error: 'Could not process password reset. Please try again.' });
  }

  db.run(
    'UPDATE users SET password = ? WHERE LOWER(email) = ?',
    [hashedPassword, email],
    function (err) {
      if (err) return dbError(res, err);
      if (this.changes === 0) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }
      return res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
    }
  );
});

// ─── GET /auth/verify ─────────────────────────────────────────────────────────
router.get('/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// ─── GET /workouts ────────────────────────────────────────────────────────────
router.get('/workouts', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC, id DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return dbError(res, err);
      res.json(rows || []);
    }
  );
});

// ─── POST /workouts ───────────────────────────────────────────────────────────
router.post('/workouts', authenticateToken, (req, res) => {
  const { exercise, reps, sets, weight, calories, duration, form_score, performance_score, trainer_feedback } = req.body;
  if (!exercise) return res.status(400).json({ error: 'Exercise name is required.' });

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  db.run(
    'INSERT INTO workouts (user_id, exercise, reps, sets, weight, calories, duration, date, form_score, performance_score, trainer_feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      req.user.id,
      exercise,
      parseInt(reps, 10)    || 0,
      parseInt(sets, 10)    || 0,
      parseFloat(weight)    || 0.0,
      parseFloat(calories)  || 0.0,
      duration              || '00:00:00',
      date,
      parseFloat(form_score)        || 0.0,
      parseFloat(performance_score) || 0.0,
      trainer_feedback      || '',
    ],
    function (err) {
      if (err) return dbError(res, err);
      res.status(201).json({ id: this.lastID, message: 'Workout saved successfully.' });
    }
  );
});

// ─── GET /profile ─────────────────────────────────────────────────────────────
router.get('/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT username, email, weight_kg, target_calories FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) return dbError(res, err);
      if (!user) return res.status(404).json({ error: 'User not found.' });
      res.json(user);
    }
  );
});

// ─── PUT /profile ─────────────────────────────────────────────────────────────
router.put('/profile', authenticateToken, (req, res) => {
  const { email, weight_kg, target_calories } = req.body;

  db.run(
    'UPDATE users SET email = ?, weight_kg = ?, target_calories = ? WHERE id = ?',
    [email, weight_kg, target_calories, req.user.id],
    function (err) {
      if (err) return dbError(res, err);
      res.json({ message: 'Profile updated successfully.' });
    }
  );
});

// ─── GET /trainer/users ───────────────────────────────────────────────────────
router.get('/trainer/users', authenticateToken, (req, res) => {
  db.all(
    'SELECT id, username, email, weight_kg, target_calories FROM users',
    (err, rows) => {
      if (err) return dbError(res, err);
      res.json(rows || []);
    }
  );
});

// ─── GET /trainer/workouts ────────────────────────────────────────────────────
router.get('/trainer/workouts', authenticateToken, (req, res) => {
  db.all(
    `SELECT workouts.*, users.username, users.email
     FROM workouts
     JOIN users ON workouts.user_id = users.id
     ORDER BY workouts.date DESC, workouts.id DESC`,
    (err, rows) => {
      if (err) return dbError(res, err);
      res.json(rows || []);
    }
  );
});

// ─── PUT /workouts/:id/feedback ───────────────────────────────────────────────
router.put('/workouts/:id/feedback', authenticateToken, (req, res) => {
  const { feedback } = req.body;
  const workoutId    = req.params.id;

  db.run(
    'UPDATE workouts SET trainer_feedback = ? WHERE id = ?',
    [feedback || '', workoutId],
    function (err) {
      if (err) return dbError(res, err);
      if (this.changes === 0) return res.status(404).json({ error: 'Workout not found.' });
      res.json({ message: 'Trainer feedback updated successfully.' });
    }
  );
});

module.exports = router;
