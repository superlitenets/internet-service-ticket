# Development Guide

## Local Development Setup

This project uses a split development model: the **frontend runs via Vite**, and the **backend runs separately** via Node.js.

### Prerequisites

- Node.js 18+ and pnpm installed
- MySQL 8.0+ running locally (or via Docker)
- `.env` file configured with `DATABASE_URL`

## Running Locally (Without Docker)

### Terminal 1: Start Frontend (Vite)

```bash
pnpm install
pnpm run dev
```

The frontend will be available at: `http://localhost:5173`

### Terminal 2: Start Backend (Express)

```bash
# Using tsx (TypeScript runner)
pnpm exec tsx server/index.ts

# Or build first
pnpm build:server
node dist/server/production.mjs
```

The API endpoints will be available at: `http://localhost:9000/api/*`

### Environment Variables

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=9000

# Database (MySQL)
DATABASE_URL=mysql://netflow_user:secure_password@localhost:3306/netflow_db

# Or individual settings
DB_HOST=localhost
DB_PORT=3306
DB_NAME=netflow_db
DB_USER=netflow_user
DB_PASSWORD=secure_password
```

### Database Setup

Before running the app, ensure your MySQL database is created:

```bash
# Create database
mysql -u root -p < database/schema.sql

# Run Prisma migrations
pnpm prisma migrate deploy
```

## Running with Docker Compose

### Start All Services

```bash
docker-compose up -d
```

This will:
- ✅ Start MySQL database
- ✅ Start Redis cache
- ✅ Start Node.js app with frontend and backend
- ✅ Run Prisma migrations automatically
- ✅ Start phpMyAdmin for database management

### Access Points

- **Frontend**: http://localhost:5173
- **Backend APIs**: http://localhost:9000/api/*
- **phpMyAdmin**: http://localhost:8081
- **MySQL**: localhost:3306

### Stop Services

```bash
docker-compose down
```

### Reset Database (Warning: Deletes all data)

```bash
docker-compose down -v
docker-compose up -d
```

## Development Workflow

### Making Changes

**Frontend Changes** (React components, styles):
- Changes are hot-reloaded automatically by Vite
- No restart needed

**Backend Changes** (API routes, database models):
- Restart Terminal 2 to see changes
- Or use tsx with watch mode (if available)

### Database Schema Changes

1. Update `prisma/schema.prisma`
2. Create a migration:
   ```bash
   pnpm prisma migrate dev --name <description>
   ```
3. This updates the database and regenerates Prisma Client

### API Development

The backend is Express-based. Add new endpoints in `server/routes/`:

```typescript
// server/routes/example.ts
export async function getExample(req, res) {
  const data = await db.model.findMany();
  res.json(data);
}
```

Then register in `server/index.ts`:

```typescript
app.get("/api/example", getExample);
```

## Frontend-Backend Communication

### API Calls from React

Use `fetch` or libraries like `react-query`:

```typescript
// In React components
const response = await fetch("/api/endpoint");
const data = await response.json();
```

### CORS

CORS is enabled in the backend (`server/index.ts`). Both localhost ports can communicate.

## Database Inspection

### Via phpMyAdmin (Docker)

1. Visit http://localhost:8081
2. Username: `netflow_user` or `root`
3. Password: `secure_password` or `root_password`

### Via Prisma Studio

```bash
pnpm prisma studio
```

Opens a GUI at http://localhost:5555 to inspect/edit database records.

### Via MySQL CLI

```bash
# Docker
docker-compose exec mysql mysql -u netflow_user -psecure_password netflow_db

# Local
mysql -u netflow_user -psecure_password -h localhost netflow_db
```

## Troubleshooting

### Dev Server Won't Start

```bash
# Check logs
pnpm run dev

# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Database Connection Error

1. Verify `.env` DATABASE_URL is correct
2. Check if MySQL is running
3. Try connecting manually:
   ```bash
   mysql -u netflow_user -psecure_password -h localhost netflow_db
   ```

### Port Already in Use

Change ports in:
- `vite.config.ts` (frontend port)
- `server/index.ts` or `.env` (backend port)
- `docker-compose.yml` (Docker ports)

### Prisma Client Out of Sync

Regenerate the Prisma client:

```bash
pnpm prisma generate
```

## Building for Production

### Build Both Frontend and Backend

```bash
pnpm build
```

This creates:
- `dist/spa/` - Built React frontend
- `dist/server/production.mjs` - Compiled backend

### Run Production Build

```bash
node dist/server/production.mjs
```

Then access the app at http://localhost:9000

## Useful Commands

```bash
# View database schema
pnpm prisma db push

# Format code
pnpm format.fix

# Type checking
pnpm typecheck

# Run tests
pnpm test

# View Prisma migrations
pnpm prisma migrate status
```

## Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [Express Documentation](https://expressjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Documentation](https://react.dev/)
