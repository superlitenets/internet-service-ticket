#!/bin/bash

##############################################################################
# NetFlow CRM - Automated VPS Installation Script
# Usage: bash install-vps.sh
##############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VPS_IP="102.205.239.4"
DOMAIN="netflow.${VPS_IP//./-}.nip.io"  # Using nip.io for IP-based domain
PROJECT_DIR="/opt/netflow-crm"
GIT_REPO="https://github.com/superlitenets/internet-service-ticket.git"

echo -e "${BLUE}===============================================${NC}"
echo -e "${BLUE}  NetFlow CRM - VPS Installation${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  VPS IP: $VPS_IP"
echo "  Domain: $DOMAIN"
echo "  Project Dir: $PROJECT_DIR"
echo "  Git Repo: $GIT_REPO"
echo ""

##############################################################################
# Step 1: Update System
##############################################################################
echo -e "${BLUE}[1/10] Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl git wget vim

##############################################################################
# Step 2: Install Docker
##############################################################################
echo -e "${BLUE}[2/10] Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  rm get-docker.sh
  echo -e "${GREEN}✓ Docker installed${NC}"
else
  echo -e "${GREEN}✓ Docker already installed${NC}"
fi

##############################################################################
# Step 3: Install Docker Compose
##############################################################################
echo -e "${BLUE}[3/10] Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
  echo -e "${GREEN}✓ Docker Compose installed${NC}"
else
  echo -e "${GREEN}✓ Docker Compose already installed${NC}"
fi

##############################################################################
# Step 4: Add user to docker group
##############################################################################
echo -e "${BLUE}[4/10] Configuring Docker permissions...${NC}"
sudo usermod -aG docker $USER
echo -e "${GREEN}✓ Docker permissions configured${NC}"

##############################################################################
# Step 5: Clone Repository
##############################################################################
echo -e "${BLUE}[5/10] Cloning NetFlow CRM repository...${NC}"
if [ ! -d "$PROJECT_DIR" ]; then
  sudo mkdir -p $PROJECT_DIR
  sudo git clone $GIT_REPO $PROJECT_DIR
  sudo chown -R $USER:$USER $PROJECT_DIR
  echo -e "${GREEN}✓ Repository cloned${NC}"
else
  echo -e "${YELLOW}⚠ Project directory already exists${NC}"
  cd $PROJECT_DIR
  git pull origin main
fi

cd $PROJECT_DIR

##############################################################################
# Step 6: Create environment file
##############################################################################
echo -e "${BLUE}[6/10] Creating environment configuration...${NC}"
cat > .env << 'EOF'
# Application
NODE_ENV=production
PORT=3000

# Add your credentials here if needed:
# MPESA_CONSUMER_KEY=your_key
# MPESA_CONSUMER_SECRET=your_secret
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token
EOF

echo -e "${GREEN}✓ Environment file created${NC}"

##############################################################################
# Step 7: Create SSL certificates
##############################################################################
echo -e "${BLUE}[7/10] Creating SSL certificates...${NC}"
mkdir -p certs

if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout certs/key.pem -out certs/cert.pem \
    -subj "/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,IP:$VPS_IP"
  echo -e "${GREEN}✓ SSL certificates generated${NC}"
else
  echo -e "${GREEN}✓ SSL certificates already exist${NC}"
fi

##############################################################################
# Step 8: Configure Nginx
##############################################################################
echo -e "${BLUE}[8/10] Configuring Nginx...${NC}"

cat > nginx.conf << 'EOF'
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

    # HTTP server
    server {
        listen 80;
        server_name _;

        # Redirect HTTP to HTTPS
        location / {
            return 301 https://$host$request_uri;
        }

        # Allow health checks via HTTP
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name _;

        # SSL certificates
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
            proxy_read_timeout 60s;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 365d;
            add_header Cache-Control "public, immutable";
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

echo -e "${GREEN}✓ Nginx configured${NC}"

##############################################################################
# Step 9: Build and start Docker containers
##############################################################################
echo -e "${BLUE}[9/10] Building Docker containers (this may take 5-10 minutes)...${NC}"

# Make sure old containers are stopped
docker-compose down 2>/dev/null || true

# Build and start
docker-compose build --no-cache
docker-compose up -d

# Wait for app to be ready
echo -e "${YELLOW}⏳ Waiting for application to start (30 seconds)...${NC}"
sleep 30

##############################################################################
# Step 10: Configure Firewall
##############################################################################
echo -e "${BLUE}[10/10] Configuring firewall...${NC}"

# Enable UFW if not already enabled
sudo ufw --force enable 2>/dev/null || true

# Allow required ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

sudo ufw reload 2>/dev/null || true

echo -e "${GREEN}✓ Firewall configured${NC}"

##############################################################################
# Verify Installation
##############################################################################
echo ""
echo -e "${BLUE}===============================================${NC}"
echo -e "${GREEN}  ✓ Installation Complete!${NC}"
echo -e "${BLUE}===============================================${NC}"
echo ""

# Check if services are running
echo -e "${YELLOW}Service Status:${NC}"
docker-compose ps

echo ""
echo -e "${YELLOW}Access Your Application:${NC}"
echo -e "  ${GREEN}HTTPS: https://$VPS_IP${NC}"
echo -e "  ${GREEN}HTTPS with domain: https://$DOMAIN${NC}"
echo ""

echo -e "${YELLOW}Default Login Credentials:${NC}"
echo "  Admin:    admin@example.com / password123"
echo "  Support:  support@example.com / password123"
echo "  Customer: 0722000000 / password123"
echo ""

echo -e "${YELLOW}Useful Commands:${NC}"
echo "  View logs:     docker-compose logs -f app"
echo "  Restart:       docker-compose restart"
echo "  Stop:          docker-compose down"
echo "  Update:        cd $PROJECT_DIR && git pull && docker-compose up -d"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Access your application at https://$VPS_IP"
echo "  2. Login with credentials above"
echo "  3. Configure Settings (Mikrotik, M-Pesa, SMS, etc.)"
echo "  4. Create users and set permissions"
echo "  5. Start managing your ISP business!"
echo ""

echo -e "${GREEN}✓ NetFlow CRM is ready to use!${NC}"
echo ""
