#!/bin/bash

# NetFlow Repository Separation Script
# Separates PHP backend into php-ticket-superlite repo
# Leaves TypeScript frontend in internet-service-ticket repo

set -e

echo "=========================================="
echo "NetFlow Repository Separation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "composer.json" ]; then
    echo -e "${RED}Error: Not in the root of internet-service-ticket repo${NC}"
    exit 1
fi

CURRENT_DIR=$(pwd)
PARENT_DIR=$(dirname "$CURRENT_DIR")
TS_REPO="$CURRENT_DIR"
PHP_REPO="$PARENT_DIR/php-ticket-superlite"

echo -e "${YELLOW}Current TypeScript Repo:${NC} $TS_REPO"
echo -e "${YELLOW}PHP Repo (will create):${NC} $PHP_REPO"
echo ""

# Confirm with user
read -p "Continue with separation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo -e "${GREEN}Step 1: Creating PHP repository structure...${NC}"

# Create PHP repo directory
mkdir -p "$PHP_REPO"
cd "$PHP_REPO"

# Initialize git
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/superlitenets/php-ticket-superlite.git
    echo "✓ Initialized PHP repo with remote"
else
    echo "✓ PHP repo already initialized"
fi

echo ""
echo -e "${GREEN}Step 2: Creating .gitignore and basic files...${NC}"

# Create .gitignore
cat > .gitignore << 'EOF'
vendor/
.env
.env.local
.DS_Store
*.log
*.swp
*.swo
*~
.idea/
.vscode/
node_modules/
dist/
build/
.php_cs.cache
EOF
echo "✓ Created .gitignore"

# Create basic README
cat > README.md << 'EOF'
# NetFlow ISP Management System - PHP Backend

Multi-tenant ISP management platform built with PHP, Slim Framework, and PostgreSQL.

## Quick Start

### Requirements
- PHP 7.4+
- PostgreSQL 12+
- Composer

### Installation

1. Clone repository:

