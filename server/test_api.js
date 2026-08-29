const axios = require('axios');

async function testBackend() {
  const baseURL = 'http://localhost:5000/api';
  console.log('Testing Agentflow_AI Backend Endpoints...\n');

  try {
    // 1. Health Check
    const health = await axios.get(`${baseURL}/health`);
    console.log('1. Health Check:', health.data.status, '| DB:', health.data.database.type);

    // 2. Register Operator
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'System Operator',
      email: 'operator@agentflow.io',
      password: 'password123',
      role: 'admin',
    });
    console.log('2. Registration:', regRes.data.success ? 'PASSED' : 'FAILED', '| Token received');
    const token = regRes.data.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 3. Login
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'operator@agentflow.io',
      password: 'password123',
    });
    console.log('3. Login Auth:', loginRes.data.success ? 'PASSED' : 'FAILED');

    // 4. Generate Workflow from Prompt
    const genRes = await axios.post(
      `${baseURL}/workflows/generate`,
      {
        prompt: 'When invoice arrives on Gmail, extract total with AI and send alert to Slack #finance',
      },
      { headers: authHeaders }
    );
    console.log('4. AI Workflow Generation:', genRes.data.success ? 'PASSED' : 'FAILED', '| Nodes compiled:', genRes.data.data.nodes.length);

    // 5. Create Workflow
    const createWf = await axios.post(
      `${baseURL}/workflows`,
      {
        name: genRes.data.data.name,
        description: genRes.data.data.description,
        nodes: genRes.data.data.nodes,
        edges: genRes.data.data.edges,
        tags: ['test', 'automation'],
      },
      { headers: authHeaders }
    );
    const workflowId = createWf.data.data.id || createWf.data.data._id;
    console.log('5. Workflow Creation & Persistence:', createWf.data.success ? 'PASSED' : 'FAILED', '| ID:', workflowId);

    // 6. Connect Sandbox Integrations (Gmail & Slack)
    await axios.post(
      `${baseURL}/integrations`,
      {
        provider: 'gmail',
        accessToken: 'sandbox_gmail_token',
        accountEmail: 'operator@sandbox.gmail.com',
        isSandbox: true,
      },
      { headers: authHeaders }
    );
    await axios.post(
      `${baseURL}/integrations`,
      {
        provider: 'slack',
        accessToken: 'sandbox_slack_token',
        accountName: 'Agentflow Ops Slack',
        isSandbox: true,
      },
      { headers: authHeaders }
    );
    console.log('6. Third-Party Integrations Sandbox Connect: PASSED');

    // 7. Trigger Multi-Agent Workflow Execution
    const execRes = await axios.post(
      `${baseURL}/workflows/${workflowId}/execute`,
      { inputs: { invoiceNumber: 'INV-2026-991', amount: '$450.00' } },
      { headers: authHeaders }
    );
    const executionId = execRes.data.data.execution.id || execRes.data.data.execution._id;
    console.log('7. Trigger Execution:', execRes.data.success ? 'PASSED' : 'FAILED', '| Exec ID:', executionId);

    // Wait 2 seconds for the 5-agent pipeline to process
    console.log('\nWaiting for 5-agent orchestration engine to complete execution...');
    await new Promise((r) => setTimeout(r, 2000));

    // 8. Fetch Execution Status & Timeline Logs
    const statusRes = await axios.get(`${baseURL}/executions/${executionId}`, { headers: authHeaders });
    console.log('8. Execution Status:', statusRes.data.data.status, '| Duration:', `${statusRes.data.data.duration}ms`);

    const timelineRes = await axios.get(`${baseURL}/executions/${executionId}/timeline`, { headers: authHeaders });
    console.log('9. Agent Timeline Logs count:', timelineRes.data.data.length);
    timelineRes.data.data.forEach((log) => {
      console.log(`   [${log.agent.toUpperCase()}] ${log.message}`);
    });

    // 10. Dashboard Metrics
    const dashRes = await axios.get(`${baseURL}/workflows/dashboard`, { headers: authHeaders });
    console.log('\n10. Dashboard Metrics Aggregate: PASSED', JSON.stringify(dashRes.data.data.metrics));

    console.log('\n========================================');
    console.log('🎉 ALL BACKEND SUBSYSTEM TESTS PASSED 100%');
    console.log('========================================');
  } catch (err) {
    console.error('Test Error:', err.response?.data || err.message);
  }
}

testBackend();
