# Docker Quick Start - Local PostgreSQL

## One-Line Start

```bash
docker-compose up --build
```

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | - |
| Backend API | http://localhost:9000 | - |
| pgAdmin | http://localhost:5050 | admin@netflow.local / admin_password |
| PostgreSQL | localhost:5432 | netflow_user / secure_password |
| Redis | localhost:6379 | - |

## Essential Commands

```bash
# Start services
docker-compose up -d --build

# Stop services
docker-compose down

# View logs
docker-compose logs -f app
docker-compose logs -f postgres

# Database access
docker-compose exec postgres psql -U netflow_user -d netflow_db

# Run migrations
docker-compose exec app pnpm prisma migrate deploy

# Create new migration
docker-compose exec app pnpm prisma migrate dev --name your_migration_name

# Open database UI (Prisma Studio)
docker-compose exec app pnpm prisma studio

# Full database reset (deletes all data)
docker-compose down -v
docker-compose up --build
```

## Backup & Restore

```bash
# Backup
docker-compose exec postgres pg_dump -U netflow_user -d netflow_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U netflow_user -d netflow_db < backup.sql
```

## Change Passwords

Edit `docker-compose.yml` and update:
- `POSTGRES_PASSWORD` in postgres service
- `DATABASE_URL` in app service
- `PGADMIN_DEFAULT_PASSWORD` in pgadmin service

Then restart:
```bash
docker-compose down
docker-compose up --build
```

## Database Details

- **Host**: postgres (or localhost:5432 from host machine)
- **Database**: netflow_db
- **User**: netflow_user
- **Password**: secure_password
- **Volume**: postgres_data (persistent)

## Common Issues

**Connection refused?** → Check if postgres service is healthy: `docker-compose ps`

**Port 5432 already in use?** → Change in docker-compose.yml: `"5433:5432"`

**Data lost after down?** → Use `docker-compose stop` instead of `down -v`

For detailed guide, see `DOCKER_LOCAL_POSTGRES_SETUP.md`
