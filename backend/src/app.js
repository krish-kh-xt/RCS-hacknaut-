// Express app: middleware + routes (Part 1 + Part 2 combined).
//
// Mount paths: Part 1 route files define their full paths (e.g. router.post('/sync')) and mount at '/'.
// Part 2 route files are written relative to a prefix (e.g. router.get('/') for /patrol-units),
// so the prefix is listed here. Route files that do not exist are skipped.
const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(
  cors({
    // If ALLOWED_ORIGINS is empty (local dev) allow everything.
    origin: config.allowedOrigins.length ? config.allowedOrigins : true,
  })
);
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

const ROUTES = [
  // Part 1
  { name: 'users', path: '/' },
  { name: 'trip', path: '/' },
  { name: 'sync', path: '/' },
  // Part 2
  { name: 'sos', path: '/sos' },
  { name: 'alerts', path: '/alerts' },
  { name: 'patrol', path: '/patrol-units' },
  { name: 'sms', path: '/sms' },
  { name: 'demo', path: '/demo' },
];

for (const { name, path } of ROUTES) {
  if (name === 'demo' && !config.demoMode) continue; // demo routes only when DEMO_MODE=true
  try {
    app.use(path, require(`./routes/${name}.routes`));
    console.log(`[routes] mounted ${name}.routes.js at ${path}`);
  } catch (err) {
    // Skip only when the route file itself is missing (first line of the message names it).
    // A missing npm package inside it must still crash loudly.
    const firstLine = String(err.message).split('\n')[0];
    if (err.code === 'MODULE_NOT_FOUND' && firstLine.includes(`${name}.routes`)) {
      console.log(`[routes] ${name}.routes.js not found yet, skipping`);
    } else {
      throw err;
    }
  }
}

app.use(notFound);
app.use(errorHandler);

module.exports = app;
