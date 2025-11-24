# VPS Production Deployment Guide

## Overview

This guide covers deploying the NetFlow CRM application to your VPS for production use with PostgreSQL database persistence.

## Prerequisites

✅ PostgreSQL installed and running on your VPS
✅ Node.js 18+ and pnpm installed
✅ Application code pushed to your VPS
✅ Production domain configured (optional)

## Step 1: Prepare Production Environment

### 1.1 SSH into your VPS
```bash
ssh root@your-vps-ip
cd /path/to/netflow-crm  # Navigate to your application directory
```

### 1.2 Set Production Environment Variables

Create `.env` file with production settings:

```bash
# Application
NODE_ENV=production
PORT=9000

# Database - PostgreSQL on your VPS
DATABASE_URL="postgresql://netflow:Mgathoni.2016%23@localhost:5432/netflow"

# JWT Secret - Generate a secure secret for production
JWT_SECRET="your-super-secret-jwt-key-change-this-to-something-secure-and-long"

# Optional: Mikrotik API
# MIKROTIK_API_URL=https://your-router-ip:8728
# MIKROTIK_USERNAME=admin
# MIKROTIK_PASSWORD=your_password

# Optional: M-Pesa Settings
# MPESA_CONSUMER_KEY=your_key
# MPESA_CONSUMER_SECRET=your_secret
# MPESA_BUSINESS_SHORT_CODE=your_code
# MPESA_PASSKEY=your_passkey
# MPESA_INITIATOR_PASSWORD=your_password
# MPESA_CALLBACK_URL=https://yourdomain.com/api/mpesa/callback

# Optional: SMS Settings
# SMS_PROVIDER=advanta
# ADVANTA_API_KEY=your_key
# ADVANTA_PARTNER_ID=your_id
# ADVANTA_SHORTCODE=your_shortcode
# ADVANTA_API_URL=https://api.advantasms.com/send

# Optional: WhatsApp Settings
# WHATSAPP_BUSINESS_ACCOUNT_ID=your_id
# WHATSAPP_ACCESS_TOKEN=your_token
# WHATSAPP_PHONE_NUMBER_ID=your_number_id
```

**Important**: Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 2: Install Dependencies and Build

### 2.1 Install Node Dependencies
```bash
pnpm install --frozen-lockfile
```

### 2.2 Generate Prisma Client
```bash
npx prisma generate
```

### 2.3 Apply Database Migrations

**First time only - Create database schema:**
```bash
npx prisma migrate deploy
```

**Verify schema was created:**
```bash
psql -U netflow -h localhost netflow
\dt  # List all tables - should show User, Customer, Lead, Ticket, Employee, etc.
\q   # Quit psql
```

### 2.4 Build for Production
```bash
npm run build
```

This creates optimized production builds in:
- `dist/spa/` - Frontend React app
- `dist/server/` - Backend Node.js server

## Step 3: Start the Application

### Option A: Direct Node.js

```bash
npm start
```

The server will start on port 9000. Visit `http://your-vps-ip:9000` in your browser.

### Option B: Using PM2 (Recommended for Production)

Install PM2:
```bash
npm install -g pm2
```

Start with PM2:
```bash
pm2 start dist/server/node-build.mjs --name "netflow-crm"
pm2 save
pm2 startup
```

View logs:
```bash
pm2 logs netflow-crm
```

Restart on reboot:
```bash
pm2 startup
pm2 save
```

### Option C: Using systemd Service (Alternative)

Create `/etc/systemd/system/netflow-crm.service`:

```ini
[Unit]
Description=NetFlow CRM Application
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/netflow-crm
Environment="NODE_ENV=production"
EnvironmentFile=/path/to/netflow-crm/.env
ExecStart=/usr/bin/node dist/server/node-build.mjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
systemctl daemon-reload
systemctl enable netflow-crm
systemctl start netflow-crm
systemctl status netflow-crm
```

View logs:
```bash
journalctl -u netflow-crm -f
```

## Step 4: Configure Nginx Reverse Proxy (Recommended)

Create `/etc/nginx/sites-available/netflow-crm`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com;

    # Redirect to HTTPS (optional but recommended)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://localhost:9000;
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

Enable site and test:
```bash
ln -s /etc/nginx/sites-available/netflow-crm /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Step 5: Setup SSL Certificate (Optional but Recommended)

Using Let's Encrypt:
```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d your-domain.com

