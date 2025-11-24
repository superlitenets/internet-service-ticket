# VPS Deployment Guide for NetFlow CRM

This guide covers deploying NetFlow CRM to a VPS (DigitalOcean, Linode, AWS EC2, or similar) with Docker.

## Prerequisites

- VPS with Ubuntu 20.04+ or Debian 11+
- SSH access to your VPS
- Domain name (optional, but recommended)
- 2GB+ RAM, 20GB+ storage

## Step 1: Connect to Your VPS

```bash
ssh root@your_vps_ip
# or
ssh ubuntu@your_vps_ip
```

## Step 2: Update System & Install Docker

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to docker group (optional)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

## Step 3: Clone Your Project

```bash
# Navigate to home or desired directory
cd /opt

# Clone the repository
git clone https://github.com/yourusername/internet-service-ticket.git netflow-crm
cd netflow-crm

# Checkout the correct branch if needed
git checkout main
```

## Step 4: Create Environment Files

### Create `.env` file

```bash
nano .env
```

Add the following (customize as needed):

```env
# Application
NODE_ENV=production
PORT=3000

# Optional: Database (if using PostgreSQL)
# DATABASE_URL=postgresql://admin:password@db:5432/netflow

# Optional: Mikrotik API
# MIKROTIK_API_URL=https://your-router-ip:8728
# MIKROTIK_USERNAME=admin
# MIKROTIK_PASSWORD=your_password

# Optional: M-Pesa Settings
# MPESA_CONSUMER_KEY=your_key
# MPESA_CONSUMER_SECRET=your_secret
# MPESA_BUSINESS_SHORT_CODE=your_code
# MPESA_PASSKEY=your_passkey

# Optional: SMS Settings
# SMS_PROVIDER=twilio
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_FROM_NUMBER=+1234567890

# Optional: WhatsApp Settings
# WHATSAPP_BUSINESS_ACCOUNT_ID=your_id
# WHATSAPP_ACCESS_TOKEN=your_token
# WHATSAPP_PHONE_NUMBER_ID=your_number_id
```

Save: `Ctrl + X`, then `Y`, then `Enter`

## Step 5: Update docker-compose.yml

Edit the docker-compose file for production:

```bash
nano docker-compose.yml
```

**Update the services section:**

```yaml
version: "3.8"

services:
  app:
    build: .
    container_name: netflow-crm-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file: .env
    volumes:
      - ./logs:/app/logs
    restart: always
    networks:
      - netflow
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: netflow-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
      - ./html:/usr/share/nginx/html:ro
    depends_on:
      - app
    restart: always
    networks:
      - netflow

networks:
  netflow:
    driver: bridge
```

## Step 6: Update nginx.conf for Your Domain

```bash
nano nginx.conf
```

**Update the server block:**

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;

    # Upstream app
    upstream netflow_app {
        server app:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        # Allow Let's Encrypt validation
        location /.well-known/acme-challenge/ {
            root /usr/share/nginx/html;
        }

        # Redirect all HTTP to HTTPS
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL certificates (update paths after obtaining certificates)
        ssl_certificate /etc/nginx/certs/cert.pem;
        ssl_certificate_key /etc/nginx/certs/key.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Proxy settings
        location / {
            proxy_pass http://netflow_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

**Replace `your-domain.com` with your actual domain**

## Step 7: Set Up SSL Certificates (Optional but Recommended)

### Option A: Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Create certs directory
mkdir -p certs

# For initial setup, stop Nginx if running
sudo docker-compose down

# Get certificate (stop Nginx on port 80 first)
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates to project
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/key.pem
sudo chown $USER:$USER certs/*

# Set up auto-renewal
sudo certbot renew --dry-run
```

### Option B: Self-signed Certificate (Testing Only)

```bash
mkdir -p certs

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/key.pem -out certs/cert.pem \
  -subj "/CN=your-domain.com"
```

## Step 8: Configure Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Verify rules
sudo ufw status
```

## Step 9: Build and Start the Application

```bash
# Navigate to project directory
cd /opt/netflow-crm

# Build Docker image
docker-compose build

# Start containers
docker-compose up -d

# Check logs
docker-compose logs -f app

# Verify services running
docker-compose ps
```

## Step 10: Set Up Domain DNS

Point your domain to your VPS IP address:

1. Go to your domain registrar
2. Find DNS settings
3. Add/Update **A record**:
   - Type: A
   - Name: @ (or your domain)
   - Value: your_vps_ip
   - TTL: 3600

Wait 5-30 minutes for DNS propagation.

## Step 11: Access Your Application

- **HTTP**: http://your-domain.com (redirects to HTTPS)
- **HTTPS**: https://your-domain.com

**Default login credentials:**
- Admin: `admin@example.com` / `password123`
- Support: `support@example.com` / `password123`
- Customer: `0722000000` / `password123`

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app

# View last 100 lines
docker-compose logs -n 100 app
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart app

# Restart with rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Check Disk Space

```bash
# View disk usage
df -h

# View Docker disk usage
docker system df
```

### Backup Important Data

```bash
# Create backup directory
mkdir -p /opt/netflow-crm/backups

# Backup Docker volumes (if any)
docker run --rm -v netflow_data:/data -v /opt/netflow-crm/backups:/backup \
  alpine tar czf /backup/netflow-backup-$(date +%Y%m%d).tar.gz -C / data
```

### Enable Auto-updates (Optional)

```bash
# Install unattended-upgrades
sudo apt install unattended-upgrades -y

# Enable auto-updates
sudo dpkg-reconfigure -plow unattended-upgrades
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

### SSL Certificate Renewal

```bash
# Manual renewal
sudo certbot renew --force-renewal

# Automated renewal (runs twice daily)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Application Not Responding

```bash
# Check service status
docker-compose ps

# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check logs for errors
docker-compose logs app
```

### Out of Memory

```bash
# View memory usage
free -h
docker stats

# Clean up Docker
docker system prune -a
docker volume prune
```

## Performance Optimization

### Enable Caching Headers

Update `nginx.conf` to cache static files:

```nginx
# Cache static assets for 1 year
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}
```

### Set Resource Limits

Update `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
```

### Enable Compression

Already configured in `nginx.conf` with gzip.

## Security Best Practices

1. ✅ Use HTTPS/SSL (Let's Encrypt)
2. ✅ Keep system updated (`sudo apt update && sudo apt upgrade`)
3. ✅ Use strong passwords
4. ✅ Store credentials in `.env` (never commit)
5. ✅ Enable firewall (UFW)
6. ✅ Limit SSH access
7. ✅ Monitor logs regularly
8. ✅ Regular backups
9. ✅ Use non-root user for SSH

## Getting Help

- **Logs**: `docker-compose logs -f app`
- **Status**: `docker-compose ps`
- **Docker Docs**: https://docs.docker.com
- **Nginx Docs**: https://nginx.org/en/docs/

---

**Deployment completed!** Your NetFlow CRM is now running on your VPS. 🚀
