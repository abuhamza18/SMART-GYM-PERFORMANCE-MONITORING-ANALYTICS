const express = require('express');

const app = express();

app.use(express.json());

// Enable CORS for all origins (required for Vercel serverless)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Always set JSON content-type header for API responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

// Lazy-load routes so database errors surface as 503 rather than crashing the process
let routes;
function getRoutes() {
  if (!routes) {
    try {
      routes = require('../server/routes');
    } catch (err) {
      console.error('Failed to load routes:', err.message);
      return null;
    }
  }
  return routes;
}

// Handle all requests: Vercel rewrites /api/(.*) → this file
// The path arriving here may be /api/register or just /register depending on
// whether Vercel strips the prefix.  Support both.
app.use((req, res, next) => {
  const r = getRoutes();
  if (!r) {
    return res.status(503).json({ error: 'Service temporarily unavailable. Please try again shortly.' });
  }

  // If path starts with /api, strip the prefix so the router sees /register etc.
  if (req.path.startsWith('/api/') || req.path === '/api') {
    req.url = req.url.replace(/^\/api/, '') || '/';
  }

  r(req, res, next);
});

// 404 fallback for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.path });
});

// Centralised error handler — always returns JSON, never HTML
app.use((err, req, res, _next) => {
  console.error('API Error:', err.message || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
