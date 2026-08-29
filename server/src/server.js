const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const env = require('./config/env');
const { connectDB, getDBStatus } = require('./config/db');
const { initSocket } = require('./config/socket');

// Route imports
const authRoutes = require('./routes/authRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const executionRoutes = require('./routes/executionRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server, env.CLIENT_URL);

// Security & Performance Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS configuration - supports local dev, Vercel, Render, and configured CLIENT_URL
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === env.CLIENT_URL ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.railway.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// System Health & Heartbeat
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  return res.status(200).json({
    status: 'healthy',
    service: 'Agentflow_AI Orchestration Core',
    version: '1.0.0',
    uptime: process.uptime(),
    database: dbStatus,
    langGraphStatus: 'available',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist`,
    },
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred processing your request';

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    },
  });
});

const startServer = async () => {
  await connectDB();

  server.listen(env.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Agentflow_AI Server running on port ${env.PORT}`);
    console.log(`🔗 API Base URL: http://localhost:${env.PORT}/api`);
    console.log(`🌐 Socket.IO Server active on port ${env.PORT}`);
    console.log(`📡 Ready to accept requests from ${env.CLIENT_URL}`);
    console.log(`====================================================`);
  });
};

startServer();

module.exports = { app, server };
