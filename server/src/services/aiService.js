const axios = require('axios');
const env = require('../config/env');

class AIService {
  async generateWorkflowFromPrompt(prompt, options = {}) {
    console.log(`[AIService] Generating workflow for prompt: "${prompt}"`);

    // Tier 1: Try OpenRouter API
    if (env.OPENROUTER_API_KEY) {
      try {
        const result = await this._callOpenRouter(prompt);
        if (result && result.nodes && result.nodes.length > 0) {
          return { ...result, generatorSource: 'OpenRouter AI' };
        }
      } catch (err) {
        console.warn('[AIService] OpenRouter failed, falling back to next provider:', err.message);
      }
    }

    // Tier 2: Try Gemini API
    if (env.GEMINI_API_KEY) {
      try {
        const result = await this._callGemini(prompt);
        if (result && result.nodes && result.nodes.length > 0) {
          return { ...result, generatorSource: 'Google Gemini' };
        }
      } catch (err) {
        console.warn('[AIService] Gemini failed, falling back to deterministic compiler:', err.message);
      }
    }

    // Tier 3: Deterministic Rule-Based Workflow Compiler (100% Reliable Fallback)
    const deterministicGraph = this._compileDeterministicGraph(prompt);
    return { ...deterministicGraph, generatorSource: 'Rule-Based Compiler (Fallback)' };
  }