# Auto-renew setup
systemctl enable certbot.timer
```

## Step 6: Database Backup Strategy

### Automated Daily Backups

Create backup script `/usr/local/bin/backup-netflow-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backup/netflow-crm"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/netflow_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
pg_dump -U netflow -h localhost netflow > "$BACKUP_FILE"

# Keep only last 30 days
find $BACKUP_DIR -name "netflow_*.sql" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

Make executable:
```bash
chmod +x /usr/local/bin/backup-netflow-db.sh
```

Add to crontab:
```bash
crontab -e

# Add this line to run daily at 2 AM
0 2 * * * /usr/local/bin/backup-netflow-db.sh
```

## Step 7: Verify Installation

### Check API Health
```bash
curl http://localhost:9000/api/ping
# Expected response: {"message":"ping"}
```

### Test Database Connection
```bash
curl http://localhost:9000/api/auth/users
# Should return list of users
```

### Access Web Interface
Open browser to: `http://your-vps-ip:9000` (or your domain)

Login with default credentials (if initial users were created):
- Email: admin@example.com
- Password: password123

## Step 8: Production Security Checklist

- [ ] Change default user credentials
- [ ] Generate unique JWT_SECRET
- [ ] Set strong database password
- [ ] Enable PostgreSQL SSL connections (optional)
- [ ] Configure firewall rules (only allow ports 80, 443, 22)
- [ ] Setup SSL/TLS certificate
- [ ] Configure regular database backups
- [ ] Setup monitoring/alerting
- [ ] Enable application logging
- [ ] Setup rate limiting for API endpoints
- [ ] Hide sensitive error details in production

## Step 9: Monitoring and Maintenance

### Check Application Status
```bash
ps aux | grep node
pm2 status  # If using PM2
systemctl status netflow-crm  # If using systemd
```

### View Application Logs
```bash
pm2 logs netflow-crm  # PM2 logs
# OR
journalctl -u netflow-crm -f  # systemd logs
```

### Database Health Check
```bash
psql -U netflow -h localhost netflow -c "SELECT version();"
```

### Restart Application
```bash
pm2 restart netflow-crm  # PM2
# OR
systemctl restart netflow-crm  # systemd
```

## Troubleshooting

### Port 9000 Already in Use
```bash
lsof -i :9000  # Find process using port
kill -9 <PID>  # Kill the process
```

### Database Connection Error
```bash
# Check PostgreSQL status
systemctl status postgresql

# Test database connection
psql -U netflow -h localhost netflow
```

### Permission Denied Errors
```bash
# Ensure correct file permissions
chmod 755 dist/server
chmod 644 .env
```

### Out of Memory
```bash
# Check system memory
free -h

# Monitor Node.js memory
node --max-old-space-size=4096 dist/server/node-build.mjs
```

## Production Deployment Checklist

- [ ] `.env` file configured with production values
- [ ] PostgreSQL database running and migrations applied
- [ ] Dependencies installed (`pnpm install`)
- [ ] Application built (`npm run build`)
- [ ] Reverse proxy configured (Nginx)
- [ ] SSL certificate installed
- [ ] PM2 or systemd service configured
- [ ] Database backup script scheduled
- [ ] Monitoring/logging setup
- [ ] Security checklist completed
- [ ] Application tested and verified working
- [ ] Documentation updated for your team

## Upgrading in Production

### 1. Backup Database
```bash
pg_dump -U netflow netflow > backup_$(date +%s).sql
```

### 2. Pull Latest Code
```bash
git pull origin main
```

### 3. Install New Dependencies
```bash
pnpm install
```

### 4. Run Migrations
```bash
npx prisma migrate deploy
```

### 5. Rebuild
```bash
npm run build
```

### 6. Restart Application
```bash
pm2 restart netflow-crm
# OR
systemctl restart netflow-crm
```

### 7. Verify
```bash
curl http://localhost:9000/api/ping
```

## Support and Documentation

- Database Setup: See `DATABASE_SETUP.md`
- API Documentation: See `shared/api.ts`
- Database Schema: See `prisma/schema.prisma`
- Troubleshooting: Check `DATABASE_SETUP.md` for common issues

## Next Steps

1. Create initial admin user for production
2. Configure optional integrations (M-Pesa, SMS, Mikrotik, WhatsApp)
3. Setup monitoring and alerting
4. Document your specific setup in team wiki
5. Train team on production deployment and maintenance
