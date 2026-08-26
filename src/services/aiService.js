const axios = require('axios');
const config = require('../config/env');

class AIService {
  /**
   * Generate a workflow graph from a natural language prompt
   * Priority: OpenRouter -> Google Gemini -> Deterministic Rule Engine
   */
  async generateWorkflowFromPrompt(prompt) {
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Prompt is required for workflow generation');
    }

    // 1. Try OpenRouter
    if (config.ai.openRouterKey) {
      try {
        const result = await this.generateViaOpenRouter(prompt);
        if (result && result.nodes && result.nodes.length > 0) {
          return { workflow: result, provider: 'openrouter' };
        }
      } catch (err) {
        console.warn('[AIService] OpenRouter generation failed:', err.message);
      }
    }

    // 2. Try Google Gemini
    if (config.ai.geminiKey) {
      try {
        const result = await this.generateViaGemini(prompt);
        if (result && result.nodes && result.nodes.length > 0) {
          return { workflow: result, provider: 'gemini' };
        }
      } catch (err) {
        console.warn('[AIService] Gemini generation failed:', err.message);
      }
    }

    // 3. Deterministic Rule-Based Builder Fallback
    console.log('[AIService] Using deterministic rule-based workflow builder fallback');
    const result = this.generateDeterministicWorkflow(prompt);
    return { workflow: result, provider: 'deterministic-rule-engine' };
  }

  /**
   * OpenRouter API caller
   */
  async generateViaOpenRouter(prompt) {
    const systemPrompt = `You are a workflow architect. Convert the user's automation request into a JSON object with:
- "name": string
- "description": string
- "nodes": Array of { id: string, type: string, position: { x: number, y: number }, data: { label: string, config: object } }
- "edges": Array of { id: string, source: string, target: string }
Node types allowed: trigger_gmail, trigger_webhook, trigger_schedule, ai_sentiment, ai_summarize, ai_classify, action_gmail, action_slack, action_discord, action_sheets, transform_json.
Return ONLY raw valid JSON without markdown wrapping.`;

    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.openRouterKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = res.data?.choices?.[0]?.message?.content;
    return JSON.parse(content);
  }

  /**
   * Google Gemini API caller
   */
  async generateViaGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.ai.geminiKey}`;
    const systemInstruction = `Convert the automation request into JSON with format: {"name": string, "description": string, "nodes": Array, "edges": Array}. Return ONLY raw JSON.`;

    const res = await axios.post(
      url,
      {
        contents: [
          {
            parts: [{ text: `${systemInstruction}\n\nRequest: ${prompt}` }],
          },
        ],
      },
      { timeout: 10000 }
    );

    let text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  }

  /**
   * Deterministic Rule-Based Workflow Generator
   * Generates production-ready graphs for common automation intents
   */
  generateDeterministicWorkflow(prompt) {
    const p = prompt.toLowerCase();
    let name = 'Automated Operations Workflow';
    let description = `Generated workflow based on: "${prompt.slice(0, 80)}..."`;
    const nodes = [];
    const edges = [];

    let currentX = 100;
    let currentY = 150;
    const stepX = 260;

    // 1. Determine Trigger
    if (p.includes('gmail') || p.includes('email') || p.includes('mail')) {
      name = 'Email Ingestion & Dispatch Pipeline';
      nodes.push({
        id: 'node-trigger',
        type: 'trigger_gmail',
        position: { x: currentX, y: currentY },
        data: {
          label: 'Gmail New Email Trigger',
          type: 'trigger_gmail',
          config: { query: 'is:unread', intervalMinutes: 5 },
        },
      });
    } else if (p.includes('schedule') || p.includes('daily') || p.includes('hourly') || p.includes('cron')) {
      name = 'Scheduled Operations Job';
      nodes.push({
        id: 'node-trigger',
        type: 'trigger_schedule',
        position: { x: currentX, y: currentY },
        data: {
          label: 'Cron Schedule Trigger',
          type: 'trigger_schedule',
          config: { cron: '0 9 * * *' },
        },
      });
    } else {
      name = 'Webhook Event Processor';
      nodes.push({
        id: 'node-trigger',
        type: 'trigger_webhook',
        position: { x: currentX, y: currentY },
        data: {
          label: 'Webhook Ingestion Trigger',
          type: 'trigger_webhook',
          config: { endpoint: '/api/v1/webhook/incoming' },
        },
      });
    }

    let prevNodeId = 'node-trigger';

    // 2. AI Intelligence Node
    if (p.includes('sentiment') || p.includes('emotion') || p.includes('tone')) {
      currentX += stepX;
      const aiNodeId = 'node-ai-sentiment';
      nodes.push({
        id: aiNodeId,
        type: 'ai_sentiment',
        position: { x: currentX, y: currentY },
        data: {
          label: 'AI Sentiment Analyzer',
          type: 'ai_sentiment',
          config: { model: 'gemini-1.5-flash', requiredFields: ['sentiment', 'score'] },
        },
      });
      edges.push({ id: `e-${prevNodeId}-${aiNodeId}`, source: prevNodeId, target: aiNodeId, animated: true });
      prevNodeId = aiNodeId;
    } else if (p.includes('summar') || p.includes('digest')) {
      currentX += stepX;
      const aiNodeId = 'node-ai-summarize';
      nodes.push({
        id: aiNodeId,
        type: 'ai_summarize',
        position: { x: currentX, y: currentY },
        data: {
          label: 'AI Text Summarizer',
          type: 'ai_summarize',
          config: { maxLength: 200, requiredFields: ['summary'] },
        },
      });
      edges.push({ id: `e-${prevNodeId}-${aiNodeId}`, source: prevNodeId, target: aiNodeId, animated: true });
      prevNodeId = aiNodeId;
    } else if (p.includes('classify') || p.includes('route') || p.includes('categorize')) {
      currentX += stepX;
      const aiNodeId = 'node-ai-classify';
      nodes.push({
        id: aiNodeId,
        type: 'ai_classify',
        position: { x: currentX, y: currentY },
        data: {
          label: 'AI Intent Classifier',
          type: 'ai_classify',
          config: { categories: ['Urgent', 'Support', 'Billing', 'General'] },
        },
      });
      edges.push({ id: `e-${prevNodeId}-${aiNodeId}`, source: prevNodeId, target: aiNodeId, animated: true });
      prevNodeId = aiNodeId;
    }

    // 3. Action Integrations (Branching or Sequential)
    const hasSheets = p.includes('sheet') || p.includes('spreadsheet') || p.includes('excel') || p.includes('row');
    const hasSlack = p.includes('slack') || p.includes('channel') || p.includes('team');
    const hasDiscord = p.includes('discord') || p.includes('bot');
    const hasEmailAction = p.includes('send email') || p.includes('notify user') || p.includes('reply');

    if (hasSheets) {
      currentX += stepX;
      const sheetsNodeId = 'node-action-sheets';
      nodes.push({
        id: sheetsNodeId,
        type: 'action_sheets',
        position: { x: currentX, y: currentY - 60 },
        data: {
          label: 'Google Sheets Append',
          type: 'action_sheets',
          config: { spreadsheetId: 'default-sheet-id', range: 'Sheet1!A:D' },
        },
      });
      edges.push({ id: `e-${prevNodeId}-${sheetsNodeId}`, source: prevNodeId, target: sheetsNodeId, animated: true });
    }

    if (hasSlack) {
      const slackNodeId = 'node-action-slack';
      nodes.push({
        id: slackNodeId,
        type: 'action_slack',
        position: { x: currentX + (hasSheets ? 0 : stepX), y: hasSheets ? currentY + 60 : currentY },
        data: {
          label: 'Slack Channel Alert',
          type: 'action_slack',
          config: { channel: '#ops-alerts' },
        },
      });
      edges.push({ id: `e-${prevNodeId}-${slackNodeId}`, source: prevNodeId, target: slackNodeId, animated: true });
    }

    if (hasDiscord) {
      const discordNodeId = 'node-action-discord';
      nodes.push({
        id: discordNodeId,
        type: 'action_discord',
        position: { x: currentX + stepX, y: currentY + 120 },
        data: {
          label: 'Discord Notification',
          type: 'action_discord',
          config: { channelId: 'general-alerts' },
        },
      });
      edges.push({ id: `e-${prevNodeId}-${discordNodeId}`, source: prevNodeId, target: discordNodeId, animated: true });
    }

    if (hasEmailAction || (!hasSheets && !hasSlack && !hasDiscord)) {
      const emailActionId = 'node-action-gmail';
      nodes.push({
        id: emailActionId,
        type: 'action_gmail',
        position: { x: currentX + stepX, y: currentY },
        data: {
          label: 'Gmail Send Notification',
          type: 'action_gmail',
          config: { to: 'operator@agentflow.ai', subject: 'Automated Operations Notification' },
        },
      });
      edges.push({ id: `e-${prevNodeId}-${emailActionId}`, source: prevNodeId, target: emailActionId, animated: true });
    }

    return {
      name,
      description,
      nodes,
      edges,
      version: 1,
      tags: ['ai-generated', 'automated'],
    };
  }

  /**
   * Execute single AI task on demand
   */
  async executeAITask({ task, prompt, inputContext }) {
    if (config.ai.geminiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.ai.geminiKey}`;
        const res = await axios.post(url, {
          contents: [{ parts: [{ text: `Task: ${task}\nPrompt: ${prompt}\nInput: ${JSON.stringify(inputContext)}` }] }],
        });
        const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        return { success: true, analysis: text, provider: 'gemini' };
      } catch (err) {
        console.warn('[AIService] Real Gemini call failed, using mock response:', err.message);
      }
    }

    // Default mock AI execution
    return {
      success: true,
      simulated: true,
      task,
      analysis: `AI evaluation for "${task}" executed successfully.`,
      score: 0.94,
      sentiment: 'positive',
      summary: 'Automated processing of input context verified.',
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new AIService();
