const { Server } = require('socket.io');

let io = null;

const initSocket = (server, clientUrl) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // Accept all origins in development and production
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join specific execution room for live timeline updates
    socket.on('join_execution', (executionId) => {
      if (executionId) {
        socket.join(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined execution:${executionId}`);
      }
    });

    socket.on('leave_execution', (executionId) => {
      if (executionId) {
        socket.leave(`execution:${executionId}`);
        console.log(`[Socket.IO] Socket ${socket.id} left execution:${executionId}`);
      }
    });

    // Join user notification channel
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn('[Socket.IO] Socket.io not initialized yet.');
  }
  return io;
};

// Real-Time Event Helpers
const emitAgentEvent = (executionId, agentEvent) => {
  if (io && executionId) {
    io.to(`execution:${executionId}`).emit('agent_event', agentEvent);
  }
};

const emitExecutionUpdate = (executionId, executionData) => {
  if (io && executionId) {
    io.to(`execution:${executionId}`).emit('execution_update', executionData);
  }
};

const emitNotification = (userId, notification) => {
  if (io && userId) {
    io.to(`user:${userId}`).emit('notification', notification);
    io.emit('global_notification', notification); // Also fallback broadcast for development
  }
};

module.exports = {
  initSocket,
  getIO,
  emitAgentEvent,
  emitExecutionUpdate,
  emitNotification,
};
