# Docker Production Deployment Guide

Complete guide to deploy NetFlow CRM using Docker and Docker Compose for production.

## Overview

This guide covers:

- Building Docker image for production
- Running with Docker Compose (app + PostgreSQL)
- Production deployment steps
- Monitoring and maintenance
- Troubleshooting

---

## Prerequisites

1. **Docker**: Version 20.10+

   ```bash
   docker --version
   docker-compose --version
   ```

2. **Docker Installed on VPS**: SSH access to your VPS with Docker pre-installed

3. **Files Ready**:
   - ✅ `Dockerfile` - Production image definition
   - ✅ `docker-compose.yml` - Orchestration configuration
   - ✅ `.dockerignore` - Build optimization

---

## Quick Start (5 Minutes)

### Option 1: Using Docker Compose (Recommended)

```bash
# 1. Clone/pull latest code to VPS
git clone <your-repo> /opt/netflow-crm
cd /opt/netflow-crm

# 2. Create .env file with production values
cat > .env << 'EOF'
NODE_ENV=production
PORT=9000
DATABASE_URL=postgresql://netflow:Mgathoni.2016%23@postgres:5432/netflow
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
EOF

# 3. Start everything
docker-compose up -d

# 4. Run database migrations
docker-compose exec app npx prisma migrate deploy

# 5. Verify
docker-compose logs -f app
curl http://localhost:9000/api/ping
```

Visit: `http://your-vps-ip:9000`

### Option 2: Manual Docker Build & Run

```bash
# 1. Build image
docker build -t netflow-crm:latest .

# 2. Create network
docker network create netflow-network

# 3. Run PostgreSQL
docker run -d \
  --name netflow-db \
  --network netflow-network \
  -e POSTGRES_USER=netflow \
  -e POSTGRES_PASSWORD=Mgathoni.2016# \
  -e POSTGRES_DB=netflow \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# 4. Run app
docker run -d \
  --name netflow-app \
  --network netflow-network \
  -p 9000:9000 \
  -e DATABASE_URL=postgresql://netflow:Mgathoni.2016%23@netflow-db:5432/netflow \
  -e NODE_ENV=production \
  netflow-crm:latest

# 5. Run migrations
docker exec netflow-app npx prisma migrate deploy

# 6. Verify
curl http://localhost:9000/api/ping
```

---

## Detailed Setup Guide

### Step 1: Prepare VPS

```bash
# SSH into VPS
ssh root@your-vps-ip

# Create application directory
mkdir -p /opt/netflow-crm
cd /opt/netflow-crm

# Clone your repository
git clone <your-repo> .
# OR
git pull origin main  # If already cloned
```

### Step 2: Configure Environment

```bash
# Create .env file
cat > .env << 'EOF'
# Application
NODE_ENV=production
PORT=9000

# Database (will use PostgreSQL container)
DATABASE_URL=postgresql://netflow:Mgathoni.2016%23@postgres:5432/netflow

# Generate secure JWT_SECRET
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Optional: Integrations
# MIKROTIK_API_URL=https://your-router-ip:8728
# MIKROTIK_USERNAME=admin
# MIKROTIK_PASSWORD=password

# MPESA_CONSUMER_KEY=your_key
# MPESA_CONSUMER_SECRET=your_secret
# MPESA_BUSINESS_SHORT_CODE=your_code
# MPESA_PASSKEY=your_passkey

# SMS_PROVIDER=advanta
# ADVANTA_API_KEY=your_key
# ADVANTA_PARTNER_ID=your_id
EOF

# Verify .env was created
cat .env
```

**Important**: Never commit `.env` to git!

```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore
```

### Step 3: Start Containers

```bash
# Start services
docker-compose up -d

# Verify services are running
docker-compose ps

# Expected output:
# CONTAINER ID  IMAGE                        STATUS
# xxxxx         netflow-crm:latest          Up 2 minutes
# xxxxx         postgres:16-alpine           Up 2 minutes
```

### Step 4: Run Database Migrations

```bash
# Apply migrations to create schema
docker-compose exec app npx prisma migrate deploy

# Verify tables were created
docker-compose exec postgres psql -U netflow -d netflow -c "\dt"

# Expected output:
# public | User       | table | netflow
# public | Customer   | table | netflow
# public | Lead       | table | netflow
# public | Ticket     | table | netflow
# public | Employee   | table | netflow
# ... (more tables)
```

### Step 5: Verify Application

```bash
# Check application logs
docker-compose logs -f app

# Test API health
curl http://localhost:9000/api/ping
# Expected: {"message":"ping"}

# Test database connection
curl http://localhost:9000/api/auth/users
# Expected: {"success":true,"users":[]}

# Open in browser
# http://your-vps-ip:9000
```

---

## Docker Compose Commands

### Essential Commands

