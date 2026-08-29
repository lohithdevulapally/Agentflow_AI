const plannerAgent = require('./plannerAgent');
const executionAgent = require('./executionAgent');
const validationAgent = require('./validationAgent');
const recoveryAgent = require('./recoveryAgent');
const monitoringAgent = require('./monitoringAgent');
const Execution = require('../models/Execution');
const Notification = require('../models/Notification');
const { emitExecutionUpdate, emitNotification } = require('../config/socket');

class MultiAgentOrchestrator {
  constructor() {
    this.activeExecutions = new Map(); // tracks runtime control flags (pause/cancel)
  }

  setExecutionControl(executionId, action) {
    // action: 'pause' | 'resume' | 'cancel'
    this.activeExecutions.set(executionId, action);
  }

  getExecutionControl(executionId) {
    return this.activeExecutions.get(executionId) || 'run';
  }

  async runWorkflow(executionId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const workflow = execution.workflowSnapshot;
    const userId = execution.owner;
    const startTime = Date.now();

    // 1. Initialize State & Emit Start Event
    await Execution.findByIdAndUpdate(executionId, {
      status: 'RUNNING',
      startTime: new Date(),
    });

    emitExecutionUpdate(executionId, { status: 'RUNNING', startTime: new Date() });

    await monitoringAgent.emitEvent({
      executionId,
      workflowId: workflow.id || workflow._id,
      agent: 'monitoring',
      level: 'info',
      message: `🚀 Multi-Agent Orchestrator initiated for workflow "${workflow.name}" (LangGraph substrate: available)`,
      metadata: { langGraph: 'available', version: workflow.version || 1 },
    });

    // 2. Planner Agent Phase
    let plan;
    try {
      plan = await plannerAgent.planExecution(workflow, executionId);
      await monitoringAgent.emitEvent({
        executionId,
        workflowId: workflow.id || workflow._id,
        agent: 'planner',
        level: 'info',
        message: `📋 Planner Agent computed optimal execution sequence: ${plan.totalSteps} steps (Confidence Score: ${(plan.confidenceScore * 100).toFixed(0)}%)`,
        metadata: plan,
      });
    } catch (err) {
      await monitoringAgent.emitEvent({
        executionId,
        workflowId: workflow.id || workflow._id,
        agent: 'planner',
        level: 'error',
        message: `❌ Planner Agent failed: ${err.message}`,
        metadata: { error: err.message },
      });

      await Execution.findByIdAndUpdate(executionId, {
        status: 'FAILED',
        error: { message: err.message, agent: 'planner' },
        endTime: new Date(),
        duration: Date.now() - startTime,
      });

      emitExecutionUpdate(executionId, { status: 'FAILED' });
      return;
    }

    // 3. Execution Loop
    const context = {
      initialInputs: execution.inputs || {},
    };
    const nodeOutputs = {};
    const nodesById = new Map((workflow.nodes || []).map((n) => [n.id, n]));

    for (let i = 0; i < plan.executionSequence.length; i++) {
      const nodeId = plan.executionSequence[i];
      const node = nodesById.get(nodeId);

      if (!node) {
        continue;
      }

      // Check runtime controls (pause / cancel)
      const currentControl = this.getExecutionControl(executionId);
      if (currentControl === 'cancel') {
        await Execution.findByIdAndUpdate(executionId, {
          status: 'CANCELLED',
          endTime: new Date(),
          duration: Date.now() - startTime,
        });
        await monitoringAgent.emitEvent({
          executionId,
          workflowId: workflow.id || workflow._id,
          nodeId,
          agent: 'monitoring',
          level: 'warning',
          message: '🛑 Execution manually CANCELLED by operator.',
        });
        emitExecutionUpdate(executionId, { status: 'CANCELLED' });
        this.activeExecutions.delete(executionId);
        return;
      }

      if (currentControl === 'pause') {
        await Execution.findByIdAndUpdate(executionId, {
          status: 'PAUSED',
          currentNode: nodeId,
        });
        await monitoringAgent.emitEvent({
          executionId,
          workflowId: workflow.id || workflow._id,
          nodeId,
          agent: 'monitoring',
          level: 'warning',
          message: `⏸️ Execution PAUSED at node [${node.data?.label || nodeId}] by operator.`,
        });
        emitExecutionUpdate(executionId, { status: 'PAUSED', currentNode: nodeId });
        return;
      }

      await Execution.findByIdAndUpdate(executionId, { currentNode: nodeId });
      emitExecutionUpdate(executionId, { currentNode: nodeId });

      // Step execution with Recovery retry loop
      let stepSuccess = false;
      let stepResult = null;
      let retryCount = 0;

      while (!stepSuccess) {
        try {
          await monitoringAgent.emitEvent({
            executionId,
            workflowId: workflow.id || workflow._id,
            nodeId,
            agent: 'execution',
            level: 'info',
            message: `⚡ Execution Agent running step ${i + 1}/${plan.totalSteps}: [${node.data?.label || nodeId}] (${node.data?.provider || node.type})`,
            metadata: { step: i + 1, provider: node.data?.provider, action: node.data?.action },
          });

          // Run Node
          stepResult = await executionAgent.executeNode(node, { ...context, ...nodeOutputs }, userId);

          // Validation Agent Phase
          const validationResult = await validationAgent.validateNodeOutput(node, stepResult);
          if (!validationResult.isValid) {
            const valError = new Error(validationResult.reason);
            valError.code = 'VALIDATION_FAILED';
            valError.details = validationResult;
            throw valError;
          }

          await monitoringAgent.emitEvent({
            executionId,
            workflowId: workflow.id || workflow._id,
            nodeId,
            agent: 'validation',
            level: 'success',
            message: `✅ Validation Agent verified output contracts for [${node.data?.label || nodeId}]`,
            metadata: validationResult,
          });

          nodeOutputs[nodeId] = stepResult.output;
          context[nodeId] = stepResult.output;
          stepSuccess = true;
        } catch (stepErr) {
          console.warn(`[Orchestrator] Error on step ${nodeId}:`, stepErr.message);

          // Recovery Agent Phase
          const recoveryDecision = await recoveryAgent.handleRecovery(stepErr, retryCount);

          await monitoringAgent.emitEvent({
            executionId,
            workflowId: workflow.id || workflow._id,
            nodeId,
            agent: 'recovery',
            level: recoveryDecision.shouldRetry ? 'warning' : 'error',
            message: `⚠️ Recovery Agent evaluated failure (${recoveryDecision.classification.category}): ${recoveryDecision.classification.rationale}`,
            metadata: recoveryDecision,
          });

          if (recoveryDecision.shouldRetry) {
            retryCount++;
            await Execution.findByIdAndUpdate(executionId, {
              status: 'RETRYING',
              retryCount: (execution.retryCount || 0) + retryCount,
            });
            emitExecutionUpdate(executionId, { status: 'RETRYING', retryCount });
            await new Promise((res) => setTimeout(res, recoveryDecision.delayMs || 1000));
          } else {
            // Escalation / Permanent Failure
            await Execution.findByIdAndUpdate(executionId, {
              status: 'FAILED',
              currentNode: nodeId,
              error: {
                message: stepErr.message,
                code: stepErr.code || 'STEP_FAILURE',
                nodeId,
                category: recoveryDecision.classification.category,
              },
              recoveryAction: 'escalate',
              endTime: new Date(),
              duration: Date.now() - startTime,
              outputs: nodeOutputs,
            });

            // Create operator alert notification
            const notif = await Notification.create({
              owner: userId,
              workflowId: workflow.id || workflow._id,
              executionId,
              type: 'escalation',
              title: `Execution Escalation: ${workflow.name}`,
              message: `Step [${node.data?.label || nodeId}] failed: ${stepErr.message}. Manual intervention required.`,
            });
            emitNotification(userId, notif);

            await monitoringAgent.emitEvent({
              executionId,
              workflowId: workflow.id || workflow._id,
              nodeId,
              agent: 'monitoring',
              level: 'error',
              message: `🚨 Execution FAILED. Operator escalation notification dispatched.`,
            });

            emitExecutionUpdate(executionId, { status: 'FAILED' });
            this.activeExecutions.delete(executionId);
            return;
          }
        }
      }
    }

    // 4. Successful Completion
    const duration = Date.now() - startTime;
    await Execution.findByIdAndUpdate(executionId, {
      status: 'COMPLETED',
      currentNode: null,
      endTime: new Date(),
      duration,
      outputs: nodeOutputs,
      orchestrationStats: {
        totalSteps: plan.totalSteps,
        confidenceScore: plan.confidenceScore,
        langGraph: 'available',
      },
    });

    const successNotif = await Notification.create({
      owner: userId,
      workflowId: workflow.id || workflow._id,
      executionId,
      type: 'success',
      title: `Workflow Completed: ${workflow.name}`,
      message: `All ${plan.totalSteps} steps completed in ${(duration / 1000).toFixed(2)}s with 100% contract validation.`,
    });
    emitNotification(userId, successNotif);

    await monitoringAgent.emitEvent({
      executionId,
      workflowId: workflow.id || workflow._id,
      agent: 'monitoring',
      level: 'success',
      message: `🎉 Workflow completed successfully in ${(duration / 1000).toFixed(2)}s. Audit records saved.`,
      metadata: { durationMs: duration, outputs: nodeOutputs },
    });

    emitExecutionUpdate(executionId, { status: 'COMPLETED', duration, outputs: nodeOutputs });
    this.activeExecutions.delete(executionId);
  }
}

module.exports = new MultiAgentOrchestrator();
