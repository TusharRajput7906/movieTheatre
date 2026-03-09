require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const authRoutes      = require('./routes/auth.routes');
const favoritesRoutes = require('./routes/favorites.routes');
const historyRoutes   = require('./routes/history.routes');
const adminRoutes     = require('./routes/admin.routes');

const app = express();

/* ── Middleware ─────────────────────────────────────── */
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

/* ── Health check ────────────────────────────────────── */
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

/* ── API Routes ─────────────────────────────────────── */
app.use('/api/auth',      authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/history',   historyRoutes);
app.use('/api/admin',     adminRoutes);

/* ── Serve React build (production) ─────────────────── */
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA catch-all: return index.html for any non-API route
// so React Router handles /movies, /tv, /person/:id etc on page refresh
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

/* ── Global error handler ───────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

/* ── Start ──────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
});