```bash
# Start all services in background
docker-compose up -d

# View logs
docker-compose logs -f app              # App logs
docker-compose logs -f postgres         # Database logs
docker-compose logs -f                  # All logs

# Stop services
docker-compose stop

# Start services
docker-compose start

# Restart services
docker-compose restart app              # Restart app only
docker-compose restart                  # Restart all

# Stop and remove containers
docker-compose down

# Remove containers and volumes
docker-compose down -v                  # WARNING: Deletes database data!
```

### Execute Commands in Container

```bash
# Run shell commands in app container
docker-compose exec app npm run build

# Run database commands
docker-compose exec postgres psql -U netflow -d netflow

# Create new user via API
docker-compose exec app curl -X POST http://localhost:9000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "phone": "0700000001",
    "password": "password123"
  }'
```

---

## Production Deployment Checklist

- [ ] `.env` file created with secure JWT_SECRET
- [ ] `.env` added to `.gitignore`
- [ ] Docker and Docker Compose installed on VPS
- [ ] Code pulled to VPS
- [ ] `docker-compose up -d` started successfully
- [ ] `docker-compose ps` shows all containers running
- [ ] Database migrations applied (`docker-compose exec app npx prisma migrate deploy`)
- [ ] API health check passed (`curl http://localhost:9000/api/ping`)
- [ ] Web interface accessible in browser
- [ ] Test user created and login works
- [ ] Data persists after container restart
- [ ] Logs being captured properly
- [ ] Backup strategy configured
- [ ] Monitoring set up (optional)

---

## Volume & Data Persistence

### PostgreSQL Data

PostgreSQL data is stored in Docker volume:

```bash
# List volumes
docker volume ls | grep netflow

# Inspect volume
docker volume inspect netflow_postgres_data

# Backup database
docker-compose exec postgres pg_dump -U netflow netflow > backup_$(date +%s).sql

# Restore from backup
docker-compose exec -T postgres psql -U netflow netflow < backup_XXXXX.sql
```

### Application Logs

Logs are stored locally in `./logs` directory:

```bash
# View logs
ls -la logs/
tail -f logs/app.log

# Configure log rotation (in docker-compose.yml, already set)
# Max file size: 10MB
# Max files: 3
```

---

## Monitoring & Health

### Container Health

```bash
# Check container status
docker-compose ps

# View container stats (CPU, memory, etc.)
docker stats netflow-app netflow-db

# Check health status
docker-compose exec app curl http://localhost:9000/api/ping
```

### Database Health

```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready -U netflow

# View database size
docker-compose exec postgres psql -U netflow -d netflow -c "SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) FROM pg_database WHERE datname = 'netflow';"

# Check active connections
docker-compose exec postgres psql -U netflow -d netflow -c "SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;"
```

### Application Metrics

```bash
# Memory usage
docker stats --no-stream netflow-app

# Process info
docker-compose exec app ps aux

# Disk usage
docker-compose exec app df -h
```

---

## Backup & Recovery

### Automated Backup Script

Create `/opt/netflow-crm/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/netflow-crm/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/netflow_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U netflow netflow > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"

# Keep only last 30 days
find $BACKUP_DIR -name "netflow_*.sql.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

Make executable and add to crontab:

```bash
chmod +x backup.sh

# Edit crontab
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * cd /opt/netflow-crm && ./backup.sh
```

### Manual Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U netflow netflow > backup.sql

# Backup volumes
docker run --rm -v netflow_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_data.tar.gz -C /data .

# Restore database
docker-compose down
docker-compose up -d
docker-compose exec -T postgres psql -U netflow netflow < backup.sql

# Restore volumes
docker-compose down
docker volume rm netflow_postgres_data
docker run --rm -v netflow_postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_data.tar.gz -C /data
docker-compose up -d
```

---

## Scaling & Load Balancing

### Multiple App Instances (with docker-compose)

Edit `docker-compose.yml`:

```yaml
services:
  app:
    build: .
    deploy:
      replicas: 3 # Run 3 instances
    ports:
      - "9001:9000"
      - "9002:9000"
      - "9003:9000"
```

Then use Nginx for load balancing (included in docker-compose.yml).

### Manual Scaling

```bash
# Scale app service to 3 instances
docker-compose up -d --scale app=3

# View all instances
docker-compose ps
```

---

## Troubleshooting

### Issue: "Cannot connect to PostgreSQL"

```bash
# Check if database container is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Test connection
docker-compose exec app psql -h postgres -U netflow -d netflow -c "SELECT 1;"
```

### Issue: "Migration failed"

```bash
# Check app logs
docker-compose logs app

# Verify database exists
docker-compose exec postgres psql -U netflow -l

# Manually run migrations
docker-compose exec app npx prisma generate
docker-compose exec app npx prisma migrate deploy
```

### Issue: "Out of disk space"

