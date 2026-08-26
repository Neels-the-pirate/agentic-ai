/**
 * Execution Agent
 * Executes each node against the correct third-party integration or AI provider.
 */
class ExecutionAgent {
  constructor() {
    this.name = 'execution';
  }

  /**
   * Execute a single node in the workflow plan
   * @param {object} node - Workflow node definition
   * @param {object} context - Execution context containing previous node outputs and user inputs
   * @param {object} integrationService - Injected integration service
   * @param {object} aiService - Injected AI service
   * @param {string} userId - ID of the workflow owner
   */
  async executeNode(node, context, integrationService, aiService, userId) {
    const nodeType = node.type || node.data?.type || 'generic';
    const config = node.data?.config || node.data || {};
    const startTime = Date.now();

    let output = null;

    switch (nodeType) {
      // Trigger Nodes
      case 'trigger_webhook':
      case 'trigger_manual':
      case 'trigger_gmail':
      case 'trigger_schedule':
        output = {
          triggeredAt: new Date().toISOString(),
          initialPayload: context.inputs || {},
          status: 'TRIGGERED',
        };
        break;

      // AI Nodes
      case 'ai_sentiment':
      case 'ai_summarize':
      case 'ai_generate':
      case 'ai_classify': {
        const promptText = config.prompt || `Process context: ${JSON.stringify(context.lastOutput || context.inputs)}`;
        output = await aiService.executeAITask({
          task: nodeType,
          prompt: promptText,
          inputContext: context,
        });
        break;
      }

      // Integration Action: Gmail
      case 'action_gmail':
      case 'gmail_send':
      case 'gmail_read': {
        const action = nodeType === 'gmail_read' ? 'read_emails' : 'send_email';
        const payload = {
          to: config.to || context.inputs?.customerEmail || context.lastOutput?.email || 'operator@agentflow.ai',
          subject: config.subject || `Notification: ${node.data?.label || 'Workflow Alert'}`,
          body: config.body || (typeof context.lastOutput === 'string' ? context.lastOutput : JSON.stringify(context.lastOutput || context.inputs)),
        };
        output = await integrationService.executeProvider(userId, 'gmail', action, payload);
        break;
      }

      // Integration Action: Slack
      case 'action_slack':
      case 'slack_message': {
        const payload = {
          channel: config.channel || '#alerts',
          text: config.text || config.message || `[Agentflow_AI Alert] Step completed: ${node.data?.label || node.id}`,
        };
        output = await integrationService.executeProvider(userId, 'slack', 'post_message', payload);
        break;
      }

      // Integration Action: Discord
      case 'action_discord':
      case 'discord_message': {
        const payload = {
          channelId: config.channelId,
          content: config.content || config.text || `[Agentflow_AI Notification] Node ${node.data?.label || node.id} executed successfully.`,
        };
        output = await integrationService.executeProvider(userId, 'discord', 'post_message', payload);
        break;
      }

      // Integration Action: Google Sheets
      case 'action_sheets':
      case 'sheets_append':
      case 'sheets_read': {
        const action = nodeType === 'sheets_read' ? 'read_sheet' : 'append_row';
        const values = config.values || [
          new Date().toISOString(),
          context.inputs?.customerEmail || 'system@agentflow.ai',
          node.data?.label || 'Executed Step',
          JSON.stringify(context.lastOutput || {}),
        ];
        const payload = {
          spreadsheetId: config.spreadsheetId || 'default-sheet-id',
          range: config.range || 'Sheet1!A:D',
          values,
        };
        output = await integrationService.executeProvider(userId, 'google-sheets', action, payload);
        break;
      }

      // Generic Transform / Filter / Router Node
      case 'transform_json':
      case 'condition_filter':
      default: {
        output = {
          nodeId: node.id,
          label: node.data?.label || 'Process Step',
          transformed: true,
          inputReceived: context.lastOutput || context.inputs,
          timestamp: new Date().toISOString(),
        };
        break;
      }
    }

    const duration = Date.now() - startTime;

    return {
      nodeId: String(node.id),
      nodeLabel: node.data?.label || node.id,
      nodeType,
      duration,
      output,
    };
  }
}

module.exports = new ExecutionAgent();
