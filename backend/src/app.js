require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { testConnection } = require('./db/pg');
const { connectMongo } = require('./db/mongo');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const businessRoutes = require('./routes/business');
const loanRoutes = require('./routes/loan');
const decisionRoutes = require('./routes/decision');

const app = express();

// ─── Security & Parsing Middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/loan', loanRoutes);
app.use('/api/v1/decision', decisionRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested endpoint does not exist',
    },
  });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Server Startup ──────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 4000;

const start = async () => {
  try {
    // PostgreSQL is required — fail if unavailable
    await testConnection();

    // MongoDB is best-effort — warn but don't crash if unavailable
    try {
      await connectMongo();
    } catch (mongoErr) {
      console.warn('[Server] MongoDB unavailable — audit logging disabled:', mongoErr.message);
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] MSME Lending API running on port ${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
};

start();

module.exports = app;
