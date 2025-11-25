# Docker MySQL Setup Guide

This guide explains how to run the NetFlow TypeScript project with MySQL database in Docker.

## Prerequisites

- Docker Desktop or Docker Engine installed
- Docker Compose installed
- Node.js 18+ and pnpm (for local development without Docker)

## Quick Start with Docker

### 1. Start the Docker Environment

```bash
docker-compose up -d
```

This will start:
- **MySQL Database** (port 3306)
- **Redis Cache** (port 6379)
- **Node.js App** (port 5173 for frontend, backend APIs embedded)
- **phpMyAdmin** (port 8081 for database management)

### 2. View Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **phpMyAdmin**: http://localhost:8081

### 3. Database Access via phpMyAdmin

- **Host**: mysql
- **Username**: netflow_user
- **Password**: secure_password
- **Database**: netflow_db

Or use the root user:
- **Username**: root
- **Password**: root_password

## Services Configuration

### MySQL Service

```yaml
Container: netflow-mysql
Database: netflow_db
User: netflow_user
Password: secure_password
Port: 3306
```

### Node.js Application

```yaml
Container: netflow-app
Frontend Port: 5173 (Vite dev server)
Backend APIs: Embedded via Express plugin
PORT: 9000 (environment variable)
DATABASE_URL: mysql://netflow_user:secure_password@mysql:3306/netflow_db
```

### Redis Cache

```yaml
Container: netflow-redis
Port: 6379
```

## Database Migrations

Migrations are automatically applied when the container starts:

```bash
pnpm prisma migrate deploy
```

To create new migrations after schema changes:

```bash
docker-compose exec app pnpm prisma migrate dev --name <migration_name>
```

## Development Workflow

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mysql
```

### Connect to Running Container

```bash
# Access Node.js app shell
docker-compose exec app sh

# Access MySQL client
docker-compose exec mysql mysql -u netflow_user -psecure_password netflow_db

# View app logs
docker-compose logs -f app
```

### Rebuild Container (after code changes)

```bash
docker-compose up -d --build
```

### Stop Services

```bash
docker-compose down
```

### Reset Database (WARNING: Deletes all data)

```bash
docker-compose down -v
docker-compose up -d
```

## Environment Variables

The MySQL connection is configured in `.env`:

```env
NODE_ENV=development
PORT=9000
DATABASE_URL=mysql://netflow_user:secure_password@mysql:3306/netflow_db
DB_HOST=mysql
DB_PORT=3306
DB_NAME=netflow_db
DB_USER=netflow_user
DB_PASSWORD=secure_password
```

## Prisma Setup

The project uses Prisma ORM with MySQL driver.

### Current Setup

- Database Provider: MySQL
- Generated Client Location: `generated/prisma`
- Schema File: `prisma/schema.prisma`
- Migrations: `prisma/migrations/`

### View Database Schema

```bash
# Via phpMyAdmin
# Visit http://localhost:8081

# Or via CLI
docker-compose exec mysql mysqldump -u netflow_user -psecure_password netflow_db > backup.sql
```

### Prisma Studio (Database GUI)

```bash
# Only works outside Docker with local database
pnpm prisma studio
```

## Troubleshooting

### Container Fails to Start

```bash
# Check logs
docker-compose logs app

# Verify MySQL is healthy
docker-compose exec mysql mysqladmin -u root -proot_password ping
```

### Database Connection Errors

Verify `DATABASE_URL` in `.env`:
```env
DATABASE_URL=mysql://netflow_user:secure_password@mysql:3306/netflow_db
```

Ensure MySQL container is running and healthy:
```bash
docker-compose ps
docker-compose logs mysql
```

### Port Already in Use

Change port mappings in `docker-compose.yml`:
```yaml
ports:
  - "9173:5173"  # Change 9173 to your available port
```

Then access: http://localhost:9173

### Permission Denied Errors

Ensure Docker daemon is running:
```bash
# On Linux
sudo docker ps

# Or add user to docker group
sudo usermod -aG docker $USER
```

## Production Deployment

See `DOCKER_PRODUCTION_GUIDE.md` for production setup instructions.

## Local Development (Without Docker)

### Prerequisites

- MySQL 8.0+ running locally
- Node.js 18+ and pnpm

### Setup

1. Update `.env`:
```env
DATABASE_URL=mysql://netflow_user:secure_password@localhost:3306/netflow_db
NODE_ENV=development
```

2. Create database:
```bash
mysql -u root -p < database/schema.sql
```

3. Run migrations:
```bash
pnpm prisma migrate deploy
```

4. Start development server:
```bash
pnpm run dev
```

## Additional Resources

- [Prisma MySQL Documentation](https://www.prisma.io/docs/orm/overview/databases/mysql)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)
