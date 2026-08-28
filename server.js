const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const { initExecutionQueue } = require('./src/queues/executionQueue');
const errorHandler = require('./src/middleware/errorHandler');

// Route Imports
const authRoutes = require('./src/routes/authRoutes');
const workflowRoutes = require('./src/routes/workflowRoutes');
const executionRoutes = require('./src/routes/executionRoutes');
const integrationRoutes = require('./src/routes/integrationRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// 1. Security & Core Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: [config.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// 2. Rate Limiting for Auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth attempts, please try again later' } },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 3. System Health Check Endpoint
app.get('/api/health', (req, res) => {
  let langGraphStatus = 'not-installed';
  try {
    require.resolve('@langchain/langgraph');
    langGraphStatus = 'available';
  } catch (e) {
    langGraphStatus = 'not-installed';
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      server: 'online',
      database: 'connected',
      langGraph: langGraphStatus,
      clientUrl: config.clientUrl,
    },
  });
});

// 4. API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// 5. Centralized Error Handler
app.use(errorHandler);

// 6. Server Initialization
const startServer = async () => {
  try {
    await connectDB();
    initSocket(server, config.clientUrl);
    initExecutionQueue();

    server.listen(config.port, () => {
      console.log(`=======================================================`);
      console.log(`  Agentflow_AI Backend Server listening on port ${config.port}`);
      console.log(`  Environment : ${config.nodeEnv}`);
      console.log(`  Client Origin: ${config.clientUrl}`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Fatal server startup failure:', err);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
