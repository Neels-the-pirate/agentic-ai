const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Workflow = require('./models/Workflow');
const Integration = require('./models/Integration');
const integrationService = require('./services/integrationService');

const seed = async () => {
  try {
    console.log('[Seed] Starting database seeder...');
    await connectDB();

    // 1. Create Default Admin User
    let admin = await User.findOne({ email: 'admin@agentflow.ai' });
    if (!admin) {
      admin = await User.create({
        name: 'Lead Operator',
        email: 'admin@agentflow.ai',
        password: 'Password123!',
        role: 'admin',
      });
      console.log('[Seed] Admin user created: admin@agentflow.ai (Password: Password123!)');
    } else {
      console.log('[Seed] Admin user already exists: admin@agentflow.ai');
    }

    // 2. Create Sample Integrations for Admin
    await integrationService.saveCredentials(
      admin._id,
      'slack',
      { webhookUrl: 'https://hooks.slack.com/services/MOCK/TOKEN/123', mockMode: true },
      '#ops-alerts'
    );
    await integrationService.saveCredentials(
      admin._id,
      'gmail',
      { accessToken: 'mock_gmail_token', mockMode: true },
      'operator@agentflow.ai'
    );

    // 3. Create Sample Workflow 1: Customer Feedback Triage
    const existingWorkflow = await Workflow.findOne({ owner: admin._id, name: 'Customer Feedback & Sentiment Triage' });
    if (!existingWorkflow) {
      await Workflow.create({
        name: 'Customer Feedback & Sentiment Triage',
        description: 'Ingests customer support emails, analyzes tone with AI, and notifies the team via Slack.',
        owner: admin._id,
        status: 'active',
        tags: ['customer-support', 'sentiment', 'slack'],
        version: 1,
        triggerConfig: {
          type: 'trigger_gmail',
          config: { query: 'is:unread label:support' },
        },
        nodes: [
          {
            id: 'node-1',
            type: 'trigger_gmail',
            position: { x: 100, y: 150 },
            data: { label: 'Gmail Inbound Email', type: 'trigger_gmail' },
          },
          {
            id: 'node-2',
            type: 'ai_sentiment',
            position: { x: 380, y: 150 },
            data: { label: 'AI Sentiment & Urgency Analysis', type: 'ai_sentiment' },
          },
          {
            id: 'node-3',
            type: 'action_sheets',
            position: { x: 680, y: 80 },
            data: { label: 'Log Feedback to Google Sheets', type: 'action_sheets' },
          },
          {
            id: 'node-4',
            type: 'action_slack',
            position: { x: 680, y: 240 },
            data: { label: 'Dispatch Slack Alert to #support', type: 'action_slack' },
          },
        ],
        edges: [
          { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
          { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
          { id: 'e2-4', source: 'node-2', target: 'node-4', animated: true },
        ],
      });
      console.log('[Seed] Sample workflow created.');
    }

    console.log('[Seed] Seeding completed successfully.');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during database seed:', err);
    process.exit(1);
  }
};

seed();
