# PHP & TypeScript Project Separation Guide

This guide helps you separate the PHP and TypeScript projects into different GitHub repositories.

## Current Status

- **TypeScript Repo**: https://github.com/superlitenets/internet-service-ticket
- **PHP Repo (New)**: https://github.com/superlitenets/php-ticket-superlite

## Files to Move to PHP Repo

### PHP Application Files

```
app/
├── integrations.php
├── isp-billing.php
├── isp-customer-portal.php
├── isp-mikrotik.php
├── isp-monitoring.php
├── isp-reports.php
├── multitenancy.php
├── routes-extended.php
└── routes.php

core/
├── Database.php
└── TenantContext.php

cron/
└── isp-billing-automation.php

database/
├── create-admin.php
├── isp-schema.sql
├── migrate.php
├── multitenancy-migration.sql
└── schema.sql

helpers/
└── Auth.php

public/
└── index.php

views/
├── dashboard.php
├── index.php
├── layout.php
├── admin/
│   └── dashboard.php
├── auth/
│   ├── login.php
│   └── register.php
└── customer/
    └── portal.php
```

### Configuration Files (PHP Specific)

```
.env.example.php
composer.json
```

### PHP Documentation

```
CPANEL_INSTALLATION.md
DATABASE_SETUP.md
DEPLOYMENT_PHP.md
ISP_MODULE.md
INSTALLATION.md (PHP specific parts)
MULTITENANCY.md
MULTITENANCY_DEVELOPER_GUIDE.md
MULTITENANCY_ROUTE_MIGRATION.md
MULTITENANCY_SETUP.md
PRODUCTION_GO_LIVE_CHECKLIST.md (PHP specific parts)
PRODUCTION_SECURITY.md (PHP specific parts)
PHP_MIGRATION.md
```

### Scripts

```
install-cpanel.php
install-production.sh
install-vps.sh
setup-cpanel.sh
QUICK_INSTALL.sh
```

## Step-by-Step Migration

### Step 1: Clone Both Repositories

```bash
# Clone existing TypeScript repo
git clone https://github.com/superlitenets/internet-service-ticket.git ts-netflow
cd ts-netflow

# Initialize PHP repo locally
mkdir php-netflow
cd php-netflow
git init
git remote add origin https://github.com/superlitenets/php-ticket-superlite.git
```

### Step 2: Create PHP Repository Structure

In your `php-netflow` directory, create:

```bash
# Create directories
mkdir -p app core cron database helpers public views/{admin,auth,customer} docs

# Add .gitignore
cat > .gitignore << 'EOF'
vendor/
.env
.DS_Store
*.log
node_modules/
dist/
build/
.env.local
.env.*.local
EOF

# Add README
cat > README.md << 'EOF'
# NetFlow ISP Management System - PHP Backend

Multi-tenant ISP management platform built with PHP, Slim Framework, and PostgreSQL.

## Features

- Multi-tenant architecture (single database)
- ISP billing automation
- MikroTik integration
- Customer portal
- Real-time monitoring
- RESTful API

## Installation

See INSTALLATION.md for setup instructions.

## Documentation

- [Installation](INSTALLATION.md)
- [Deployment](DEPLOYMENT_PHP.md)
- [Multitenancy](MULTITENANCY.md)
- [ISP Module](ISP_MODULE.md)
- [API Documentation](API.md)

## License

MIT
EOF
```

### Step 3: Copy PHP Files from TypeScript Repo

```bash
# From ts-netflow directory, copy PHP files to php-netflow

# Copy application files
cp -r app core cron database helpers public views ../php-netflow/

# Copy PHP configuration files
cp .env.example.php composer.json ../php-netflow/

# Copy PHP-specific scripts
cp install-cpanel.php install-production.sh install-vps.sh setup-cpanel.sh QUICK_INSTALL.sh ../php-netflow/

# Copy PHP documentation
cp CPANEL_INSTALLATION.md DATABASE_SETUP.md DEPLOYMENT_PHP.md ISP_MODULE.md \
   MULTITENANCY.md MULTITENANCY_DEVELOPER_GUIDE.md MULTITENANCY_ROUTE_MIGRATION.md \
   MULTITENANCY_SETUP.md PHP_MIGRATION.md ../php-netflow/
```

### Step 4: Add PHP-Specific Files

In the PHP repo, create or add:

```bash
cd ../php-netflow

# Create main entry point
cat > public/index.php << 'EOF'
<?php
// Already exists - no changes needed
require_once __DIR__ . '/../vendor/autoload.php';
// ... rest of index.php content
EOF

# Create .htaccess for Apache
cat > public/.htaccess << 'EOF'
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^ index.php [QSA,L]
</IfModule>
EOF

# Create Docker setup (optional)
cat > Dockerfile << 'EOF'
FROM php:8.2-fpm
# Add PHP extensions, composer installation, etc.
EOF

cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  php:
    build: .
    ports:
      - "9000:9000"
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: netflow_user
      POSTGRES_PASSWORD: netflow_password
      POSTGRES_DB: netflow_db
    ports:
      - "5432:5432"
EOF
```

### Step 5: Initial Commit to PHP Repo

```bash
cd ../php-netflow

# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: NetFlow PHP Backend with Multitenancy

- Multi-tenant architecture with single database
- ISP billing and monitoring modules
- MikroTik integration
- RESTful API
- Complete documentation"

# Push to new repository
git branch -M main
git push -u origin main
```

### Step 6: Clean Up TypeScript Repository

Back in the TypeScript repo, remove PHP files:

```bash
cd ../ts-netflow

# Remove PHP files
rm -rf app core cron database helpers public views
rm -rf *.php install-*.sh setup-*.sh QUICK_INSTALL.sh
rm -rf .env.example.php composer.json composer.lock

# Remove PHP-specific documentation
rm -f CPANEL_INSTALLATION.md DATABASE_SETUP.md DEPLOYMENT_PHP.md ISP_MODULE.md \
      MULTITENANCY.md MULTITENANCY_DEVELOPER_GUIDE.md MULTITENANCY_ROUTE_MIGRATION.md \
      MULTITENANCY_SETUP.md PHP_MIGRATION.md

# Remove PHP-specific config
rm -f docker-compose.yml .env.example.php

# Create a migration notice
cat > PHP_REPO_NOTICE.md << 'EOF'
# PHP Backend Moved

The PHP backend has been moved to a separate repository:

**https://github.com/superlitenets/php-ticket-superlite**

This repository now contains only the TypeScript frontend and Node.js backend.

## Repository Structure

- **TypeScript Repo** (this): Frontend and Node.js backend
  - Location: https://github.com/superlitenets/internet-service-ticket
  - Tech: React, TypeScript, Node.js, Vite

- **PHP Repo** (separate): PHP backend for ISP management
  - Location: https://github.com/superlitenets/php-ticket-superlite
  - Tech: PHP, Slim Framework, PostgreSQL, Multitenancy

For development setup, see the README in the appropriate repository.
EOF

# Stage changes
git add .

# Commit cleanup
git commit -m "Remove PHP backend (moved to separate repo)

PHP backend has been separated into:
https://github.com/superlitenets/php-ticket-superlite

This repository now contains only:
- React frontend
- TypeScript client code
- Node.js utilities"

# Push changes
git push origin main
```

## Verification Checklist

### PHP Repo (php-ticket-superlite)

- [ ] All PHP files present
- [ ] composer.json exists with dependencies
- [ ] .env.example.php present
- [ ] Installation and deployment docs present
- [ ] Database migrations and schemas present
- [ ] All route files present
- [ ] Multitenancy files present

### TypeScript Repo (internet-service-ticket)

- [ ] No PHP files remain
- [ ] No composer.json
- [ ] No public/index.php
- [ ] Client and server directories intact
- [ ] package.json and pnpm-lock.yaml present
- [ ] TypeScript configuration intact
- [ ] Client pages and components intact
- [ ] Migration notice present

## Post-Migration Steps

1. **Update documentation** in both repos with repository-specific instructions
2. **Update CI/CD pipelines** if applicable
3. **Create separate issue templates** for each repo
4. **Update wiki/docs** to reference both repositories
5. **Create development setup guides** for each repo
6. **Consider monorepo** if you want shared types between PHP and TypeScript

## Deployment

### PHP Backend

- Deploy from `php-ticket-superlite` repo
- Use CPANEL_INSTALLATION.md or DEPLOYMENT_PHP.md
- Requires PostgreSQL database
- Requires PHP 7.4+

### TypeScript Frontend

- Deploy from `internet-service-ticket` repo
- Use existing Fly.io or Vercel setup
- Node.js 18+

## Benefits of Separation

✅ **Cleaner code organization** - Each repo has single responsibility  
✅ **Independent deployment** - Update frontend/backend separately  
✅ **Technology flexibility** - Choose best tools for each  
✅ **Team scaling** - Separate teams can work independently  
✅ **Easier CI/CD** - Repository-specific pipelines  
✅ **Version control** - Cleaner history without mixed concerns

## Questions?

Refer to respective repository documentation or README files.