  async _callOpenRouter(prompt) {
    const systemPrompt = `You are an AI Workflow Architect. Convert the user's natural language automation prompt into a structured JSON workflow with nodes and edges compatible with React Flow (@xyflow/react).
Return ONLY pure JSON without markdown code fences.
Format:
{
  "name": "Short Workflow Name",
  "description": "Short description",
  "tags": ["tag1", "tag2"],
  "nodes": [
    {
      "id": "node_1",
      "type": "trigger" | "ai" | "action" | "logic" | "integration",
      "position": { "x": 100, "y": 150 },
      "data": {
        "label": "Node Label",
        "category": "trigger" | "ai" | "action" | "logic" | "integration",
        "provider": "gmail" | "slack" | "discord" | "google-sheets" | "llm" | "system",
        "action": "action_name",
        "config": { ... }
      }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "node_1", "target": "node_2", "animated": true }
  ]
}`;

    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 12000,
      }
    );

    const content = res.data.choices[0].message.content.trim();
    const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  }

  async _callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Generate a JSON workflow structure with nodes and animated edges for React Flow from this automation prompt: "${prompt}". Return ONLY pure valid JSON with keys "name", "description", "tags", "nodes" (with id, type, position {x, y}, data {label, category, provider, action, config}), "edges" (with id, source, target, animated: true).`,
            },
          ],
        },
      ],
    };

    const res = await axios.post(url, payload, { timeout: 12000 });
    const text = res.data.candidates[0].content.parts[0].text;
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  }

  _compileDeterministicGraph(prompt) {
    const lower = prompt.toLowerCase();

    const isInvoice = lower.includes('invoice') || lower.includes('receipt') || lower.includes('bill');
    const isSlack = lower.includes('slack') || lower.includes('channel') || lower.includes('notify');
    const isDiscord = lower.includes('discord');
    const isGmail = lower.includes('gmail') || lower.includes('email') || lower.includes('mail');
    const isSheets = lower.includes('sheet') || lower.includes('excel') || lower.includes('table') || lower.includes('row');
    const isSentiment = lower.includes('sentiment') || lower.includes('classify') || lower.includes('feedback');

    const nodes = [];
    const edges = [];
    let currentX = 100;
    let step = 1;

    // Node 1: Trigger Node
    const triggerId = `node_${step++}`;
    if (isGmail) {
      nodes.push({
        id: triggerId,
        type: 'trigger',
        position: { x: currentX, y: 200 },
        data: {
          label: 'Incoming Email Trigger',
          category: 'trigger',
          provider: 'gmail',
          action: 'read_inbox',
          config: { filter: 'is:unread label:inbox', intervalSeconds: 60 },
        },
      });
    } else {
      nodes.push({
        id: triggerId,
        type: 'trigger',
        position: { x: currentX, y: 200 },
        data: {
          label: 'Webhook / Scheduled Trigger',
          category: 'trigger',
          provider: 'system',
          action: 'webhook',
          config: { endpoint: '/api/v1/webhooks/inbound', method: 'POST' },
        },
      });
    }

    let prevNodeId = triggerId;
    currentX += 300;

    // Node 2: AI Processing Node
    const aiId = `node_${step++}`;
    if (isInvoice) {
      nodes.push({
        id: aiId,
        type: 'ai',
        position: { x: currentX, y: 200 },
        data: {
          label: 'AI Invoice Data Extractor',
          category: 'ai',
          provider: 'llm',
          action: 'extract_entities',
          config: {
            prompt: 'Extract vendor_name, total_amount, due_date, and line_items from the document body.',
            model: 'agent-llm-v1',
            temperature: 0.1,
          },
        },
      });
    } else if (isSentiment) {
      nodes.push({
        id: aiId,
        type: 'ai',
        position: { x: currentX, y: 200 },
        data: {
          label: 'AI Sentiment & Intent Classifier',
          category: 'ai',
          provider: 'llm',
          action: 'classify',
          config: {
            categories: ['Positive', 'Neutral', 'Urgent Escalation'],
            temperature: 0.2,
          },
        },
      });
    } else {
      nodes.push({
        id: aiId,
        type: 'ai',
        position: { x: currentX, y: 200 },
        data: {
          label: 'AI Executive Summary Generator',
          category: 'ai',
          provider: 'llm',
          action: 'summarize',
          config: {
            instruction: 'Condense the payload into a 2-sentence actionable operator brief.',
            temperature: 0.3,
          },
        },
      });
    }
    edges.push({ id: `e_${prevNodeId}_${aiId}`, source: prevNodeId, target: aiId, animated: true });
    prevNodeId = aiId;
    currentX += 300;

    // Node 3: Primary Action Node (Slack or Discord or Email)
    const actionId = `node_${step++}`;
    if (isSlack || (!isDiscord && !isGmail)) {
      nodes.push({
        id: actionId,
        type: 'integration',
        position: { x: currentX, y: 150 },
        data: {
          label: 'Slack Ops Broadcast',
          category: 'integration',
          provider: 'slack',
          action: 'post_message',
          config: {
            channel: '#operations-alerts',
            message: '🚀 *Automated Workflow Event*: {{node_2.output}}',
          },
        },
      });
    } else if (isDiscord) {
      nodes.push({
        id: actionId,
        type: 'integration',
        position: { x: currentX, y: 150 },
        data: {
          label: 'Discord Webhook Alert',
          category: 'integration',
          provider: 'discord',
          action: 'send_message',
          config: {
            content: '⚡ **Agent Alert**: {{node_2.output}}',
            username: 'Agentflow Bot',
          },
        },
      });
    } else {
      nodes.push({
        id: actionId,
        type: 'integration',
        position: { x: currentX, y: 150 },
        data: {
          label: 'Send Email Notification',
          category: 'integration',
          provider: 'gmail',
          action: 'send_email',
          config: {
            to: 'team@company.com',
            subject: 'Automated Agent Report',
            body: 'Workflow processed successfully. Results: {{node_2.output}}',
          },
        },
      });
    }
    edges.push({ id: `e_${prevNodeId}_${actionId}`, source: prevNodeId, target: actionId, animated: true });

    // Node 4: Secondary Action Node (Google Sheets audit log or DB record)
    if (isSheets || isInvoice || nodes.length < 4) {
      const sheetId = `node_${step++}`;
      nodes.push({
        id: sheetId,
        type: 'integration',
        position: { x: currentX, y: 320 },
        data: {
          label: 'Google Sheets Audit Row',
          category: 'integration',
          provider: 'google-sheets',
          action: 'append_row',
          config: {
            spreadsheetId: 'master_operations_sheet_id',
            range: 'Automations!A1',
            values: ['{{now}}', '{{node_1.id}}', '{{node_2.output}}', 'SUCCESS'],
          },
        },
      });
      edges.push({ id: `e_${prevNodeId}_${sheetId}`, source: prevNodeId, target: sheetId, animated: true });
    }

    let name = 'Automated Agent Pipeline';
    if (isInvoice) name = 'Invoice Extraction & Multi-Channel Alert';
    else if (isSentiment) name = 'Feedback Sentiment Analysis & Escalation';
    else if (isGmail && isSlack) name = 'Gmail-to-Slack Operations Sync';

    return {
      name,
      description: `Generated automation workflow based on prompt: "${prompt}"`,
      tags: ['ai-generated', isInvoice ? 'finance' : 'operations', 'automated'],
      nodes,
      edges,
    };
  }
}

module.exports = new AIService();
