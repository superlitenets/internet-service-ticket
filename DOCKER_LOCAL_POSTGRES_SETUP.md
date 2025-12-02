# Local Docker PostgreSQL Setup Guide

This guide helps you run the NetFlow application with a local PostgreSQL database using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed on your system
- Git (for cloning the repository)

## Quick Start

### 1. Prepare Environment Variables

The `docker-compose.yml` is already configured to use a local PostgreSQL database. You have two options:

#### Option A: Use Docker Compose Defaults (Recommended for local development)

The docker-compose.yml already includes a `.env` file configuration. No additional setup needed.

#### Option B: Create a Custom `.env.docker` File

Create a `.env.docker` file in the project root with:

```env
NODE_ENV=development
PORT=9000
DATABASE_URL=postgresql://netflow_user:secure_password@postgres:5432/netflow_db
DB_HOST=postgres
DB_PORT=5432
DB_NAME=netflow_db
DB_USER=netflow_user
DB_PASSWORD=secure_password
```

### 2. Start Docker Services

```bash
# Start all services (PostgreSQL, Redis, and Node.js app)
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f app
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:9000
- **pgAdmin**: http://localhost:5050

### 3. Access the Database

#### Using pgAdmin (Web Interface)

1. Open http://localhost:5050
2. Login with:
   - Email: `admin@netflow.local`
   - Password: `admin_password`
3. Add a server connection:
   - Host: `postgres`
   - Port: `5432`
   - Username: `netflow_user`
   - Password: `secure_password`
   - Database: `netflow_db`

#### Using PostgreSQL CLI

```bash
# Connect to the database container
docker-compose exec postgres psql -U netflow_user -d netflow_db

# Example queries
SELECT version();
\dt  -- List tables
\q   -- Quit
```

#### Using a Local PostgreSQL Client

If you have `psql` installed locally:

```bash
psql -h localhost -U netflow_user -d netflow_db
```

Password: `secure_password`

### 4. Database Migrations

Migrations run automatically when the app container starts:

```bash
# Run migrations manually
docker-compose exec app pnpm prisma migrate deploy

# Create a new migration
docker-compose exec app pnpm prisma migrate dev --name migration_name

# View Prisma Studio
docker-compose exec app pnpm prisma studio
```

### 5. Useful Docker Commands

```bash
# Stop services
docker-compose down

# Stop and remove volumes (delete database)
docker-compose down -v

# View service status
docker-compose ps

# Rebuild services
docker-compose build --no-cache

# View service logs
docker-compose logs -f [service_name]
# service_name: app, postgres, redis, pgadmin

# Execute commands in a service
docker-compose exec app pnpm run build
docker-compose exec postgres pg_dump -U netflow_user netflow_db > backup.sql
```

## Database Backup and Restore

### Backup Database

```bash
# Backup to SQL file
docker-compose exec postgres pg_dump -U netflow_user -d netflow_db > netflow_backup.sql

# Backup with custom options
docker-compose exec postgres pg_dump -U netflow_user -d netflow_db --format=custom > netflow_backup.dump
```

### Restore Database

```bash
# Restore from SQL file
docker-compose exec -T postgres psql -U netflow_user -d netflow_db < netflow_backup.sql

# Restore from custom format
docker-compose exec -T postgres pg_restore -U netflow_user -d netflow_db netflow_backup.dump
```

## Services Overview

### PostgreSQL (postgres)
- **Container Name**: netflow-postgres
- **Host**: postgres
- **Port**: 5432
- **Database**: netflow_db
- **User**: netflow_user
- **Password**: secure_password
- **Data Volume**: postgres_data

### Redis (redis)
- **Container Name**: netflow-redis
- **Host**: redis
- **Port**: 6379
- **Data Volume**: redis_data

### Node.js Application (app)
- **Container Name**: netflow-app
- **Frontend Port**: 5173
- **API Port**: 9000
- **Mounts**: Entire project directory for live reloading

### pgAdmin
- **Container Name**: netflow-pgadmin
- **URL**: http://localhost:5050
- **Email**: admin@netflow.local
- **Password**: admin_password

## Changing Credentials

To use different credentials, edit `docker-compose.yml`:

```yaml
postgres:
  environment:
    POSTGRES_DB: your_db_name
    POSTGRES_USER: your_user
    POSTGRES_PASSWORD: your_password

app:
  environment:
    DATABASE_URL: postgresql://your_user:your_password@postgres:5432/your_db_name
```

And in pgAdmin service:

```yaml
pgadmin:
  environment:
    PGADMIN_DEFAULT_EMAIL: your_email@example.com
    PGADMIN_DEFAULT_PASSWORD: your_password
```

## Troubleshooting

### PostgreSQL Connection Refused

```bash
# Check if PostgreSQL service is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart the service
docker-compose restart postgres
```

### Port Already in Use

If port 5432 is already in use:

```yaml
# Edit docker-compose.yml
postgres:
  ports:
    - "5433:5432"  # Map to different port
```

Then update DATABASE_URL:
```
DATABASE_URL=postgresql://netflow_user:secure_password@postgres:5432/netflow_db
```
(Note: Use `postgres` as hostname, not localhost, when inside Docker network)

### Database Won't Start

```bash
# Remove old data and start fresh
docker-compose down -v
docker-compose up --build
```

### App Container Exits

```bash
# Check logs
docker-compose logs app

# Rebuild without cache
docker-compose build --no-cache app
docker-compose up app
```

## Switching Between Neon and Local PostgreSQL

### Use Local PostgreSQL
Update your `.env` file:
```env
DATABASE_URL=postgresql://netflow_user:secure_password@postgres:5432/netflow_db
```

Then run:
```bash
docker-compose up --build
```

### Switch Back to Neon
Update your `.env` file with Neon connection string:
```env
DATABASE_URL=postgresql://[user]:[password]@[host]/[dbname]?sslmode=require&channel_binding=require
```

Then run without Docker:
```bash
pnpm install
pnpm prisma migrate deploy
pnpm run dev
```

## Next Steps

1. Create initial admin user:
   ```bash
   docker-compose exec app pnpm run ts scripts/create-test-user.ts
   ```

2. Seed database with test data (if available):
   ```bash
   docker-compose exec app pnpm prisma db seed
   ```

3. Open the application at http://localhost:5173

## For Production Deployment

See `DOCKER_PRODUCTION_GUIDE.md` for production Docker setup with proper security and optimization.
