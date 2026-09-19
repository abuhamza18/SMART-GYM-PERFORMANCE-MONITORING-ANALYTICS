const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const router = express.Router();

const JWT_SECRET = 'smart-gym-super-secret-key-2026';

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// User Registration
router.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) {
    return res.status(404).json({ error: 'Username and password are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    [username, hashedPassword, email || null],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'User registered successfully' });
    }
  );
});

// User Login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: user.username });
  });
});

// Get Workouts for Authenticated User
router.get('/workouts', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM workouts WHERE user_id = ? ORDER BY date DESC, id DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Save a Workout
router.post('/workouts', authenticateToken, (req, res) => {
  const { exercise, reps, sets, weight, calories, duration, form_score, performance_score, trainer_feedback } = req.body;
  if (!exercise) return res.status(400).json({ error: 'Exercise name is required' });

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  db.run(
    'INSERT INTO workouts (user_id, exercise, reps, sets, weight, calories, duration, date, form_score, performance_score, trainer_feedback) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      req.user.id,
      exercise,
      parseInt(reps, 10) || 0,
      parseInt(sets, 10) || 0,
      parseFloat(weight) || 0.0,
      parseFloat(calories) || 0.0,
      duration || '00:00:00',
      date,
      parseFloat(form_score) || 0.0,
      parseFloat(performance_score) || 0.0,
      trainer_feedback || ''
    ],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, message: 'Workout saved successfully' });
    }
  );
});

// Get User Profile Info
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT username, email, weight_kg, target_calories FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });
});

// Update User Profile
router.put('/profile', authenticateToken, (req, res) => {
  const { email, weight_kg, target_calories } = req.body;

  db.run(
    'UPDATE users SET email = ?, weight_kg = ?, target_calories = ? WHERE id = ?',
    [email, weight_kg, target_calories, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Profile updated successfully' });
    }
  );
});

// GET Trainer Client List
router.get('/trainer/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, email, weight_kg, target_calories FROM users', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET All Clients Workouts
router.get('/trainer/workouts', authenticateToken, (req, res) => {
  db.all(
    `SELECT workouts.*, users.username, users.email 
     FROM workouts 
     JOIN users ON workouts.user_id = users.id 
     ORDER BY workouts.date DESC, workouts.id DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// UPDATE Workout Feedback by Trainer
router.put('/workouts/:id/feedback', authenticateToken, (req, res) => {
  const { feedback } = req.body;
  const workoutId = req.params.id;

  db.run(
    'UPDATE workouts SET trainer_feedback = ? WHERE id = ?',
    [feedback || '', workoutId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'Workout not found' });
      res.json({ message: 'Trainer feedback updated successfully' });
    }
  );
});

module.exports = router;
