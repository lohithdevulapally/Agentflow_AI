# Agentflow_AI - Specification Document
**Single Source of Truth for Spec-Driven Development (SDD)**

## 1. Project Overview
Agentflow_AI is a full-stack, enterprise-grade AI Operations Automation Platform that enables operators to describe workflow automations in plain English, converts prompts into visual executable graphs on a drag-and-drop canvas, and executes them through a chain of 5 cooperating specialized AI agents (Planner, Execution, Validation, Recovery, Monitoring) with real-time Socket.IO event streaming and background queue retries.

## 2. Tech Stack
- **Frontend**: Next.js (Pages Router), React 19, Tailwind CSS, Zustand, Axios, React Flow (`@xyflow/react`), Socket.IO client, Lucide Icons.
- **Backend**: Node.js, Express, MongoDB & Mongoose (with automated in-memory store fallback), JWT, BullMQ / Redis (with in-memory async fallback), Socket.IO, Helmet, Morgan, Compression, Express-Validator, Bcrypt.js (cost factor 12).
- **AI Engine**: OpenRouter API, Google Gemini SDK, LangChain / LangGraph integration layer, and a high-reliability deterministic rule-based prompt compiler.
- **Integrations**: Gmail, Slack, Discord, Google Sheets with OAuth & Sandbox simulation modes, and AES-256 credential encryption at rest.

## 3. Multi-Agent Orchestration Chain
Every execution is processed by a pipeline of 5 dedicated agents:
1. **Planner Agent**: Analyzes graph topology, determines execution path, verifies node inputs, and assigns an execution confidence score.
2. **Execution Agent**: Runs each node sequentially against the target integration or AI model.
3. **Validation Agent**: Checks required fields, data formats, and output schemas against node contracts.
4. **Recovery Agent**: Classifies errors (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`), executes exponential backoff retries, or triggers operator escalation.
5. **Monitoring Agent**: Emits real-time telemetry, execution log entries, and Socket.IO broadcasts for live timeline rendering.

## 4. Third-Party Integrations & Security
- **Providers**: Gmail (send/read), Slack (post messages/channel notifications), Discord (bot/webhook messages), Google Sheets (read/append rows).
- **Security**: AES-256-CBC token encryption using `CREDENTIAL_ENCRYPTION_KEY`. Tokens are never exposed in plaintext logs.
- **Connection Modes**: Live OAuth2 flow + Sandbox Mock Simulation. Missing/expired credentials trigger explicit `INTEGRATION_NOT_CONNECTED` or `AUTH_EXPIRED` errors.

## 5. API Endpoints
- `GET /api/health` - Health check & subsystem status
- `POST /api/auth/register` - Operator registration
- `POST /api/auth/login` - Operator login (returns JWT)
- `GET /api/auth/me` - Profile & role fetch
- `GET /api/workflows/dashboard` - Dashboard metrics & statistics
- `GET /api/workflows` - List user workflows
- `POST /api/workflows` - Create workflow
- `POST /api/workflows/generate` - AI Prompt-to-Workflow generation
- `GET /api/workflows/:id` - Fetch single workflow
- `PUT /api/workflows/:id` - Update workflow graph & settings
- `POST /api/workflows/:id/duplicate` - Duplicate workflow
- `POST /api/workflows/:id/execute` - Trigger execution run
- `DELETE /api/workflows/:id` - Delete workflow
- `GET /api/executions` - List execution runs
- `GET /api/executions/:id` - Get execution details and snapshot
- `GET /api/executions/:id/timeline` - Get detailed agent logs
- `POST /api/executions/:id/pause` - Pause execution
- `POST /api/executions/:id/resume` - Resume execution
- `POST /api/executions/:id/cancel` - Cancel execution
- `GET /api/integrations` - List integrations
- `GET /api/integrations/status` - Integration health checks
- `GET /api/integrations/oauth/:provider/start` - Start OAuth flow
- `GET /api/integrations/oauth/:provider/callback` - OAuth callback
- `POST /api/integrations` - Save manual / mock credentials
- `GET /api/notifications` - List operator notifications

## 6. Execution & Verification Rules
- The backend must run gracefully out of the box even if external MongoDB, Redis, or AI keys are absent.
- The UI must provide a dark-mode ready, crisp operator console with live visual indicators.
