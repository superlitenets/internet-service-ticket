#!/bin/bash

# Enable strict error handling
set -euo pipefail

# Trap errors
trap 'echo -e "\n${RED}Error: Installation failed at line $LINENO${NC}"; exit 1' ERR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}NetFlow CRM - Production Installation Script${NC}"
echo "=============================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run this script as root (sudo)${NC}"
  exit 1
fi

# Check for required commands
for cmd in curl git psql; do
  if ! command -v $cmd &> /dev/null && [ "$cmd" != "psql" ]; then
    echo -e "${YELLOW}Warning: $cmd not found, will install${NC}"
  fi
done

# Variables
APP_DIR="/opt/netflow"
APP_USER="netflow"
DB_NAME="netflow"
DB_USER="netflow"
DB_PASSWORD="Mgathoni.2016#"
DB_HOST="localhost"
DB_PORT="5432"
APP_PORT="9000"
DOMAIN="${1:-localhost}"

# Step 1: Update system
echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Step 2: Install Node.js
echo -e "${YELLOW}Step 2: Installing Node.js 20...${NC}"
apt-get install -y ca-certificates curl gnupg
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm@10.14.0

# Step 3: Install PostgreSQL
echo -e "${YELLOW}Step 3: Installing PostgreSQL...${NC}"
apt-get install -y postgresql postgresql-contrib

# Step 4: Start PostgreSQL
echo -e "${YELLOW}Step 4: Starting PostgreSQL service...${NC}"
systemctl start postgresql
systemctl enable postgresql

# Wait for PostgreSQL to be ready
sleep 3

# Step 5: Create database and user
echo -e "${YELLOW}Step 5: Creating database and user...${NC}"
sudo -u postgres psql -v ON_ERROR_STOP=1 << EOF
-- Drop existing database if it exists
DROP DATABASE IF EXISTS "$DB_NAME";

-- Drop existing user if it exists
DROP USER IF EXISTS "$DB_USER";

-- Create new user
CREATE USER "$DB_USER" WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";

-- Set connection defaults
ALTER ROLE "$DB_USER" SET client_encoding TO 'utf8';
ALTER ROLE "$DB_USER" SET default_transaction_isolation TO 'read committed';
ALTER ROLE "$DB_USER" SET default_transaction_deferrable TO 'off';
ALTER ROLE "$DB_USER" SET default_transaction_read_only TO 'off';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO "$DB_USER";
EOF

# Grant schema privileges
sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 << EOF
GRANT ALL ON SCHEMA public TO "$DB_USER";
EOF

# Step 6: Create application user
echo -e "${YELLOW}Step 6: Creating application user...${NC}"
if ! id -u "$APP_USER" > /dev/null 2>&1; then
  useradd -m -s /bin/bash "$APP_USER"
fi

# Step 7: Create app directory
echo -e "${YELLOW}Step 7: Setting up application directory...${NC}"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Step 8: Clone or use existing repo
echo -e "${YELLOW}Step 8: Checking for application files...${NC}"
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found in $APP_DIR${NC}"
  echo "Please copy your application files to $APP_DIR first"
  exit 1
fi
echo -e "${GREEN}Application files found${NC}"

# Step 9: Create .env file
echo -e "${YELLOW}Step 9: Creating .env configuration...${NC}"
JWT_SECRET=$(openssl rand -base64 32)

cat > "$APP_DIR/.env" << EOF
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
JWT_SECRET=$JWT_SECRET
EOF

chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

# Step 10: Install dependencies
echo -e "${YELLOW}Step 10: Installing application dependencies...${NC}"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
su - "$APP_USER" -c "cd $APP_DIR && pnpm install --no-frozen-lockfile"

# Step 11: Build application
echo -e "${YELLOW}Step 11: Building application...${NC}"
su - "$APP_USER" -c "cd $APP_DIR && npm run build"

# Step 12: Run migrations
echo -e "${YELLOW}Step 12: Running database migrations...${NC}"
su - "$APP_USER" -c "cd $APP_DIR && npx prisma migrate deploy"

# Step 13: Install and configure systemd service
echo -e "${YELLOW}Step 13: Setting up systemd service...${NC}"
cat > /etc/systemd/system/netflow.service << EOF
[Unit]
Description=NetFlow CRM Application
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment="NODE_ENV=production"
Environment="PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin"
ExecStart=/usr/bin/node $APP_DIR/dist/server/node-build.mjs
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable netflow
systemctl start netflow

# Step 14: Install Nginx
echo -e "${YELLOW}Step 14: Installing Nginx...${NC}"
apt-get install -y nginx

# Step 15: Configure Nginx reverse proxy
echo -e "${YELLOW}Step 15: Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/netflow << EOF
upstream netflow_backend {
    server 127.0.0.1:$APP_PORT;
}

server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript text/xml application/xml;
    gzip_min_length 256;

    # Client max body size
    client_max_body_size 50M;

    location / {
        proxy_pass http://netflow_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /api/ping {
        proxy_pass http://netflow_backend;
        access_log off;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://netflow_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable Nginx site
if [ -L /etc/nginx/sites-enabled/netflow ]; then
  rm /etc/nginx/sites-enabled/netflow
fi
ln -s /etc/nginx/sites-available/netflow /etc/nginx/sites-enabled/netflow

# Remove default Nginx site
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl restart nginx
systemctl enable nginx

# Step 16: Setup firewall (optional)
echo -e "${YELLOW}Step 16: Configuring firewall (UFW)...${NC}"
if command -v ufw &> /dev/null; then
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  echo "y" | ufw enable || true
  ufw status
else
  echo -e "${YELLOW}UFW not found, skipping firewall configuration${NC}"
fi

# Step 17: Install SSL (optional - Let's Encrypt)
echo -e "${YELLOW}Step 17: Would you like to install SSL with Let's Encrypt? (y/n)${NC}"
read -r ssl_choice
if [ "$ssl_choice" = "y" ]; then
  apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN"
fi

# Summary
echo ""
echo -e "${GREEN}=============================================="
echo "NetFlow CRM Installation Complete!"
echo "=============================================="
echo "Application URL: http://$DOMAIN"
echo "Application Directory: $APP_DIR"
echo "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
echo "App Service: systemctl status netflow"
echo "App Logs: journalctl -u netflow -f"
echo "Nginx Logs: tail -f /var/log/nginx/access.log"
echo "=============================================="
echo ""
echo -e "Next steps:"
echo "1. Verify the app is running: systemctl status netflow"
echo "2. Check logs: journalctl -u netflow -f"
echo "3. Visit http://$DOMAIN to access the application"
echo "4. Default login credentials: admin@example.com / password"
echo ""
