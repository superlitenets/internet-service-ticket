#!/bin/bash

set -euo pipefail
trap 'echo -e "\n${RED}❌ Installation failed at line $LINENO${NC}"; exit 1' ERR

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/opt/netflow"
APP_USER="netflow"
DB_NAME="netflow"
DB_USER="netflow"
DB_PASSWORD="Mgathoni.2016#"
GITHUB_REPO="https://github.com/superlitenets/internet-service-ticket.git"
DOMAIN="${1:-localhost}"
APP_PORT="9000"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║   NetFlow CRM - Production Setup       ║"
echo "║   Ubuntu 24 LTS Automated Install      ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# Verify root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Run with sudo: sudo bash QUICK_INSTALL.sh ${NC}"
  exit 1
fi

# Show domain info
echo -e "${YELLOW}Configuration:${NC}"
echo "  Domain: $DOMAIN"
echo "  App Port: $APP_PORT"
echo "  App Dir: $APP_DIR"
echo "  Database: $DB_NAME"
echo ""

# Step 1: Update system
echo -e "${YELLOW}[1/13] Updating system...${NC}"
apt-get update -qq
apt-get upgrade -y -qq

# Step 2: Install basic tools
echo -e "${YELLOW}[2/13] Installing essential tools...${NC}"
apt-get install -y -qq curl git wget gnupg ca-certificates build-essential

# Step 3: Install Node.js 20
echo -e "${YELLOW}[3/13] Installing Node.js 20...${NC}"
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
apt-get update -qq
apt-get install -y -qq nodejs
npm install -g pnpm@10.14.0 -qq

echo -e "${GREEN}✓ Node $(node -v) installed${NC}"
echo -e "${GREEN}✓ pnpm $(pnpm -v) installed${NC}"

# Step 4: Install PostgreSQL 16
echo -e "${YELLOW}[4/13] Installing PostgreSQL 16...${NC}"
apt-get install -y -qq postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql
sleep 2

echo -e "${GREEN}✓ PostgreSQL started${NC}"

# Step 5: Create database
echo -e "${YELLOW}[5/13] Creating database and user...${NC}"
sudo -u postgres psql -v ON_ERROR_STOP=1 << EOF
DROP DATABASE IF EXISTS "$DB_NAME";
DROP USER IF EXISTS "$DB_USER";
CREATE USER "$DB_USER" WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE "$DB_NAME" OWNER "$DB_USER";
ALTER ROLE "$DB_USER" SET client_encoding TO 'utf8';
ALTER ROLE "$DB_USER" SET default_transaction_isolation TO 'read committed';
ALTER ROLE "$DB_USER" SET default_transaction_deferrable TO 'off';
ALTER ROLE "$DB_USER" SET default_transaction_read_only TO 'off';
GRANT ALL PRIVILEGES ON DATABASE "$DB_NAME" TO "$DB_USER";
EOF

sudo -u postgres psql -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO \"$DB_USER\";"

echo -e "${GREEN}✓ Database created${NC}"

# Step 6: Create application user
echo -e "${YELLOW}[6/13] Setting up application user...${NC}"
if ! id -u "$APP_USER" > /dev/null 2>&1; then
  useradd -m -s /bin/bash "$APP_USER"
fi
echo -e "${GREEN}✓ User $APP_USER created${NC}"

# Step 7: Clone repository
echo -e "${YELLOW}[7/13] Cloning repository...${NC}"
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"
git clone "$GITHUB_REPO" "$APP_DIR" --depth 1 -q
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

echo -e "${GREEN}✓ Repository cloned${NC}"

# Step 8: Create .env file
echo -e "${YELLOW}[8/13] Creating .env configuration...${NC}"
JWT_SECRET=$(openssl rand -base64 32)

cat > "$APP_DIR/.env" << ENVFILE
NODE_ENV=production
PORT=$APP_PORT
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
JWT_SECRET=$JWT_SECRET
ENVFILE

chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

echo -e "${GREEN}✓ .env created${NC}"

# Step 9: Install dependencies
echo -e "${YELLOW}[9/13] Installing dependencies (this may take a minute)...${NC}"
cd "$APP_DIR"
sudo -u "$APP_USER" pnpm install --no-frozen-lockfile -q

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 10: Build application
echo -e "${YELLOW}[10/13] Building application...${NC}"
sudo -u "$APP_USER" npm run build -q

echo -e "${GREEN}✓ Application built${NC}"

# Step 11: Run migrations
echo -e "${YELLOW}[11/13] Running database migrations...${NC}"
sudo -u "$APP_USER" npx prisma migrate deploy

echo -e "${GREEN}✓ Migrations completed${NC}"

# Step 12: Create systemd service
echo -e "${YELLOW}[12/13] Setting up systemd service...${NC}"

cat > /etc/systemd/system/netflow.service << SERVICEFILE
[Unit]
Description=NetFlow CRM Application
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node $APP_DIR/dist/server/node-build.mjs
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=netflow

[Install]
WantedBy=multi-user.target
SERVICEFILE

systemctl daemon-reload
systemctl enable netflow
systemctl start netflow
sleep 3

echo -e "${GREEN}✓ Service configured${NC}"

# Step 13: Install and configure Nginx
echo -e "${YELLOW}[13/13] Configuring Nginx reverse proxy...${NC}"
apt-get install -y -qq nginx

cat > /etc/nginx/sites-available/netflow << NGINXFILE
upstream netflow_backend {
    server 127.0.0.1:$APP_PORT;
}

server {
    listen 80;
    listen [::]:80;
    server_name _;

    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript text/xml application/xml;
    gzip_min_length 256;
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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /api/ping {
        proxy_pass http://netflow_backend;
        access_log off;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://netflow_backend;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINXFILE

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/netflow /etc/nginx/sites-enabled/netflow
nginx -t > /dev/null
systemctl restart nginx
systemctl enable nginx

echo -e "${GREEN}✓ Nginx configured${NC}"

# Verify installation
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"

if systemctl is-active --quiet netflow; then
  echo -e "${GREEN}✓ NetFlow service is running${NC}"
else
  echo -e "${RED}✗ NetFlow service failed to start${NC}"
  journalctl -u netflow -n 20
  exit 1
fi

if systemctl is-active --quiet nginx; then
  echo -e "${GREEN}✓ Nginx is running${NC}"
else
  echo -e "${RED}✗ Nginx is not running${NC}"
  exit 1
fi

if sudo -u postgres psql -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
  echo -e "${GREEN}✓ Database connection successful${NC}"
else
  echo -e "${RED}✗ Database connection failed${NC}"
  exit 1
fi

# Success
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║   ✓ Installation Complete!            ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo -e "${YELLOW}Quick Commands:${NC}"
echo "  View status:     systemctl status netflow"
echo "  View logs:       journalctl -u netflow -f"
echo "  Restart app:     systemctl restart netflow"
echo "  Stop app:        systemctl stop netflow"
echo ""

if [ "$DOMAIN" = "localhost" ]; then
  echo -e "${BLUE}Access your app: http://localhost${NC}"
else
  echo -e "${BLUE}Access your app: http://$DOMAIN${NC}"
fi

echo ""
echo -e "${YELLOW}Default credentials:${NC}"
echo "  Email: admin@example.com"
echo "  Password: (set in Login page)"
echo ""
