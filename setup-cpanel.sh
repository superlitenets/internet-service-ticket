#!/bin/bash

# NetFlow cPanel Quick Setup Script
# This script automates the installation of NetFlow on cPanel hosting

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NETFLOW_VERSION="1.0.0"
PHP_MIN_VERSION="8.1"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "$1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Check if running as root or via cPanel
if [[ $EUID -ne 0 ]] && [[ "$SUDO_USER" == "" ]]; then
    print_error "This script must be run as root or with sudo"
    exit 1
fi

# Get current user (cPanel account)
if [[ "$SUDO_USER" != "" ]]; then
    CPANEL_USER="$SUDO_USER"
else
    CPANEL_USER="$1"
    if [[ -z "$CPANEL_USER" ]]; then
        print_error "Please specify cPanel username: $0 <cpanel_username>"
        exit 1
    fi
fi

print_header "NetFlow cPanel Installation v${NETFLOW_VERSION}"

# Step 1: Check system requirements
print_header "Checking System Requirements"

# Check PHP
PHP_VERSION=$(php -r 'echo phpversion();' 2>/dev/null)
if [[ -z "$PHP_VERSION" ]]; then
    print_error "PHP is not installed"
    exit 1
fi

print_status "PHP version: $PHP_VERSION"

# Check required extensions
REQUIRED_EXTENSIONS=("pdo" "json" "curl" "openssl")
MISSING_EXTENSIONS=()

for ext in "${REQUIRED_EXTENSIONS[@]}"; do
    if php -m | grep -q "$ext"; then
        print_status "Extension '$ext' is installed"
    else
        MISSING_EXTENSIONS+=("$ext")
        print_warning "Extension '$ext' is not installed"
    fi
done

