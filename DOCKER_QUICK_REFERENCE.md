# Docker Quick Reference

Quick commands for common Docker tasks.

## Start/Stop

```bash
# Start all containers
docker-compose up -d

# Stop all containers
docker-compose stop

# Restart all containers
docker-compose restart

# Stop and remove containers (keeps data)
docker-compose down

# Stop and remove containers + volumes (WARNING: deletes database data)
docker-compose down -v
```

## Monitoring

```bash
# View all containers status
docker-compose ps

# View real-time logs
docker-compose logs -f

# View app logs only
docker-compose logs -f app

# View database logs only
docker-compose logs -f postgres

# View last 100 lines
docker-compose logs --tail=100 app

# View container resource usage
docker stats
```

## Database Operations

```bash
# Connect to database
docker-compose exec postgres psql -U netflow -d netflow

# Backup database
docker-compose exec postgres pg_dump -U netflow netflow > backup.sql

# View all tables
docker-compose exec postgres psql -U netflow -d netflow -c "\dt"

# View users
docker-compose exec postgres psql -U netflow -d netflow -c "SELECT * FROM \"User\";"

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Generate Prisma client
docker-compose exec app npx prisma generate
```

## Application Operations

```bash
# Test API health
curl http://localhost:9000/api/ping

# Get all users
curl http://localhost:9000/api/auth/users

# Create new user
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "0722000000",
    "password": "password123"
  }'

# Run shell commands in app
docker-compose exec app npm run build

# View app process list
docker-compose exec app ps aux
```

## Building

```bash
# Build image
docker-compose build

# Build without cache
docker-compose build --no-cache

# Build specific service
docker-compose build app

# Build and start
docker-compose up -d --build
```

## Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Run migrations after update
docker-compose exec app npx prisma migrate deploy

# Verify
curl http://localhost:9000/api/ping
```

## Troubleshooting

```bash
# Check specific container logs
docker-compose logs app

# Check PostgreSQL connection
docker-compose exec app psql -h postgres -U netflow -d netflow -c "SELECT 1;"

# Rebuild everything
docker-compose down -v
docker-compose up -d --build

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a

# Get container ID
docker-compose ps | grep app

# Execute command in running container
docker exec <container-id> <command>

# Get container stats
docker stats <container-id>
```

## Environment Variables

```bash
# View current .env
cat .env

# Update .env
nano .env

# Reload environment without rebuild
docker-compose restart app
```

## Backup/Restore

```bash
# Backup database
docker-compose exec postgres pg_dump -U netflow netflow > backup_$(date +%s).sql

# Restore from backup
docker-compose exec -T postgres psql -U netflow netflow < backup_123456.sql

# Backup volumes
docker run --rm -v netflow_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_data.tar.gz -C /data .

# List backups
ls -la *.sql *.tar.gz
```

## Development vs Production

```bash
# Development (with hot reload)
pnpm run dev

# Production (Docker)
docker-compose up -d
docker-compose exec app npx prisma migrate deploy

# View production logs
docker-compose logs -f app

# Production build locally
npm run build
docker build -t netflow-crm:latest .
```

## Useful One-Liners

```bash
# Create user and print JWT token
curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","phone":"0700000001","password":"password123"}' | jq .token

# Get user count
curl http://localhost:9000/api/auth/users | jq '.users | length'

# Check database size
docker-compose exec postgres psql -U netflow -d netflow -c "SELECT pg_size_pretty(pg_database_size('netflow'));"

# List all running containers
docker-compose ps --services --filter status=running

# Tail app and database logs simultaneously
docker-compose logs -f app postgres

# Export database to CSV
docker-compose exec postgres psql -U netflow -d netflow -c "COPY \"User\" TO STDOUT WITH CSV HEADER" > users.csv
```

## Emergency Commands

```bash
# Rebuild everything from scratch
docker-compose down -v
docker system prune -a
docker volume prune
docker-compose build --no-cache
docker-compose up -d

# Force kill a stuck container
docker kill <container-id>

# Delete all Docker data (WARNING: destructive)
docker system prune -a --volumes

# Reset database
docker volume rm netflow_postgres_data
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

---

## Most Common Workflow

```bash
# 1. Start services
docker-compose up -d

# 2. Apply migrations
docker-compose exec app npx prisma migrate deploy

# 3. Monitor logs
docker-compose logs -f app

# 4. When done, stop services
docker-compose stop

# 5. View status
docker-compose ps
```

---

## Errors & Solutions

| Error | Solution |
|-------|----------|
| Port 9000 in use | Change port in docker-compose.yml or `docker-compose down` |
| Database won't connect | Wait 30s for DB startup, check logs: `docker-compose logs postgres` |
| Migration fails | Run: `docker-compose exec app npx prisma migrate deploy` |
| Out of disk | Run: `docker system prune -a` |
| Container won't start | Check logs: `docker-compose logs <service>` |
| Permission denied | Add user to docker group: `sudo usermod -aG docker $USER` |

---

For detailed documentation, see **DOCKER_PRODUCTION_GUIDE.md**