git clone https://github.com/superlitenets/php-ticket-superlite.git
cd php-ticket-superlite
```

2. Install dependencies:
```bash
composer install
```

3. Configure environment:
```bash
cp .env.example.php .env
# Edit .env with your database credentials
```

4. Run migrations:
```bash
php database/migrate.php
```

5. Start PHP server:
```bash
php -S localhost:8000 -t public
```

## Features

- ✅ Multi-tenant architecture (single database)
- ✅ ISP billing automation
- ✅ MikroTik integration
- ✅ Customer portal
- ✅ Real-time monitoring
- ✅ RESTful API

## Documentation

- [Installation Guide](INSTALLATION.md)
- [Deployment Guide](DEPLOYMENT_PHP.md)
- [Multitenancy](MULTITENANCY.md)
- [API Documentation](API.md)
- [ISP Module](ISP_MODULE.md)

## Support

For issues or questions, refer to documentation or create an issue on GitHub.

## License

MIT
EOF
echo "✓ Created README.md"

echo ""
echo -e "${GREEN}Step 3: Copying PHP files from TypeScript repo...${NC}"

# Copy PHP application files
echo "Copying app files..."
cp -r "$TS_REPO/app" "$PHP_REPO/" 2>/dev/null || echo "  app/ (already exists or not found)"
cp -r "$TS_REPO/core" "$PHP_REPO/" 2>/dev/null || echo "  core/ (already exists or not found)"
cp -r "$TS_REPO/cron" "$PHP_REPO/" 2>/dev/null || echo "  cron/ (already exists or not found)"
cp -r "$TS_REPO/database" "$PHP_REPO/" 2>/dev/null || echo "  database/ (already exists or not found)"
cp -r "$TS_REPO/helpers" "$PHP_REPO/" 2>/dev/null || echo "  helpers/ (already exists or not found)"
cp -r "$TS_REPO/public" "$PHP_REPO/" 2>/dev/null || echo "  public/ (already exists or not found)"
cp -r "$TS_REPO/views" "$PHP_REPO/" 2>/dev/null || echo "  views/ (already exists or not found)"

echo "Copying configuration files..."
cp "$TS_REPO/.env.example.php" "$PHP_REPO/" 2>/dev/null || echo "  .env.example.php (not found)"
cp "$TS_REPO/composer.json" "$PHP_REPO/" 2>/dev/null || echo "  composer.json (not found)"
cp "$TS_REPO/composer.lock" "$PHP_REPO/" 2>/dev/null || echo "  composer.lock (not found)"

echo "Copying install scripts..."
cp "$TS_REPO/install-cpanel.php" "$PHP_REPO/" 2>/dev/null || echo "  install-cpanel.php (not found)"
cp "$TS_REPO/install-production.sh" "$PHP_REPO/" 2>/dev/null || echo "  install-production.sh (not found)"
cp "$TS_REPO/install-vps.sh" "$PHP_REPO/" 2>/dev/null || echo "  install-vps.sh (not found)"
cp "$TS_REPO/setup-cpanel.sh" "$PHP_REPO/" 2>/dev/null || echo "  setup-cpanel.sh (not found)"
cp "$TS_REPO/QUICK_INSTALL.sh" "$PHP_REPO/" 2>/dev/null || echo "  QUICK_INSTALL.sh (not found)"

echo "Copying documentation..."
cp "$TS_REPO/CPANEL_INSTALLATION.md" "$PHP_REPO/" 2>/dev/null || echo "  CPANEL_INSTALLATION.md (not found)"
cp "$TS_REPO/DATABASE_SETUP.md" "$PHP_REPO/" 2>/dev/null || echo "  DATABASE_SETUP.md (not found)"
cp "$TS_REPO/DEPLOYMENT_PHP.md" "$PHP_REPO/" 2>/dev/null || echo "  DEPLOYMENT_PHP.md (not found)"
cp "$TS_REPO/ISP_MODULE.md" "$PHP_REPO/" 2>/dev/null || echo "  ISP_MODULE.md (not found)"
cp "$TS_REPO/MULTITENANCY.md" "$PHP_REPO/" 2>/dev/null || echo "  MULTITENANCY.md (not found)"
cp "$TS_REPO/MULTITENANCY_DEVELOPER_GUIDE.md" "$PHP_REPO/" 2>/dev/null || echo "  MULTITENANCY_DEVELOPER_GUIDE.md (not found)"
cp "$TS_REPO/MULTITENANCY_ROUTE_MIGRATION.md" "$PHP_REPO/" 2>/dev/null || echo "  MULTITENANCY_ROUTE_MIGRATION.md (not found)"
cp "$TS_REPO/MULTITENANCY_SETUP.md" "$PHP_REPO/" 2>/dev/null || echo "  MULTITENANCY_SETUP.md (not found)"
cp "$TS_REPO/PHP_MIGRATION.md" "$PHP_REPO/" 2>/dev/null || echo "  PHP_MIGRATION.md (not found)"
cp "$TS_REPO/API.md" "$PHP_REPO/" 2>/dev/null || echo "  API.md (not found)"
cp "$TS_REPO/CONFIG.md" "$PHP_REPO/" 2>/dev/null || echo "  CONFIG.md (not found)"
cp "$TS_REPO/INSTALLATION.md" "$PHP_REPO/" 2>/dev/null || echo "  INSTALLATION.md (not found)"
cp "$TS_REPO/PRODUCTION_SECURITY.md" "$PHP_REPO/" 2>/dev/null || echo "  PRODUCTION_SECURITY.md (not found)"

echo "✓ Files copied"

echo ""
echo -e "${GREEN}Step 4: Creating PHP repo initial commit...${NC}"

cd "$PHP_REPO"

# Stage all files
git add .

# Check if there are changes
if git diff --cached --quiet; then
    echo -e "${YELLOW}No changes to commit${NC}"
else
    # Create initial commit
    git commit -m "Initial commit: NetFlow PHP Backend with Multitenancy

- Multi-tenant architecture with single database
- Automatic tenant isolation on all queries
- ISP billing and monitoring modules
- MikroTik integration
- RESTful API with Slim Framework
- Complete documentation and setup guides
- Installation wizards for cPanel and VPS"

    echo "✓ Created initial commit"
fi

echo ""
echo -e "${GREEN}Step 5: Preparing TypeScript repository cleanup...${NC}"

cd "$TS_REPO"

# Create migration notice
cat > PHP_REPO_NOTICE.md << 'EOF'
# PHP Backend Moved to Separate Repository

The PHP backend for NetFlow has been moved to a separate GitHub repository.

## Repository Separation

- **TypeScript Repository** (this): Frontend and utilities
  - URL: https://github.com/superlitenets/internet-service-ticket
  - Tech: React, TypeScript, Node.js, Vite
  - Deployable to: Fly.io, Vercel, Netlify

- **PHP Repository** (new): ISP management backend
  - URL: https://github.com/superlitenets/php-ticket-superlite
  - Tech: PHP, Slim Framework, PostgreSQL, Multitenancy
  - Deployable to: cPanel, VPS, Docker

## Migration Status

✅ PHP backend separated and moved  
✅ Multitenancy fully implemented in PHP backend  
⏳ TypeScript frontend needs multitenancy UI updates  

## Next Steps

1. **Clone PHP backend repo** for local PHP development
2. **Update TypeScript frontend** to support multitenancy UI
3. **Configure deployment pipelines** for both repositories
4. **Update documentation** with new repository links

## Development Setup

### For PHP Backend Development
```bash
git clone https://github.com/superlitenets/php-ticket-superlite.git
cd php-ticket-superlite
composer install
# See INSTALLATION.md for full setup
```

### For TypeScript Frontend Development
```bash
# You're already here!
pnpm install
pnpm dev
```

## Important Notes

- Both repositories share the same database
- PHP backend requires PostgreSQL
- TypeScript frontend can use Node.js backend OR connect to PHP backend
- Deployment is now independent for each

For more information, see the README in each repository.
EOF

echo "✓ Created PHP_REPO_NOTICE.md"

echo ""
echo -e "${YELLOW}=========================================="
echo "Next Steps:"
echo "=========================================${NC}"
echo ""
echo "1. Review the PHP repository:"
echo "   ls -la $PHP_REPO"
echo ""
echo "2. Push PHP repository to GitHub:"
echo "   cd $PHP_REPO"
echo "   git push -u origin main"
echo ""
echo "3. Clean TypeScript repository (remove PHP files):"
echo "   cd $TS_REPO"
echo "   git rm -r app core cron database helpers public views"
echo "   git rm -f *.php install-*.sh setup-*.sh QUICK_INSTALL.sh .env.example.php composer.*"
echo "   git rm -f CPANEL_INSTALLATION.md DATABASE_SETUP.md DEPLOYMENT_PHP.md ISP_MODULE.md"
echo "   git rm -f MULTITENANCY*.md PHP_MIGRATION.md"
echo "   git add PHP_REPO_NOTICE.md"
echo "   git commit -m 'Remove PHP backend (moved to separate repo)'"
echo "   git push origin main"
echo ""
echo -e "${GREEN}Separation script completed!${NC}"
echo ""
