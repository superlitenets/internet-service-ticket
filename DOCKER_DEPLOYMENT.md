# Docker Deployment Guide

This guide explains how to deploy NetFlow CRM on your own server using Docker.

## Prerequisites

- Docker (v20.10+)
- Docker Compose (v2.0+)
- A server running Linux (Ubuntu, Debian, CentOS, etc.)
- At least 2GB RAM and 5GB disk space
- Ports 80 and 443 available (if using Nginx)

## Installation

### 1. Install Docker and Docker Compose

**On Ubuntu/Debian:**

```bash
# Update package manager
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# Add your user to docker group (optional, to avoid sudo)
sudo usermod -aG docker $USER
newgrp docker
```

**On CentOS/RHEL:**

```bash
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Clone or Upload Your Project

```bash
# Clone your repository
git clone <your-repository-url> /opt/netflow-crm
cd /opt/netflow-crm
```

Or upload the files to your server using SCP/SFTP.

## Deployment Options

### Option 1: Simple Docker Run (No Compose)

**Build the image:**

```bash
docker build -t netflow-crm:latest .
```

**Run the container:**

```bash
docker run -d \
  --name netflow-crm \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  netflow-crm:latest
```

**Check if it's running:**

```bash
docker logs netflow-crm
docker ps | grep netflow-crm
```

Access the app at: `http://your-server-ip:3000`

---

### Option 2: Docker Compose (Recommended)

**Start the application:**

```bash
docker-compose up -d
```

**View logs:**

```bash
docker-compose logs -f app
```

**Stop the application:**

```bash
docker-compose down
```

**Restart the application:**

```bash
docker-compose restart
```

Access the app at: `http://your-server-ip` (port 80 via Nginx)

---

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# .env
NODE_ENV=production
PORT=3000

# Optional: Database connection
# DATABASE_URL=postgresql://user:password@localhost/netflow

# Optional: Mikrotik API settings
# MIKROTIK_API_URL=https://your-router-ip:8728
# MIKROTIK_USERNAME=admin
# MIKROTIK_PASSWORD=your_password

# Optional: RADIUS settings
# RADIUS_HOST=your-radius-server
# RADIUS_PORT=1812
# RADIUS_SECRET=your_shared_secret

# Optional: M-Pesa settings
# MPESA_CONSUMER_KEY=your_key
# MPESA_CONSUMER_SECRET=your_secret
# MPESA_BUSINESS_SHORT_CODE=your_code
# MPESA_PASSKEY=your_passkey
```

Load environment variables in docker-compose.yml:

```yaml
services:
  app:
    env_file: .env
```

### Using Nginx Reverse Proxy

To enable the Nginx service in docker-compose.yml:

1. Uncomment the `nginx` section in `docker-compose.yml`
2. The nginx service will proxy requests to the app container
3. Access the app via port 80 instead of 3000

### SSL/HTTPS Setup

1. Obtain SSL certificates (e.g., using Let's Encrypt):

```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com
```

2. Copy certificates to your project:

```bash
mkdir -p certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/key.pem
sudo chown $USER:$USER certs/
```

3. Uncomment HTTPS sections in `nginx.conf`
4. Update domain in nginx.conf
5. Restart containers: `docker-compose restart`

## Database Setup (Optional)

If using PostgreSQL with Docker Compose:

1. Uncomment the `db` service in `docker-compose.yml`
2. Update environment variables (database name, user, password)
3. Set `DATABASE_URL` in your `.env` file
4. Run: `docker-compose up -d`

**Initialize database:**

```bash
docker-compose exec db psql -U admin -d netflow -f init.sql
```

## Monitoring and Maintenance

### View Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs app

# Follow logs in real-time
docker-compose logs -f app
```

### Check Container Status

```bash
docker-compose ps
```

### CPU and Memory Usage

```bash
docker stats
```

### Update the Application

1. Pull latest code:

```bash
git pull origin main
```

2. Rebuild and restart:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Backup Data

If you have persistent volumes, backup them:

```bash
docker-compose exec db pg_dump -U admin netflow > backup.sql
```

### Clean Up

Remove old images and containers:

```bash
docker system prune -a
```

## Troubleshooting

### Container won't start

```bash
docker-compose logs app
docker inspect <container_id>
```

### Port already in use

```bash
# Find process using port 3000
sudo lsof -i :3000
# Or change the port in docker-compose.yml
```

### High memory usage

```bash
# Check Docker stats
docker stats

# Limit memory in docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

### Database connection error

- Verify DATABASE_URL in .env
- Check if db service is running: `docker-compose ps`
- Test connection: `docker-compose exec app psql $DATABASE_URL`

## Performance Tips

1. **Enable Gzip compression** (nginx.conf already configured)
2. **Set resource limits** to prevent container crash:

   ```yaml
   deploy:
     resources:
       limits:
         cpus: "2"
         memory: 2G
   ```

3. **Use health checks** (Dockerfile includes health check)
4. **Enable caching** for static assets (nginx.conf configured)
5. **Monitor resource usage** regularly

## Scaling (Multiple Containers)

For high traffic, run multiple app instances:

```yaml
version: "3.8"
services:
  app:
    build: .
    # ... other config ...
    deploy:
      replicas: 3 # Run 3 instances

  nginx:
    image: nginx:alpine
    # Nginx will load-balance between instances
```

## Security Best Practices

1. ✅ Use environment variables for secrets (never commit .env)
2. ✅ Enable HTTPS/SSL
3. ✅ Keep Docker images updated
4. ✅ Use non-root user in containers
5. ✅ Regularly backup data
6. ✅ Monitor logs for suspicious activity
7. ✅ Use strong database passwords
8. ✅ Restrict file permissions (chmod)

## Support

For issues:

1. Check logs: `docker-compose logs app`
2. Verify environment variables are set
3. Ensure all required services are running
4. Check Docker documentation: https://docs.docker.com

---

**Deployment completed!** 🎉

Your NetFlow CRM is now running in Docker on your server.