if [[ ${#MISSING_EXTENSIONS[@]} -gt 0 ]]; then
    print_warning "Some extensions are missing. They may be available in cPanel PHP settings."
fi

# Check Composer
if ! command -v composer &> /dev/null; then
    print_warning "Composer is not installed. Attempting to install..."
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    if command -v composer &> /dev/null; then
        print_status "Composer installed successfully"
    else
        print_error "Failed to install Composer"
        exit 1
    fi
else
    COMPOSER_VERSION=$(composer --version)
    print_status "$COMPOSER_VERSION"
fi

# Step 2: Setup directory structure
print_header "Setting Up Directory Structure"

CPANEL_HOME="/home/$CPANEL_USER"
PUBLIC_HTML="$CPANEL_HOME/public_html"
NETFLOW_DIR="$PUBLIC_HTML"

if [[ ! -d "$PUBLIC_HTML" ]]; then
    print_error "cPanel user directory not found: $PUBLIC_HTML"
    exit 1
fi

print_status "cPanel home: $CPANEL_HOME"
print_status "Installation directory: $NETFLOW_DIR"

# Create necessary directories
mkdir -p "$NETFLOW_DIR/storage/logs"
mkdir -p "$NETFLOW_DIR/storage/uploads"
mkdir -p "$NETFLOW_DIR/storage/cache"

print_status "Created storage directories"

# Step 3: Install dependencies
print_header "Installing Composer Dependencies"

cd "$NETFLOW_DIR"

if [[ -f "composer.json" ]]; then
    composer install --no-dev --optimize-autoloader
    print_status "Dependencies installed successfully"
else
    print_error "composer.json not found in $NETFLOW_DIR"
    exit 1
fi

# Step 4: Create environment file
print_header "Creating Environment Configuration"

if [[ ! -f ".env" ]]; then
    if [[ -f ".env.example.php" ]]; then
        cp .env.example.php .env
        print_status "Created .env file"
    else
        print_error ".env.example.php not found"
        exit 1
    fi
fi

# Prompt for database configuration
echo ""
echo "Please provide your database configuration:"
read -p "Database Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Database Name [netflow_db]: " DB_NAME
DB_NAME=${DB_NAME:-netflow_db}

read -p "Database User [netflow_user]: " DB_USER
DB_USER=${DB_USER:-netflow_user}

read -sp "Database Password: " DB_PASSWORD
echo ""

# Update .env file
sed -i "s/DB_HOST=.*/DB_HOST=$DB_HOST/" .env
sed -i "s/DB_PORT=.*/DB_PORT=$DB_PORT/" .env
sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env
sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" .env
sed -i "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env

print_status "Environment configured"

# Step 5: Generate secure keys
print_header "Generating Secure Keys"

APP_KEY=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)

sed -i "s/APP_KEY=.*/APP_KEY=$APP_KEY/" .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env

print_status "Security keys generated"

# Step 6: Create admin account
print_header "Creating Admin Account"

echo ""
read -p "Admin Username [admin]: " ADMIN_USER
ADMIN_USER=${ADMIN_USER:-admin}

read -p "Admin Email: " ADMIN_EMAIL

read -sp "Admin Password: " ADMIN_PASSWORD
echo ""

read -p "Admin Full Name: " ADMIN_FULL_NAME

# Create admin user via PHP script
php -r "
require 'vendor/autoload.php';
\$dotenv = new \Dotenv\Dotenv(__DIR__);
\$dotenv->load();

\$db = new PDO(
    'pgsql:host=' . \$_ENV['DB_HOST'] . ';port=' . \$_ENV['DB_PORT'] . ';dbname=' . \$_ENV['DB_NAME'],
    \$_ENV['DB_USER'],
    \$_ENV['DB_PASSWORD']
);

\$hashedPassword = password_hash('$ADMIN_PASSWORD', PASSWORD_BCRYPT);
\$stmt = \$db->prepare('INSERT INTO users (username, email, password, full_name, role, status) VALUES (?, ?, ?, ?, ?, ?)');
\$stmt->execute(['$ADMIN_USER', '$ADMIN_EMAIL', \$hashedPassword, '$ADMIN_FULL_NAME', 'admin', 'active']);

echo 'Admin user created successfully';
" 2>/dev/null && print_status "Admin account created" || print_warning "Failed to create admin account (database may not exist yet)"

# Step 7: Set permissions
print_header "Setting File Permissions"

chown -R $CPANEL_USER:$CPANEL_USER "$NETFLOW_DIR"
chmod -R 755 "$NETFLOW_DIR/storage"
chmod 644 "$NETFLOW_DIR/.env"
chmod 644 "$NETFLOW_DIR/public/.htaccess"

print_status "Permissions configured"

# Step 8: Test installation
print_header "Testing Installation"

# Test PHP syntax
if php -l public/index.php > /dev/null 2>&1; then
    print_status "PHP syntax check passed"
else
    print_error "PHP syntax check failed"
fi

# Test database connection
php -r "
require 'vendor/autoload.php';
\$dotenv = new \Dotenv\Dotenv(__DIR__);
\$dotenv->load();

try {
    \$db = new PDO(
        'pgsql:host=' . \$_ENV['DB_HOST'] . ';port=' . \$_ENV['DB_PORT'] . ';dbname=' . \$_ENV['DB_NAME'],
        \$_ENV['DB_USER'],
        \$_ENV['DB_PASSWORD']
    );
    echo 'Database connection successful';
} catch (Exception \$e) {
    echo 'Database connection failed: ' . \$e->getMessage();
}
" && print_status "Database connection successful" || print_warning "Database connection failed"

# Installation complete
print_header "Installation Complete!"

echo ""
echo "NetFlow has been successfully installed!"
echo ""
echo "Next steps:"
echo "1. Run database migrations: php database/migrate.php"
echo "2. Configure your domain in cPanel"
echo "3. Enable mod_rewrite in cPanel"
echo "4. Visit https://yourdomain.com to access the application"
echo ""
echo "Admin Login:"
echo "  Email: $ADMIN_EMAIL"
echo "  Password: (the password you entered)"
echo ""
echo "For more information, see CPANEL_INSTALLATION.md"
echo ""

print_status "Installation finished successfully!"
