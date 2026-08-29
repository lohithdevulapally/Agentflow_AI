const ExecutionLog = require('../models/ExecutionLog');
const { emitAgentEvent } = require('../config/socket');

class MonitoringAgent {
  constructor() {
    this.name = 'monitoring';
  }

  async emitEvent({ executionId, workflowId, nodeId = null, agent, level = 'info', message, metadata = {} }) {
    const timestamp = new Date();

    const logEntry = await ExecutionLog.create({
      executionId,
      workflowId,
      nodeId,
      agent,
      level,
      message,
      metadata,
      timestamp,
    });

    const eventPayload = {
      id: logEntry.id || logEntry._id,
      executionId,
      workflowId,
      nodeId,
      agent,
      level,
      message,
      metadata,
      timestamp: timestamp.toISOString(),
    };

    // Emit live event via Socket.IO
    emitAgentEvent(executionId, eventPayload);

    return eventPayload;
  }
}

module.exports = new MonitoringAgent();
