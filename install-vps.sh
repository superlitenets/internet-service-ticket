#!/bin/bash

# NetFlow ISP Management System - VPS Installation Script
# For Ubuntu 20.04+ / Debian 10+

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}NetFlow VPS Installation${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}This script must be run as root${NC}"
    exit 1
fi

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update
apt-get upgrade -y

# Install PHP and extensions
echo -e "${YELLOW}Installing PHP 8.2...${NC}"
apt-get install -y php8.2-fpm php8.2-mysql php8.2-pgsql php8.2-xml php8.2-curl php8.2-json php8.2-mbstring php8.2-zip

# Install MySQL
echo -e "${YELLOW}Installing MySQL 8.0...${NC}"
apt-get install -y mysql-server mysql-client

# Install Nginx
echo -e "${YELLOW}Installing Nginx...${NC}"
apt-get install -y nginx

# Install Composer
echo -e "${YELLOW}Installing Composer...${NC}"
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install Node.js and npm
echo -e "${YELLOW}Installing Node.js...${NC}"
apt-get install -y nodejs npm

# Install Redis
echo -e "${YELLOW}Installing Redis...${NC}"
apt-get install -y redis-server

# Create application directory
echo -e "${YELLOW}Creating application directory...${NC}"
mkdir -p /var/www/netflow
cd /var/www/netflow

# Clone repository (if git available)
if command -v git &> /dev/null; then
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone https://github.com/superlitenets/php-ticket-superlite.git .
fi

# Install PHP dependencies
echo -e "${YELLOW}Installing PHP dependencies...${NC}"
composer install

# Create .env file
echo -e "${YELLOW}Creating environment file...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
    
    # Set database credentials
    DB_PASSWORD=$(openssl rand -hex 16)
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
fi

# Create MySQL database
echo -e "${YELLOW}Setting up MySQL database...${NC}"
MYSQL_ROOT_PASS=$(openssl rand -hex 16)

mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS netflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'netflow_user'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON netflow_db.* TO 'netflow_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Update .env with database password
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
php database/migrate.php

# Set permissions
echo -e "${YELLOW}Setting directory permissions...${NC}"
chown -R www-data:www-data /var/www/netflow
chmod -R 755 /var/www/netflow
chmod -R 775 /var/www/netflow/storage

# Create Nginx configuration
echo -e "${YELLOW}Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/netflow << 'NGINX_CONFIG'
server {
    listen 80;
    server_name _;
    root /var/www/netflow/public;
    index index.php;

    client_max_body_size 100M;

    location ~ /\. {
        deny all;
    }

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
NGINX_CONFIG

# Enable Nginx site
ln -sf /etc/nginx/sites-available/netflow /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Start services
echo -e "${YELLOW}Starting services...${NC}"
systemctl enable php8.2-fpm
systemctl enable nginx
systemctl enable mysql
systemctl enable redis-server

systemctl restart php8.2-fpm
systemctl restart nginx
systemctl restart mysql
systemctl restart redis-server

# Install SSL certificate (Let's Encrypt)
echo -e "${YELLOW}Installing Certbot for SSL...${NC}"
apt-get install -y certbot python3-certbot-nginx

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure your domain in Nginx"
echo "2. Generate SSL certificate: certbot --nginx -d yourdomain.com"
echo "3. Create admin user: php database/create-admin.php"
echo "4. Access your application at http://your-server-ip"
echo ""
echo -e "${YELLOW}Important Files:${NC}"
echo "  - Environment: /var/www/netflow/.env"
echo "  - Nginx config: /etc/nginx/sites-available/netflow"
echo "  - MySQL password: $DB_PASSWORD"
echo "  - PHP logs: /var/log/php8.2-fpm.log"
echo ""
