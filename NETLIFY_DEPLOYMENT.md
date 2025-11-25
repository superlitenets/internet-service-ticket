# Deploy to Netlify with Neon Database

Your Neon database is ready. Now deploy your app to Netlify with the database connected.

## Your Neon Connection Details ✅

```
Host: ep-sparkling-tooth-aebroj6x-pooler.c-2.us-east-2.aws.neon.tech
Database: neondb
User: neondb_owner
Connection String: postgresql://neondb_owner:npg_ViST2FI7EJsd@ep-sparkling-tooth-aebroj6x-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## Deployment Options

### Option 1: Frontend Only on Netlify (Simple)
✅ **Recommended if**: You want to get running quickly
- Deploy React frontend to Netlify
- Run backend separately (local machine or separate service)
- Good for testing

**Pros**: Simple, quick
**Cons**: Backend must be running somewhere

### Option 2: Full Stack (Frontend + Backend)
✅ **Recommended if**: You want a complete production setup
- Deploy frontend to Netlify
- Deploy backend to Railway.app
- Database: Neon (already set up)

**Pros**: Fully hosted, scalable
**Cons**: Requires second service

---

## Option 1: Frontend Only Deployment

### Step 1: Build Your App
```bash
pnpm build:client
```

This creates `dist/spa/` folder with your built React app.

### Step 2: Deploy to Netlify

**Method A: Using Netlify CLI**
```bash
# Install if not already installed
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist/spa
```

**Method B: Using Netlify Dashboard (Recommended)**

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose your GitHub repository
4. Fill in build settings:
   - **Build command**: `pnpm install && pnpm build:client`
   - **Publish directory**: `dist/spa`
5. Click "Deploy site"

### Step 3: Start Backend Locally
Run this in your local machine to provide APIs:

```bash
pnpm exec tsx server/index.ts
```

**Problem**: When you close your terminal, APIs stop working.

**Solution**: Keep your terminal running during development, OR use Option 2.

---

## Option 2: Full Stack Deployment (Recommended)

### Part 1: Deploy Backend to Railway.app

#### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up (or log in)
3. Create a new project

#### Step 2: Connect Your GitHub Repository
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Select your GitHub repository
4. Click "Deploy"

#### Step 3: Configure Backend Service
Railway will auto-detect Node.js. Configure it:

1. Click on your deployment → **Variables**
2. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_ViST2FI7EJsd@ep-sparkling-tooth-aebroj6x-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

3. Click on your deployment → **Settings**
4. Set build command: `pnpm install && pnpm build:server`
5. Set start command: `node dist/server/production.mjs`

#### Step 4: Get Your Railway App URL
Once deployed:
1. Go to your Railway project
2. Look for the "Deployments" tab
3. Find the service URL (looks like `https://your-app-abc123.railway.app`)
4. Copy it

### Part 2: Deploy Frontend to Netlify

#### Step 1: Update Environment Variable
Add your backend URL to Netlify:

1. Go to https://app.netlify.com
2. Select your site
3. Go to **Site settings** → **Build & deploy** → **Environment**
4. Add new variable:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-railway-app.railway.app`

#### Step 2: Configure Build Settings
1. Go to **Builds & deploys** → **Build settings**
2. Set:
   - **Build command**: `pnpm install && pnpm build`
   - **Publish directory**: `dist/spa`

#### Step 3: Rebuild & Deploy
1. Go to **Deploys**
2. Click **Trigger deploy** → **Deploy site**

---

## Testing Your Deployment

### Test Database Connection
```bash
# Check if backend is running
curl https://your-railway-app.railway.app/api/test/health

# Response should be:
# {"success":true,"message":"Database connection successful",...}
```

### Test Frontend
```bash
# Open your Netlify site
https://your-netlify-site.netlify.app

# Should load without errors
```

### Create Test Data
```bash
# Create a test user
curl -X POST https://your-railway-app.railway.app/api/test/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"1234567890","name":"Test User"}'

# List users
curl https://your-railway-app.railway.app/api/test/users
```

---

## Your Current Netlify Site

You mentioned your app is already on Netlify. To connect the database:

1. **If it's frontend only**:
   - Go to your Netlify site settings
   - Add environment variable: `VITE_API_URL=https://your-backend-url.com`
   - Rebuild the site

2. **If it has functions**:
   - You need to migrate your Express routes to Netlify functions (complex)
   - Better to use Option 2 (Railway + Netlify)

---

## Quick Summary

| Step | Service | Command |
|------|---------|---------|
| 1 | Neon | Connection string set ✅ |
| 2 | Railway | Deploy backend: `pnpm build:server` |
| 3 | Netlify | Deploy frontend: `pnpm build` |
| 4 | Netlify Env | Set `VITE_API_URL=https://railway-app-url` |
| 5 | Test | `curl your-netlify-site/api/test/health` |

---

## Environment Variables Checklist

### Railway (Backend)
```
DATABASE_URL=postgresql://neondb_owner:npg_ViST2FI7EJsd@ep-sparkling-tooth-aebroj6x-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
NODE_ENV=production
```

### Netlify (Frontend)
```
VITE_API_URL=https://your-railway-app.railway.app
NODE_ENV=production
```

---

## Troubleshooting

### "Cannot GET /api/*"
- Frontend is deployed but backend is not running
- Check that Railway app is deployed and running
- Verify `VITE_API_URL` is set correctly

### "Connection refused"
- Database connection string is wrong
- Check DATABASE_URL in Railway environment variables
- Verify Neon database is running

### "Build failed on Netlify"
- Check build logs in Netlify dashboard
- Ensure `pnpm` is installed: `pnpm install`
- Check all dependencies are in `package.json`

---

## Next Steps

1. **Choose your deployment option** (Option 1 or 2)
2. **Deploy backend** (if Option 2)
3. **Deploy frontend** to Netlify
4. **Test the connection** with curl
5. **Celebrate** 🎉

Need help with a specific step? Ask!
