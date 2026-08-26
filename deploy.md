# Agentflow AI Deployment

This project uses:

- **Render** for the Node/Express backend in `server/`
- **Vercel** for the Next.js frontend in `client/`
- **MongoDB Atlas** for MongoDB
- **Render Redis** or another hosted Redis provider for BullMQ

## 1. Prepare and push the repository

Run these commands from the project root:

```powershell
git init
git add .
git commit -m "Prepare project for deployment"
git branch -M main
```

Create an empty repository on GitHub, then connect and push it:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Replace the URL with your repository URL. Confirm that no `.env` file or secret appears in the commit before pushing.

## 2. Create production data services

### MongoDB Atlas

1. Create a MongoDB Atlas cluster and database user.
2. Add `0.0.0.0/0` to Network Access temporarily, or restrict access to your provider's egress IPs when available.
3. Copy the application connection string. Replace its database name with your desired database name.

### Redis

Create a hosted Redis instance. For Render, use a Render Redis/Key Value instance if available for your account. Record its host, port, and password. BullMQ requires Redis connectivity for execution queues.

## 3. Deploy the backend on Render

Create a **Web Service** from the GitHub repository with these settings:

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Region | Choose the region closest to your users and data services |

Render provides the `PORT` variable automatically. Add the other values in **Environment**:

```text
NODE_ENV=production
CLIENT_URL=https://YOUR-FRONTEND.vercel.app
MONGODB_URI=YOUR_MONGODB_ATLAS_CONNECTION_STRING
REDIS_HOST=YOUR_REDIS_HOST
REDIS_PORT=YOUR_REDIS_PORT
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
JWT_SECRET=GENERATE_A_LONG_RANDOM_SECRET
JWT_EXPIRES_IN=7d
CREDENTIAL_ENCRYPTION_KEY=64_HEX_CHARACTERS
OPENROUTER_API_KEY=YOUR_OPENROUTER_KEY
GEMINI_API_KEY=YOUR_GEMINI_KEY
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://YOUR-RENDER-SERVICE.onrender.com/api/integrations/oauth/google/callback
SLACK_CLIENT_ID=YOUR_SLACK_CLIENT_ID
SLACK_CLIENT_SECRET=YOUR_SLACK_CLIENT_SECRET
SLACK_REDIRECT_URI=https://YOUR-RENDER-SERVICE.onrender.com/api/integrations/oauth/slack/callback
DISCORD_CLIENT_ID=YOUR_DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET=YOUR_DISCORD_CLIENT_SECRET
DISCORD_BOT_TOKEN=YOUR_DISCORD_BOT_TOKEN
DISCORD_REDIRECT_URI=https://YOUR-RENDER-SERVICE.onrender.com/api/integrations/oauth/discord/callback
```

Use real values for integrations you enable. Generate `JWT_SECRET` and `CREDENTIAL_ENCRYPTION_KEY`; do not use the fallback values in `server/src/config/env.js`.

After deployment, verify:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

The response should report `"status":"healthy"`.

## 4. Deploy the frontend on Vercel

Import the same GitHub repository into Vercel and set:

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework Preset | `Next.js` |
| Build Command | `npm run build` |
| Install Command | `npm install` |

Add these Vercel environment variables for **Production**, **Preview**, and **Development** as needed:

```text
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
NEXT_PUBLIC_SOCKET_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Redeploy after adding or changing these values because Next.js embeds `NEXT_PUBLIC_*` variables during the build.

## 5. Finish CORS and OAuth configuration

1. Copy the final Vercel URL into Render's `CLIENT_URL` value.
2. Redeploy the backend after changing `CLIENT_URL`.
3. Add the Render callback URLs from the backend environment variables to each provider's OAuth application settings.
4. If Vercel assigns a custom domain, use that domain as `CLIENT_URL` and in the provider settings.

## 6. Smoke test

1. Open the Vercel URL.
2. Register a user and log in.
3. Create and execute a workflow.
4. Confirm live execution updates work through Socket.IO.
5. Check Render logs and `/api/health` if anything fails.

## Updating deployments

```powershell
git add .
git commit -m "Describe the change"
git push origin main
```

Render and Vercel can be configured to redeploy automatically whenever `main` changes.