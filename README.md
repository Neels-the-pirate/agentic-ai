# Agentflow_AI — Agentic AI Automation Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14%2F15%20(Pages%20Router)-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green.svg)](https://mongoosejs.com/)
[![Redis & BullMQ](https://img.shields.io/badge/Queue-BullMQ%20%2F%20Redis-red.svg)](https://bullmq.io/)
[![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**Agentflow_AI** is an enterprise-grade, full-stack AI Operations Automation Platform. It enables operators to describe complex business workflows in natural language and automatically converts them into executable, visual directed graphs rendered on a drag-and-drop canvas. 

Workflows are executed through an autonomous chain of cooperating specialized AI agents (**Planner**, **Execution**, **Validation**, **Recovery**, and **Monitoring**), integrating with real-world enterprise tools (**Gmail**, **Slack**, **Discord**, and **Google Sheets**) over secure OAuth connections with encrypted credential storage. Real-time telemetry is streamed to the browser via Socket.IO, while BullMQ and Redis ensure reliable job scheduling, retries, and execution isolation with seamless in-memory fallbacks for zero-dependency local development.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Agentic Orchestration Model](#agentic-orchestration-model)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
  - [Backend Environment Variables (`server/.env`)](#backend-environment-variables-serverenv)
  - [Frontend Environment Variables (`client/.env.local`)](#frontend-environment-variables-clientenvlocal)
- [Database Setup & Collections](#database-setup--collections)
- [Local Installation & Quickstart](#local-installation--quickstart)
  - [1. Clone and Install Dependencies](#1-clone-and-install-dependencies)
  - [2. Backend Setup & Startup](#2-backend-setup--startup)
  - [3. Frontend Setup & Startup](#3-frontend-setup--startup)
  - [4. Concurrent Development Mode](#4-concurrent-development-mode)
- [Frontend Application Routing](#frontend-application-routing)
- [API Reference & Test Commands](#api-reference--test-commands)
  - [Health & Authentication](#1-health--authentication)
  - [Workflows Management & AI Generation](#2-workflows-management--ai-generation)
  - [Execution Engine & Controls](#3-execution-engine--controls)
  - [Integrations & Notifications](#4-integrations--notifications)
- [Third-Party Integrations & OAuth Setup](#third-party-integrations--oauth-setup)
- [Security & Production Hardening](#security--production-hardening)
- [Troubleshooting & FAQ](#troubleshooting--faq)
- [Development Phases](#development-phases)

---

## System Architecture

```
                                  ┌────────────────────────────────────────┐
                                  │           Operator Browser             │
                                  │  (Next.js Pages Router, React 19, Flow) │
                                  └──────────────────┬─────────────────────┘
                                                     │ HTTP REST / WebSocket
                                                     ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   Express Application Server                                      │
│                                                                                                   │
│  ┌──────────────────────┐   ┌──────────────────────┐   ┌───────────────────────────────────────┐  │
│  │     Routes Layer     │──▶│  Controllers Layer   │──▶│            Services Layer             │  │
│  │  (express-validator) │   │ (Request/Response)   │   │ (Workflow, Execution, Auth, AI, etc.) │  │
│  └──────────────────────┘   └──────────────────────┘   └───────────────────┬───────────────────┘  │
│                                                                            │                      │
│                                                                            ▼                      │
│                         ┌──────────────────────────────────────────────────────────────────────┐  │
│                         │                       Agentic Orchestration                          │  │
│                         │  ┌─────────┐   ┌───────────┐   ┌────────────┐   ┌──────────┐         │  │
│                         │  │ Planner │──▶│ Execution │──▶│ Validation │──▶│ Recovery │         │  │
│                         │  └─────────┘   └─────┬─────┘   └────────────┘   └────┬─────┘         │  │
│                         │                      │                               │               │  │
│                         │                      ▼                               ▼               │  │
│                         │             ┌─────────────────┐             ┌─────────────────┐      │  │
│                         │             │   Monitoring    │             │ Auto-Escalate / │      │  │
│                         │             │ (Telemetry Log) │             │  Retry Backoff  │      │  │
│                         │             └────────┬────────┘             └─────────────────┘      │  │
│                         └──────────────────────┼───────────────────────────────────────────────┘  │
│                                                │                                                  │
│                                                ▼ (Events)                                         │
│                                    ┌───────────────────────┐                                      │
│                                    │    Socket.IO Server   │──▶ Real-time Client Broadcast        │
│                                    └───────────────────────┘                                      │
└────────────────────────────────────────────────┬──────────────────────────────────────────────────┘
                                                 │
                     ┌───────────────────────────┼───────────────────────────┐
                     ▼                           ▼                           ▼
        ┌─────────────────────────┐ ┌─────────────────────────┐ ┌─────────────────────────┐
        │  MongoDB Database       │ │   BullMQ / Redis Queue  │ │ External Integrations   │
        │  - Users & Workflows    │ │   - Background workers  │ │ - Gmail, Slack          │
        │  - Executions & Logs    │ │   - Job retry scheduler │ │ - Discord, Sheets       │
        │  - (In-Memory Fallback) │ │   - (In-Memory Fallback)│ │ - OpenRouter / Gemini   │
        └─────────────────────────┘ └─────────────────────────┘ └─────────────────────────┘
```

---

## Key Features

1. **Natural Language to Workflow (AI Generation)**:
   - Primary generation through **OpenRouter API**.
   - Automatic fallback to **Google Gemini API** (`@google/generative-ai`).
   - Deterministic rule-based builder fallback if no AI keys are present.
2. **Visual Flow Canvas**:
   - Interactive drag-and-drop workspace powered by **React Flow** (`@xyflow/react`).
   - Custom node palette, animated connection edges, right-side configuration drawer, and minimap.
3. **5-Stage Autonomous Agent Pipeline**:
   - **Planner Agent**: Parses execution graphs, resolves topological ordering, and issues plan confidence ratings.
   - **Execution Agent**: Interacts with integration bridges and AI connectors.
   - **Validation Agent**: Asserts strict output payload schemas.
   - **Recovery Agent**: Classifies errors (`MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`) and applies exponential backoff or escalation.
   - **Monitoring Agent**: Emits granular telemetry and execution logs.
4. **Resilient Background Execution**:
   - BullMQ queue processing on Redis with pause, resume, and cancel capabilities.
   - Zero-dependency in-memory execution fallback when Redis is absent.
5. **Real-time Live Streaming**:
   - Socket.IO updates broadcast node status transitions, agent log lines, and alerts directly to browser clients.
6. **Enterprise Security & OAuth**:
   - Application-level AES-256 credential encryption at rest for third-party tokens (`CREDENTIAL_ENCRYPTION_KEY`).
   - Strict JWT authentication, bcrypt (cost factor 12) password hashing, Helmet headers, rate limiting, and CORS restriction.

---

## Agentic Orchestration Model

When a workflow execution is triggered, the backend initiates an orchestrated lifecycle:

```
[Trigger Run] ──▶ [Planner Agent]
                        │
                        ▼ (Topological plan + Confidence score)
                  [Execution Agent] ◀─────────────────────────────┐
                        │                                         │
                        ▼                                         │
                  [Validation Agent]                              │
                        │                                         │
            ┌───────────┴───────────┐                             │
            │                       │                             │
        (Valid)                 (Invalid)                         │
            │                       │                             │
            ▼                       ▼                             │
    [Monitoring Agent]      [Recovery Agent]                      │
            │                       │                             │
            │               ┌───────┴───────────────┐             │
            │               ▼                       ▼             │
            │       [retry_with_backoff]       [escalate]         │
            │               │                       │             │
            │               └───────────────────────┼─────────────┘
            │                                       ▼
            ▼                                 [Status: FAILED]
    [Next Node / Status: COMPLETED]
```

### Agent Roles & Responsibilities

| Agent | Responsibility | Output / Artifact |
| :--- | :--- | :--- |
| **Planner Agent** | Calculates execution order, detects circular dependencies, verifies node prerequisites, and outputs plan confidence. | Execution plan order & confidence score (0.00 – 1.00). |
| **Execution Agent** | Executes node handlers against internal AI providers or external APIs via the `baseIntegration` layer. | Node execution output payload. |
| **Validation Agent** | Validates schema conformance of intermediate data against required node output constraints. | Validation pass flag or schema mismatch errors. |
| **Recovery Agent** | Evaluates failure type: `MISSING_FIELDS`, `API_FAILURE`, `AUTH_EXPIRED`, `RATE_LIMIT`, `TRANSIENT`. | Decision: `retry_with_backoff` or `escalate`. |
| **Monitoring Agent** | Captures runtime metrics, step duration, memory snapshots, and broadcasts WebSocket telemetry. | Granular `ExecutionLog` entries. |

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14/15 (Pages Router)
- **UI Library**: React 19, Tailwind CSS
- **State Management**: Zustand (with localStorage persistence)
- **Graph / Visual Canvas**: React Flow (`@xyflow/react`)
- **HTTP Client**: Axios (with JWT interceptors)
- **Real-Time Client**: Socket.IO Client
- **Icons**: Lucide React

### Backend
- **Runtime & Server**: Node.js, Express.js
- **Database**: MongoDB & Mongoose (with automated in-memory MongoDB fallback)
- **Queue / Background Jobs**: BullMQ & Redis via `ioredis` (with in-memory queue fallback)
- **Real-Time Engine**: Socket.IO Server
- **Security & Validation**: JSON Web Tokens (JWT), bcryptjs (cost 12), Helmet, Morgan, Compression, express-validator, express-rate-limit
- **Cryptography**: Node.js `crypto` (AES-256-GCM / CBC with `CREDENTIAL_ENCRYPTION_KEY`)

### AI & Integrations
- **AI Providers**: OpenRouter API, Google Generative AI (`@google/generative-ai`)
- **Agent Framework**: LangChain & LangGraph substrate support
- **Third-Party Integrations**: Gmail API, Slack Web API, Discord REST & Bot API, Google Sheets API v4

---

## Directory Structure

```
.
├── client/                               # Frontend Next.js (Pages Router) Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppShell/                 # Main responsive operator shell & navigation
│   │   │   ├── MetricGrid/               # Dashboard metric cards & stats
│   │   │   ├── NodePalette/              # Drag-and-drop workflow node palette
│   │   │   ├── NodeConfigPanel/          # Right-side selected node property editor
│   │   │   ├── WorkflowCanvas/           # React Flow interactive graph canvas
│   │   │   └── ProtectedRoute/           # Client-side JWT auth boundary wrapper
│   │   ├── pages/
│   │   │   ├── _app.js                   # Application wrapper & global styles
│   │   │   ├── index.js                  # Landing page & platform showcase
│   │   │   ├── login.js                  # Operator authentication form
│   │   │   ├── register.js               # Operator registration form
│   │   │   ├── dashboard.js              # Metrics, active workflows & live feed
│   │   │   ├── integrations.js           # Third-party OAuth connection manager
│   │   │   ├── settings.js               # Profile, keys health check & security
│   │   │   ├── executions/
│   │   │   │   ├── index.js              # Execution history & live status table
│   │   │   │   └── [id].js               # Detailed execution graph & timeline
│   │   │   └── workflows/
│   │   │       ├── index.js              # Workflow list & search
│   │   │       ├── builder.js            # Natural language prompt-to-graph builder
│   │   │       └── [id].js               # Visual workflow canvas & node editor
│   │   ├── store/
│   │   │   ├── authStore.js              # User session, JWT & role state
│   │   │   └── workflowStore.js          # Active canvas nodes, edges & editor state
│   │   └── services/
│   │       ├── api.js                    # Configured Axios instance with interceptors
│   │       └── socket.js                 # Socket.IO connection manager
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── server/                               # Backend Node.js / Express Application
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js                    # Validated environment configuration
│   │   │   ├── db.js                     # MongoDB connection with in-memory fallback
│   │   │   └── socket.js                 # Socket.IO event server initializer
│   │   ├── routes/
│   │   │   ├── authRoutes.js             # /api/auth routes
│   │   │   ├── workflowRoutes.js         # /api/workflows routes
│   │   │   ├── executionRoutes.js        # /api/executions routes
│   │   │   ├── integrationRoutes.js      # /api/integrations & OAuth routes
│   │   │   └── notificationRoutes.js     # /api/notifications routes
│   │   ├── controllers/
│   │   │   ├── authController.js         # Request parsing & HTTP response shaping
│   │   │   ├── workflowController.js     # Workflow CRUD & prompt dispatch
│   │   │   ├── executionController.js    # Run controls (trigger, pause, resume, cancel)
│   │   │   └── integrationController.js  # OAuth handshake & credential management
│   │   ├── services/
│   │   │   ├── authService.js            # Password hashing, JWT signing & user logic
│   │   │   ├── workflowService.js        # Workflow CRUD, duplication & versioning
│   │   │   ├── executionService.js       # Run lifecycle, logs & state persistence
│   │   │   ├── aiService.js              # OpenRouter/Gemini prompt-to-graph generator
│   │   │   └── integrationService.js     # Token encryption/decryption & provider calls
│   │   ├── agents/
│   │   │   ├── orchestrator.js           # Multi-agent coordinator & LangGraph adapter
│   │   │   ├── plannerAgent.js           # Graph parsing & execution plan generator
│   │   │   ├── executionAgent.js         # Node execution against integrations
│   │   │   ├── validationAgent.js        # Payload & schema verification
│   │   │   ├── recoveryAgent.js          # Error classification & retry backoff engine
│   │   │   └── monitoringAgent.js        # Event logging & timeline telemetry emitter
│   │   ├── integrations/
│   │   │   ├── baseIntegration.js        # Abstract provider interface
│   │   │   ├── gmailIntegration.js       # Gmail send/read implementation
│   │   │   ├── slackIntegration.js       # Slack post message / webhook handler
│   │   │   ├── discordIntegration.js     # Discord bot / channel sender
│   │   │   └── googleSheetsIntegration.js# Google Sheets append/read implementation
│   │   ├── models/
│   │   │   ├── User.js                   # User schema (roles: admin, operator)
│   │   │   ├── Workflow.js               # Workflow schema (nodes, edges, versions)
│   │   │   ├── Execution.js              # Run instance snapshot & runtime state
│   │   │   ├── ExecutionLog.js           # Granular agent event timeline log
│   │   │   ├── Integration.js            # Encrypted OAuth tokens & connection state
│   │   │   └── Notification.js           # User alerts & escalation records
│   │   └── queues/
│   │       └── executionQueue.js         # BullMQ queue runner with fallback
│   ├── package.json
│   └── server.js
│
├── spec.md                               # Project Specification Single Source of Truth
└── README.md                             # Production-ready Documentation
```

---

## Prerequisites

Ensure your local machine has the following tools installed:

| Tool | Minimum Version | Recommended | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 18.18.0` | `v20.x LTS` | Check with `node -v` |
| **npm** / **pnpm** | `>= 9.x` | `npm v10+` | Bundled with Node |
| **MongoDB** | `>= 6.0` | Local / Atlas | *Optional* — automatic in-memory fallback included |
| **Redis** | `>= 6.0` | Local / Cloud | *Optional* — automatic in-memory queue fallback included |
| **Git** | `>= 2.30` | Latest | For source management |

---

## Environment Configuration

### Backend Environment Variables (`server/.env`)

Create a `.env` file inside the `server/` directory:

```bash
# ==============================================================================
# SERVER & APP CONFIGURATION
# ==============================================================================
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# ==============================================================================
# DATABASE & STORAGE
# Leave MONGODB_URI blank or omit to use the built-in in-memory Mongo fallback
# ==============================================================================
MONGODB_URI=mongodb://localhost:27017/agentflow_ai

# ==============================================================================
# REDIS & BULLMQ QUEUE
# Leave REDIS_HOST blank to use the built-in in-memory Queue fallback
# ==============================================================================
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# ==============================================================================
# SECURITY & AUTHENTICATION
# ==============================================================================
JWT_SECRET=super_secret_jwt_signing_key_at_least_32_characters_long_min
JWT_EXPIRES_IN=7d

# AES-256 32-byte secret key (hex or string) for encrypting OAuth tokens at rest
CREDENTIAL_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# ==============================================================================
# AI PROVIDERS (Workflow Generation & AI Nodes)
# ==============================================================================
# Primary AI generator
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Secondary fallback AI generator
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ==============================================================================
# OAUTH INTEGRATION CREDENTIALS (Optional for local testing)
# ==============================================================================
# Google (Gmail & Sheets)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/integrations/oauth/google/callback

# Slack
SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_REDIRECT_URI=http://localhost:5000/api/integrations/oauth/slack/callback

# Discord
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_BOT_TOKEN=your-discord-bot-token
DISCORD_REDIRECT_URI=http://localhost:5000/api/integrations/oauth/discord/callback
```

### Frontend Environment Variables (`client/.env.local`)

Create a `.env.local` file inside the `client/` directory:

```bash
# Backend REST API endpoint
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Backend Socket.IO real-time server endpoint
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Database Setup & Collections

The application uses **MongoDB** via **Mongoose**. If no external MongoDB instance is running, the backend automatically initializes an in-memory MongoDB instance (`mongodb-memory-server`) to enable instant local setup without configuration.

### Collections Overview

1. **`Users`**: Holds operator and admin accounts.
   - Fields: `name`, `email`, `password` (hashed with bcrypt cost 12, hidden via `select: false`), `role` (`admin` | `operator`), `lastLogin`, `createdAt`.
2. **`Workflows`**: Workflow definitions and topologies.
   - Fields: `name`, `description`, `owner` (ref User), `status` (`draft` | `active` | `paused` | `archived`), `triggerConfig`, `nodes` (array of React Flow nodes), `edges` (array of React Flow edges), `version` (integer), `tags` (array).
3. **`Executions`**: Immutable records of execution runs.
   - Fields: `workflowId`, `snapshot` (frozen copy of workflow at trigger time), `status` (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `RETRYING`, `PAUSED`, `CANCELLED`), `currentNode`, `startTime`, `endTime`, `duration`, `inputs`, `outputs`, `error`, `retryCount`.
4. **`ExecutionLogs`**: Granular multi-agent telemetry events.
   - Fields: `executionId`, `workflowId`, `nodeId`, `agent` (`planner`, `execution`, `validation`, `recovery`, `monitoring`), `level` (`info`, `warning`, `error`, `success`), `message`, `metadata`, `timestamp`.
5. **`Integrations`**: Connected third-party OAuth integrations.
   - Fields: `owner` (ref User), `provider` (`gmail`, `slack`, `google-sheets`, `discord`, `openrouter`, `gemini`), `isConnected` (boolean), `scopes` (array), `encryptedTokens` (AES-256 encrypted access & refresh tokens), `expiresAt`.
6. **`Notifications`**: Real-time alerts and escalations.
   - Fields: `owner` (ref User), `workflowId`, `executionId`, `type` (`info`, `warning`, `error`, `success`), `title`, `message`, `isRead`.

### Seeding Default Admin & Workflows (Optional)

If a seed script is provided in the repository:

```bash
cd server
npm run seed
```

*Default Seed Credentials:*
- **Email**: `admin@agentflow.ai`
- **Password**: `Admin@123456`
- **Role**: `admin`

---

## Local Installation & Quickstart

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/agentflow_ai.git
cd "project folder"
```

### 2. Backend Setup & Startup

```bash
# Navigate to server
cd server

# Install server dependencies
npm install

# Verify/Create environment file
cp .env.example .env

# Run in Development Mode (Nodemon with Hot Reload)
npm run dev

# Or run in Production Mode
npm start
```
*Backend runs on `http://localhost:5000` with WebSocket support.*

### 3. Frontend Setup & Startup

Open a new terminal window:

```bash
# Navigate to client
cd client

# Install client dependencies
npm install

# Verify/Create environment file
cp .env.example .env.local

# Run Next.js Development Server
npm run dev

# Or build for Production
npm run build
npm start
```
*Frontend will be accessible at `http://localhost:3000`.*

### 4. Concurrent Development Mode

If a root `package.json` with `concurrently` is configured:

```bash
# From the project root
npm run dev
```

---

## Frontend Application Routing

The application utilizes the **Next.js Pages Router** with built-in route protection and persistent auth state via Zustand:

| Route | Page Component | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `/` | `pages/index.js` | Public | Platform landing page, multi-agent showcase, features, and CTA. Redirects authenticated users to `/dashboard`. |
| `/login` | `pages/login.js` | Public | Operator sign-in with JWT issuance, error handling, and redirect to dashboard. |
| `/register` | `pages/register.js` | Public | User registration with password validation and automatic session creation. |
| `/dashboard` | `pages/dashboard.js` | Protected | Operator console with `MetricGrid`, active workflow stats, recent execution overview, and AI activity feed. |
| `/workflows/builder` | `pages/workflows/builder.js` | Protected | Prompt-to-workflow AI generator with PromptInputPanel, GraphPreviewPanel, and React Flow canvas. |
| `/workflows/[id]` | `pages/workflows/[id].js` | Protected | Full visual workflow builder: NodePalette on left, React Flow canvas in center, and NodeConfigPanel on right. |
| `/executions` | `pages/executions/index.js` | Protected | Execution history table with live status badges, duration, pagination, and real-time Socket.IO updates. |
| `/executions/[id]` | `pages/executions/[id].js` | Protected | Execution inspect view: frozen graph playback, agent timeline logs, and pause/resume/cancel controls. |
| `/integrations` | `pages/integrations.js` | Protected | OAuth manager for Gmail, Slack, Discord, and Google Sheets with status toggles and reconnect buttons. |
| `/settings` | `pages/settings.js` | Protected | Profile editor, role badge, API key health check, encryption key validation, and UI theme toggles. |

---

## API Reference & Test Commands

Use the following `curl` commands to test and interact with the backend API. Replace `$TOKEN` with your issued JWT token.

### 1. Health & Authentication

#### Check Health Status
```bash
curl -X GET http://localhost:5000/api/health \
  -H "Content-Type: application/json"
```
*Response (`200 OK`):*
```json
{
  "status": "healthy",
  "timestamp": "2026-08-26T13:00:00.000Z",
  "services": {
    "database": "connected (mongodb)",
    "redis": "connected",
    "socket": "active",
    "langGraph": "available"
  }
}
```

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Operator One",
    "email": "operator@agentflow.ai",
    "password": "Password123!"
  }'
```

#### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "operator@agentflow.ai",
    "password": "Password123!"
  }'
```
*Response (`200 OK`):*
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f81234abcd5678ef901234",
    "name": "Operator One",
    "email": "operator@agentflow.ai",
    "role": "operator"
  }
}
```

#### Get Current Profile
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

### 2. Workflows Management & AI Generation

#### Get Dashboard Statistics
```bash
curl -X GET http://localhost:5000/api/workflows/dashboard \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Generate Workflow from Natural Language Prompt
```bash
curl -X POST http://localhost:5000/api/workflows/generate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "When a new customer email arrives in Gmail, analyze sentiment with AI, append a row to Google Sheets, and post a Slack alert if sentiment is negative."
  }'
```
*Response (`200 OK`):*
```json
{
  "workflow": {
    "name": "Gmail Sentiment & Slack Alert Flow",
    "description": "Automated workflow generated from natural language prompt",
    "nodes": [
      { "id": "node-1", "type": "trigger_gmail", "position": { "x": 100, "y": 100 }, "data": { "label": "Gmail Trigger" } },
      { "id": "node-2", "type": "ai_sentiment", "position": { "x": 350, "y": 100 }, "data": { "label": "Analyze Sentiment" } },
      { "id": "node-3", "type": "sheets_append", "position": { "x": 600, "y": 50 }, "data": { "label": "Append to Sheets" } },
      { "id": "node-4", "type": "slack_message", "position": { "x": 600, "y": 200 }, "data": { "label": "Slack Alert" } }
    ],
    "edges": [
      { "id": "e1-2", "source": "node-1", "target": "node-2" },
      { "id": "e2-3", "source": "node-2", "target": "node-3" },
      { "id": "e2-4", "source": "node-2", "target": "node-4" }
    ]
  },
  "provider": "openrouter"
}
```

#### Create Workflow Manually
```bash
curl -X POST http://localhost:5000/api/workflows \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Triage",
    "description": "Routes support inquiries to Slack channels",
    "nodes": [
      {
        "id": "1",
        "type": "trigger_webhook",
        "position": { "x": 250, "y": 5 },
        "data": { "label": "Webhook Trigger" }
      },
      {
        "id": "2",
        "type": "action_slack",
        "position": { "x": 250, "y": 150 },
        "data": { "label": "Post to #support" }
      }
    ],
    "edges": [
      { "id": "e1-2", "source": "1", "target": "2" }
    ],
    "tags": ["support", "slack"]
  }'
```

#### List Workflows
```bash
curl -X GET "http://localhost:5000/api/workflows?page=1&limit=10&search=support" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Fetch Single Workflow
```bash
curl -X GET http://localhost:5000/api/workflows/<WORKFLOW_ID> \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Update Workflow
```bash
curl -X PUT http://localhost:5000/api/workflows/<WORKFLOW_ID> \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Triage v2",
    "status": "active"
  }'
```

#### Duplicate Workflow
```bash
curl -X POST http://localhost:5000/api/workflows/<WORKFLOW_ID>/duplicate \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Trigger Workflow Execution
```bash
curl -X POST http://localhost:5000/api/workflows/<WORKFLOW_ID>/execute \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "inputs": {
      "customerEmail": "customer@example.com",
      "message": "Urgent: payment processing failed"
    }
  }'
```

#### Delete Workflow
```bash
curl -X DELETE http://localhost:5000/api/workflows/<WORKFLOW_ID> \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

### 3. Execution Engine & Controls

#### List Executions
```bash
curl -X GET "http://localhost:5000/api/executions?page=1&limit=20&status=COMPLETED" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Fetch Execution Details & Frozen Snapshot
```bash
curl -X GET http://localhost:5000/api/executions/<EXECUTION_ID> \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Fetch Agent Timeline Logs
```bash
curl -X GET http://localhost:5000/api/executions/<EXECUTION_ID>/timeline \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```
*Response (`200 OK`):*
```json
[
  {
    "agent": "planner",
    "level": "info",
    "message": "Topological order resolved: [node-1, node-2, node-3]. Confidence: 0.98",
    "timestamp": "2026-08-26T13:05:01.120Z"
  },
  {
    "agent": "execution",
    "level": "info",
    "nodeId": "node-1",
    "message": "Trigger node evaluated with payload id=msg_101",
    "timestamp": "2026-08-26T13:05:01.350Z"
  },
  {
    "agent": "validation",
    "level": "success",
    "nodeId": "node-1",
    "message": "Required fields [sender, body] verified successfully",
    "timestamp": "2026-08-26T13:05:01.400Z"
  },
  {
    "agent": "monitoring",
    "level": "info",
    "message": "Execution progress: 33% complete",
    "timestamp": "2026-08-26T13:05:01.450Z"
  }
]
```

#### Pause Running Execution
```bash
curl -X POST http://localhost:5000/api/executions/<EXECUTION_ID>/pause \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Resume Paused Execution
```bash
curl -X POST http://localhost:5000/api/executions/<EXECUTION_ID>/resume \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Cancel Execution
```bash
curl -X POST http://localhost:5000/api/executions/<EXECUTION_ID>/cancel \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

### 4. Integrations & Notifications

#### List Configured Integrations
```bash
curl -X GET http://localhost:5000/api/integrations \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Check Provider Health & Token Validity
```bash
curl -X GET http://localhost:5000/api/integrations/status \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

#### Start OAuth Flow
Open in browser or query endpoint:
```
GET http://localhost:5000/api/integrations/oauth/gmail/start
GET http://localhost:5000/api/integrations/oauth/slack/start
GET http://localhost:5000/api/integrations/oauth/discord/start
GET http://localhost:5000/api/integrations/oauth/google-sheets/start
```

#### Manual Integration Setup (API Key / Bot Token)
```bash
curl -X POST http://localhost:5000/api/integrations \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "discord",
    "credentials": {
      "botToken": "Bot MTA5OT..."
    }
  }'
```

#### List Notifications
```bash
curl -X GET http://localhost:5000/api/notifications \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

---

## Third-Party Integrations & OAuth Setup

### 1. Google (Gmail & Google Sheets)
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project and enable the **Gmail API** and **Google Sheets API**.
3. Configure the **OAuth Consent Screen** and add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/spreadsheets`
4. Create an **OAuth 2.0 Client ID** (Web application):
   - Authorized redirect URI: `http://localhost:5000/api/integrations/oauth/google/callback`
5. Copy `Client ID` and `Client Secret` to `server/.env`.

### 2. Slack
1. Go to [Slack API: Your Apps](https://api.slack.com/apps) and create a new App.
2. Under **OAuth & Permissions**, add Redirect URL:
   - `http://localhost:5000/api/integrations/oauth/slack/callback`
3. Add Bot Scopes: `chat:write`, `channels:read`, `incoming-webhook`.
4. Copy `Client ID` and `Client Secret` to `server/.env`.

### 3. Discord
1. Go to [Discord Developer Portal](https://discord.com/developers/applications).
2. Create an Application and add a Bot.
3. Under **OAuth2**, add Redirect URI:
   - `http://localhost:5000/api/integrations/oauth/discord/callback`
4. Under **Bot**, enable privileged intents (if required) and copy the `Token`.
5. Populate `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, and `DISCORD_BOT_TOKEN` in `server/.env`.

---

## Security & Production Hardening

- **Password Hashing**: Bcrypt with cost factor 12. Passwords are never returned in queries (`select: false`).
- **Token Encryption at Rest**: Sensitive OAuth access/refresh tokens are encrypted using **AES-256** with `CREDENTIAL_ENCRYPTION_KEY`. Decrypted keys exist only in memory during execution.
- **HTTP Security Headers**: Enforced across all endpoints via `helmet`.
- **CORS Protection**: Access is restricted strictly to the configured `CLIENT_URL`.
- **Rate Limiting**: Auth endpoints are protected with `express-rate-limit` against brute-force attacks.
- **Request Validation**: All request bodies are strictly validated with `express-validator`.
- **Graceful Error Handling**: Missing/expired credentials return explicit errors (`INTEGRATION_NOT_CONNECTED` or `AUTH_EXPIRED`) with actionable remediation steps rather than generic 500 crashes.

---

## Troubleshooting & FAQ

### 1. MongoDB Connection Warning / In-Memory Fallback
- **Behavior**: If `MONGODB_URI` is unreachable or unconfigured, the server logs:
  `[Database] Local/remote MongoDB not detected. Starting in-memory Mongo instance...`
- **Fix**: To persist data permanently across restarts, ensure a local MongoDB instance is running (`mongod`) or provide a valid MongoDB Atlas connection string in `server/.env`.

### 2. Redis Connection Warning / Queue Fallback
- **Behavior**: If Redis is not running on `localhost:6379`, the server will switch to the synchronous in-memory queue fallback.
- **Fix**: For production queue workers, install Redis (`brew install redis` or `sudo apt install redis-server`) and run `redis-server`.

### 3. AI Generation Returning Deterministic Fallback Workflows
- **Reason**: Both `OPENROUTER_API_KEY` and `GEMINI_API_KEY` are missing or invalid in `server/.env`.
- **Fix**: Add a valid OpenRouter or Gemini API key. The deterministic engine will still build standard flows (email, Slack, Sheets) for common prompts without external API access.

### 4. OAuth Redirect URI Mismatch
- **Fix**: Ensure the callback URI configured in your Google, Slack, or Discord developer consoles matches `http://localhost:5000/api/integrations/oauth/<provider>/callback` precisely.

---

## Development Phases

The platform is engineered across 6 foundational development phases:

- **Phase 1: Project Setup & Auth**
  - Next.js Pages router, Express backend, MongoDB connection with in-memory fallback, JWT authentication, Zustand auth store, and `AppShell` operator layout.
- **Phase 2: Visual Workflow Canvas & CRUD**
  - React Flow canvas integration, node palette, custom node components, right-hand node configuration panel, workflow CRUD, duplication, and versioning.
- **Phase 3: AI Prompt-to-Workflow Engine**
  - OpenRouter primary integration, Google Gemini fallback, and deterministic rule engine fallback for prompt-based graph synthesis.
- **Phase 4: Multi-Agent Orchestration Substrate**
  - Implementation of Planner, Execution, Validation, Recovery, and Monitoring agents with execution lifecycle controls (pause, resume, cancel).
- **Phase 5: OAuth Integrations & Credential Encryption**
  - Third-party connectors (Gmail, Slack, Discord, Google Sheets) and AES-256 token encryption at rest.
- **Phase 6: BullMQ Queues & Real-Time Event Streaming**
  - BullMQ background job processing, Socket.IO live execution telemetry streaming, and notification drawer.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