```bash
# Check disk usage
docker system df

# Clean up unused images and containers
docker system prune -a

# Remove dangling volumes
docker volume prune
```

### Issue: "Port 9000 already in use"

```bash
# Find what's using port 9000
lsof -i :9000

# Kill the process
kill -9 <PID>

# OR change port in docker-compose.yml
# Change: ports: - "9000:9000"
# To: ports: - "9001:9000"
```

### Issue: "App crashes immediately"

```bash
# Check application logs
docker-compose logs app

# Check if migrations ran
docker-compose exec app npx prisma migrate deploy

# Rebuild image
docker-compose build --no-cache
docker-compose up -d
```

---

## Security Best Practices

### 1. .env File Security

```bash
# Never commit .env to git
echo ".env" >> .gitignore
git rm --cached .env

# Restrict file permissions
chmod 600 .env

# Use strong JWT_SECRET
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### 2. Database Security

```bash
# Change default PostgreSQL password
# Edit .env and docker-compose.yml with strong password

# Enable PostgreSQL SSL (advanced)
# Configure in docker-compose.yml volumes
```

### 3. Network Security

```bash
# Only expose necessary ports
# In docker-compose.yml:
# - Don't expose PostgreSQL port (5432) to public
# - Only expose app port (9000)
# - Use Nginx for HTTPS termination

# Firewall rules
ufw allow 22/tcp     # SSH
ufw allow 80/tcp     # HTTP
ufw allow 443/tcp    # HTTPS
ufw deny 5432/tcp    # PostgreSQL
```

### 4. Image Security

```bash
# Use specific Alpine version (don't use :latest)
# Dockerfile uses: node:22-alpine

# Scan for vulnerabilities
docker scan netflow-crm:latest

# Use Docker Content Trust
export DOCKER_CONTENT_TRUST=1
docker push netflow-crm:latest
```

---

## SSL/HTTPS Setup

The `docker-compose.yml` includes Nginx container for SSL termination.

### 1. Generate SSL Certificate

Using Let's Encrypt:

```bash
# Create ssl directory
mkdir -p ssl

# Using certbot
docker run --rm -v $(pwd)/ssl:/etc/letsencrypt certbot/certbot certonly \
  --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates to ssl/
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/
```

### 2. Configure Nginx

Create `nginx.conf`:

```nginx
upstream app {
    server app:9000;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Start with SSL

```bash
docker-compose up -d
# Application will be available at https://your-domain.com
```

---

## Updates & Redeployment

### Rolling Update (Zero Downtime)

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild image
docker-compose build --no-cache app

# 3. Stop old version
docker-compose stop app

# 4. Apply migrations (if needed)
docker-compose up -d app
docker-compose exec app npx prisma migrate deploy

# 5. Verify
curl https://your-domain.com/api/ping
```

### Full Restart (Brief Downtime)

```bash
# Stop everything
docker-compose down

# Pull latest code
git pull origin main

# Rebuild and start
docker-compose up -d --build

# Run migrations
docker-compose exec app npx prisma migrate deploy

# Verify
curl https://your-domain.com/api/ping
```

---

## Production Monitoring

### View Real-time Logs

```bash
# Follow app logs
docker-compose logs -f app

# Follow all logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100 app
```

### Set Up Alerts

Using Docker events:

```bash
# Monitor container health
docker events --filter 'type=container' --filter 'status=die'

# Alert on restart
docker-compose logs app | grep "restart"
```

### Monitoring Tools (Optional)

- **Prometheus**: `docker run prom/prometheus`
- **Grafana**: `docker run grafana/grafana`
- **ELK Stack**: Elasticsearch, Logstash, Kibana

---

## Reference: Full docker-compose.yml

See included `docker-compose.yml` for complete configuration with:

- PostgreSQL database
- NetFlow CRM app
- Nginx reverse proxy
- Health checks
- Logging configuration
- Volume management
- Network configuration

---

## Support & Documentation

- **General Docker**: https://docs.docker.com/
- **Docker Compose**: https://docs.docker.com/compose/
- **Database**: See `DATABASE_SETUP.md`
- **Security**: See `PRODUCTION_SECURITY.md`
- **Deployment**: See `PRODUCTION_GO_LIVE_CHECKLIST.md`

---

## Success Criteria ✅

Your Docker deployment is successful when:

- [x] `docker-compose up -d` starts all services
- [x] `docker-compose ps` shows all containers running
- [x] Database migrations complete without errors
- [x] `curl http://localhost:9000/api/ping` returns 200
- [x] Web interface accessible at `http://localhost:9000`
- [x] Users can create accounts and login
- [x] Data persists in PostgreSQL
- [x] Logs captured and accessible
- [x] Containers auto-restart on failure
- [x] Health checks passing

---

**Status**: Docker production deployment ready ✅  
**Last Updated**: 2024  
**Version**: Production Ready
