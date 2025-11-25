# Quick Neon Setup

Your code is now configured for Neon PostgreSQL. Follow these steps to get it working:

## Step 1: Get Your Neon Connection String (2 min)

1. Go to https://console.neon.tech
2. Log in to your account
3. Select your project (or create one)
4. Click **Databases** on the left
5. Click your database name (usually `neondb`)
6. Click **Connection** (top right button)
7. Select **Prisma** from the dropdown
8. **Copy the entire connection string** (looks like):
   ```
   postgresql://user:password@ep-XXXXXXXX.neon.tech/dbname?sslmode=require
   ```

## Step 2: Update Your `.env` File (1 min)

Replace the placeholder in `.env`:

```env
# Remove the old line:
# DATABASE_URL="postgresql://user:password@ep-XXXX.neon.tech/dbname?sslmode=require"

# Replace with your actual Neon connection string from Step 1:
DATABASE_URL=postgresql://user:password@ep-XXXXXXXX.neon.tech/dbname?sslmode=require

NODE_ENV=development
PORT=9000
```

⚠️ **Important**: Do NOT commit `.env` to git (it contains secrets)

## Step 3: Test Connection Locally (2 min)

### Terminal 1: Start Backend
```bash
pnpm exec tsx server/index.ts
```

### Terminal 2: Test Database
```bash
# Check if database is connected
curl http://localhost:9000/api/test/health

# Should return:
# {"success":true,"message":"Database connection successful","databaseStatus":"connected","stats":{"totalUsers":0}}
```

## Step 4: Create Test Data (optional)

```bash
# Create a test user
curl -X POST http://localhost:9000/api/test/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"1234567890","name":"Test User"}'

# List test users
curl http://localhost:9000/api/test/users

# Delete test users
curl -X DELETE http://localhost:9000/api/test/users
```

## Step 5: Deploy to Netlify

### Option A: Frontend Only (Easiest)

```bash
# Build frontend
pnpm build:client

# Deploy to Netlify
netlify deploy --prod --dir=dist/spa
```

**Note**: APIs won't work unless you have a backend running elsewhere.

### Option B: Full Stack (Requires Backend Service)

1. **Deploy Backend First**
   - Push code to GitHub
   - Deploy to [Railway.app](https://railway.app) (easiest):
     - Connect GitHub repo
     - Set build: `pnpm install && pnpm build:server`
     - Set start: `node dist/server/production.mjs`
     - Add `DATABASE_URL` environment variable with your Neon string
   
2. **Deploy Frontend to Netlify**
   - Build: `pnpm build`
   - Deploy `dist/spa` folder
   - Add environment variable: `VITE_API_URL=https://your-railway-app.railway.app`

## Verify It Works

After deployment, test these endpoints:

```bash
# Check database connection
curl https://your-netlify-site.netlify.app/api/test/health

# If backend is deployed separately:
curl https://your-backend-url.com/api/test/health
```

## Troubleshooting

### "Connection refused"
- Verify Neon connection string is correct
- Check that the string includes `?sslmode=require`
- Go to Neon console and verify database is running

### "relation does not exist"
- Migrations haven't run yet
- Locally: Run `pnpm prisma migrate deploy`
- On Railway: Migrations run automatically during deploy

### "Client not found"
- Run `pnpm prisma generate` to create Prisma client

### Port 9000 Already in Use
- Change `PORT` in `.env` to something else (e.g., 3000)

## What Was Changed

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Provider: `mysql` → `postgresql` |
| `.env` | Database URL updated for Neon |
| `prisma/migrations/` | Migration updated for PostgreSQL syntax |
| `server/routes/test.ts` | ✨ NEW: Test endpoints to verify data saving |
| `server/index.ts` | Added test route imports and registrations |

## Next Steps

- ✅ Set up Neon database
- ✅ Get connection string
- ✅ Update `.env`
- ✅ Test locally with `/api/test/health`
- Deploy to Netlify/Railway
- Test end-to-end with real data

## Need Help?

- Neon docs: https://neon.tech/docs
- Netlify docs: https://docs.netlify.com/
- Railway docs: https://docs.railway.app/

Your app is ready to go! 🚀
