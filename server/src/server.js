const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initSocket } = require('./config/socket');

const server = http.createServer(app);

// Socket.IO for local / traditional server
initSocket(server, env.CLIENT_URL);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(env.PORT, () => {
      console.log('====================================');
      console.log(`🚀 Agentflow_AI Server running on port ${env.PORT}`);
      console.log(`🔗 API: http://localhost:${env.PORT}/api`);
      console.log('🌐 Socket.IO active');
      console.log('====================================');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
