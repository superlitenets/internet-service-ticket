# Neon Database + Netlify Deployment Guide

This guide shows how to set up Neon (PostgreSQL) as your database and deploy to Netlify.

## Step 1: Create a Neon Database

### 1.1 Sign Up for Neon
- Visit [neon.tech](https://neon.tech)
- Sign up or log in
- Create a new project

### 1.2 Get Your Connection String
1. Go to your Neon project dashboard
2. Click **Databases** (left sidebar)
3. Click on your database name (e.g., `neondb`)
4. Copy the **Connection string - Prisma** format:
   ```
   postgresql://user:password@ep-XXXX.neon.tech/dbname?sslmode=require
   ```

### 1.3 Update Your `.env` File
Replace `DATABASE_URL` with your Neon connection string:

```env
DATABASE_URL=postgresql://user:password@ep-XXXX.neon.tech/dbname?sslmode=require
NODE_ENV=production
PORT=9000
```

## Step 2: Initialize Database Schema

### 2.1 Run Migrations Locally
Ensure Prisma is configured for PostgreSQL (it is by default now):

```bash
# Update Prisma client
pnpm prisma generate

# Run migrations on Neon
pnpm prisma migrate deploy
```

This creates all tables in your Neon database.

### 2.2 Verify Database Setup
Check that tables were created:

```bash
# Via Neon Console
# Visit https://console.neon.tech → SQL Editor → Run query:
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

## Step 3: Deploy to Netlify

### 3.1 Deployment Options

Your application has two parts:
- **Frontend** (React/Vite) → Deploy to Netlify
- **Backend** (Express) → Requires separate backend hosting

#### Option A: Frontend Only on Netlify (Recommended for Quick Start)

Deploy just the built frontend to Netlify:

```bash
# Build the frontend
pnpm build:client

# Deploy to Netlify
netlify deploy --prod --dir=dist/spa
```

The frontend will be served, but APIs won't work unless you have a backend running elsewhere.

#### Option B: Full Stack with Separate Backend Service

Deploy the backend to a service like:
- **Railway** (recommended, $5/month)
- **Render** (free tier available)
- **Heroku** (paid, but reliable)
- **Fly.io** (free tier)

Then update your frontend to call the backend API:

```typescript
// client/lib/api.ts
const API_BASE = process.env.VITE_API_URL || 'http://localhost:9000';

export async function fetchApi(endpoint: string) {
  return fetch(`${API_BASE}/api${endpoint}`);
}
```

Update `.env`:
```env
VITE_API_URL=https://your-backend-service.com
```

#### Option C: Netlify Functions (Advanced)

Rewrite backend endpoints as Netlify Functions in `netlify/functions/api.js`.
This requires significant code changes - not recommended for this project.

### 3.2 Deploy Frontend to Netlify

#### Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build your project
pnpm build

# Deploy
netlify deploy --prod --dir=dist/spa
```

#### Via GitHub (Recommended)

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "New site from Git"
4. Select your GitHub repository
5. Set build command: `pnpm install && pnpm build:client`
6. Set publish directory: `dist/spa`
7. Add environment variables:
   - `NODE_ENV`: `production`
8. Click "Deploy site"

### 3.3 Set Environment Variables on Netlify

If you need backend APIs, set them in Netlify Site Settings:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add variables:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

## Step 4: Test Data Saving

### 4.1 Create a Test API Endpoint

Add a test endpoint in `server/routes/test.ts`:

```typescript
import { db } from "../lib/db";

export async function createTestUser(req: any, res: any) {
  try {
    const user = await db.user.create({
      data: {
        id: "test-" + Date.now(),
        email: "test@example.com",
        phone: "1234567890",
        password: "hashed_password",
        name: "Test User",
      },
    });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getTestUsers(req: any, res: any) {
  try {
    const users = await db.user.findMany();
    res.json({ success: true, count: users.length, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

Register in `server/index.ts`:

```typescript
import { createTestUser, getTestUsers } from "./routes/test";

app.post("/api/test/users", createTestUser);
app.get("/api/test/users", getTestUsers);
```

### 4.2 Test Locally

```bash
# Terminal 1: Frontend
pnpm run dev

# Terminal 2: Backend
pnpm exec tsx server/index.ts

# Terminal 3: Test API
curl -X POST http://localhost:9000/api/test/users

curl http://localhost:9000/api/test/users
```

### 4.3 Verify in Neon

Check that data was saved:

```bash
# Via Neon Console SQL Editor
SELECT * FROM "User";
```

## Step 5: Deploy Backend (If Needed)

### Option 1: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Create a new project
4. Select Node.js from the template
5. Set environment variables:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: Your Neon connection string
6. Set start command: `pnpm build:server && node dist/server/production.mjs`
7. Deploy

### Option 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Click "New Web Service"
3. Connect your GitHub repo
4. Set build command: `pnpm install && pnpm build:server`
5. Set start command: `node dist/server/production.mjs`
6. Add environment variables
7. Deploy

## Architecture Overview

```
┌─────────────────────┐
│   Netlify (SPA)     │ ← Frontend (React/Vite)
│   dist/spa/         │
└──────────┬──────────┘
           │ API calls to
           │
    ┌──────▼─────────────┐
    │  Backend Service   │ ← Express.js
    │  Railway/Render    │
    └──────┬─────────────┘
           │ Database queries
           │
┌──────────▼──────────┐
│ Neon PostgreSQL     │ ← Database
│ (Serverless)        │
└─────────────────────┘
```

## Environment Variables

### Local Development (`.env`)
```env
NODE_ENV=development
PORT=9000
DATABASE_URL=postgresql://user:password@localhost:5432/netflow
```

### Netlify (Frontend only)
```env
NODE_ENV=production
VITE_API_URL=https://your-backend.com
```

### Backend Service (Railway/Render)
```env
NODE_ENV=production
PORT=9000
DATABASE_URL=postgresql://user:password@ep-XXXX.neon.tech/netflow?sslmode=require
```

## Troubleshooting

### "Connection refused" Error
- Verify Neon connection string is correct
- Check that `?sslmode=require` is in the URL
- Ensure Neon database is running (check Neon console)

### "relation does not exist" Error
- Run migrations: `pnpm prisma migrate deploy`
- Check that migrations applied successfully

### Frontend API Calls Fail
- Check `VITE_API_URL` environment variable
- Verify backend service is running and accessible
- Check CORS settings in `server/index.ts`

### Prisma Client Errors
- Regenerate client: `pnpm prisma generate`
- Update `@prisma/client`: `pnpm add @prisma/client@latest`

## Next Steps

1. ✅ Connect to Neon database
2. ✅ Update `.env` with Neon connection string
3. ✅ Run `pnpm prisma migrate deploy`
4. ✅ Test data saving locally
5. Deploy frontend to Netlify
6. Deploy backend to Railway/Render (if using full backend)
7. Update `VITE_API_URL` in environment variables
8. Test end-to-end functionality

## Resources

- [Neon Documentation](https://neon.tech/docs)
- [Prisma + Neon Guide](https://www.prisma.io/docs/getting-started/setup-prisma/add-to-existing-project/relational-databases/connect-your-database-typescript-postgres)
- [Netlify Deployment Guide](https://docs.netlify.com/)
- [Railway Documentation](https://docs.railway.app/)
- [Render Documentation](https://render.com/docs)
