# NetFlow ISP Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PHP: 8.2+](https://img.shields.io/badge/PHP-8.2+-blue.svg)](https://www.php.net/)
[![MySQL: 8.0+](https://img.shields.io/badge/MySQL-8.0+-blue.svg)](https://www.mysql.com/)

Complete full-stack ISP management solution built with PHP, HTML/CSS/JavaScript, and MySQL.

## Features

✅ **Multi-Tenant Architecture**

- Single database with tenant isolation
- Support for unlimited ISPs
- Independent branding per tenant

✅ **Customer Management**

- Customer profiles and accounts
- Service management
- Auto-renewal support
- Account balance tracking

✅ **Billing System**

- Automated invoicing
- Payment tracking
- Subscription management
- Overdue payment reminders

✅ **Real-Time Monitoring**

- Bandwidth monitoring
- Usage tracking
- Service status
- Performance metrics

✅ **Support Tickets**

- Customer support tickets
- Internal notes
- Priority-based assignment
- Auto-response system

✅ **Admin Dashboard**

- Comprehensive analytics
- User management
- System settings
- Audit logs

✅ **Responsive Design**

- Mobile-friendly interface
- Works on all devices
- Offline-capable features
- Progressive web app ready

✅ **Security**

- JWT authentication
- Password hashing (bcrypt)
- CSRF protection
- SQL injection prevention
- XSS protection

## Technology Stack

- **Backend**: PHP 8.2+ with Slim Framework
- **Database**: MySQL 8.0+
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Caching**: Redis
- **Web Server**: Nginx
- **Containerization**: Docker & Docker Compose
- **Package Manager**: Composer

## Quick Start

### Using Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/superlitenets/php-ticket-superlite.git
cd php-ticket-superlite

# Start services
docker-compose up -d

# Run migrations
docker-compose exec php php database/migrate.php

# Access application
# Web: http://localhost
# phpMyAdmin: http://localhost:8081
```

### Manual Installation (Ubuntu/Debian)

```bash
# Run installation script
sudo bash install-vps.sh

# Or follow manual installation guide
# See INSTALLATION.md
```

### cPanel Installation

See CPANEL_INSTALLATION.md for cPanel-specific instructions.

## Documentation

- [Installation Guide](INSTALLATION.md) - Detailed setup instructions
- [Deployment Guide](DEPLOYMENT.md) - Production deployment
- [API Documentation](API.md) - REST API reference
- [Architecture Guide](ARCHITECTURE.md) - System architecture

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key variables:

```
APP_NAME=NetFlow
APP_URL=http://localhost:8000
APP_DEBUG=true

DB_HOST=localhost
DB_NAME=netflow_db
DB_USER=netflow_user
DB_PASSWORD=your_secure_password

JWT_SECRET=your_jwt_secret_here
```

See `.env.example` for all configuration options.

## Database Setup

### Using Docker

```bash
docker-compose exec php php database/migrate.php
```

### Manual MySQL

```bash
mysql -u root -p
CREATE DATABASE netflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'netflow_user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON netflow_db.* TO 'netflow_user'@'localhost';
FLUSH PRIVILEGES;

mysql -u netflow_user -p netflow_db < database/schema.sql
```

## API Routes

### Authentication

```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
GET    /api/auth/me             - Get current user
POST   /api/auth/logout         - Logout user
```

### Customers

```
GET    /api/customers           - List customers
POST   /api/customers           - Create customer
GET    /api/customers/{id}      - Get customer
PUT    /api/customers/{id}      - Update customer
```

### Invoices

```
GET    /api/invoices            - List invoices
POST   /api/invoices            - Create invoice
GET    /api/invoices/{id}       - Get invoice
```

### Services

```
GET    /api/services/{customerId} - Get services for customer
```

### Tickets

```
GET    /api/tickets             - List tickets
POST   /api/tickets             - Create ticket
```

### Admin

```
GET    /api/admin/stats         - Dashboard statistics
GET    /api/admin/users         - List users
PUT    /api/admin/users/{id}    - Update user
GET    /api/admin/tenants       - List tenants
POST   /api/admin/tenants       - Create tenant
```

## Directory Structure

```
netflow-php/
├── public/                 # Web root
│   ├── index.php          # Application entry point
│   ├── css/               # Stylesheets
│   └── js/                # Client-side scripts
├── src/                   # Application code
│   ├── Controllers/       # Request handlers
│   ├── Models/            # Data models
│   ├── Services/          # Business logic
│   └── Middleware/        # HTTP middleware
├── views/                 # HTML templates
├── database/              # Database files
├── routes/                # Route definitions
├── config/                # Configuration files
├── docker/                # Docker files
└── storage/               # Logs and cache
```

## Development

### Local Development with Docker

```bash
# Start containers
docker-compose up -d

# View logs
docker-compose logs -f php

# Access shell
docker-compose exec php bash

# Run artisan commands
docker-compose exec php php database/migrate.php
```

### Without Docker

```bash
# Install dependencies
composer install

# Start PHP development server
php -S localhost:8000 -t public

# Run migrations
php database/migrate.php
```

## Deployment

### Docker Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:

- AWS EC2 deployment
- DigitalOcean droplet setup
- Docker Swarm configuration
- Kubernetes deployment

### VPS Deployment

```bash
sudo bash install-vps.sh
```

### cPanel Deployment

See [CPANEL_INSTALLATION.md](CPANEL_INSTALLATION.md)

## Security

- Change JWT_SECRET in production
- Use strong database passwords
- Enable SSL/TLS
- Keep dependencies updated
- Run security audits regularly
- Use Web Application Firewall (WAF)

## Backup & Recovery

```bash
# Backup database
mysqldump -u netflow_user -p netflow_db > backup.sql

# Restore database
mysql -u netflow_user -p netflow_db < backup.sql

# Docker backup
docker-compose exec mysql mysqldump -u netflow_user -p netflow_db > backup.sql
```

## Performance Optimization

- Enable Redis caching
- Configure database indexes
- Enable Gzip compression
- Use CDN for static assets
- Implement pagination
- Monitor slow queries

## Troubleshooting

### PHP-FPM Connection Error

```bash
# Check PHP-FPM status
systemctl status php8.2-fpm

# Restart PHP-FPM
systemctl restart php8.2-fpm
```

### MySQL Connection Error

```bash
# Check MySQL status
systemctl status mysql

# Verify credentials in .env
```

### Permission Errors

```bash
# Fix file permissions
sudo chown -R www-data:www-data /var/www/netflow
chmod -R 755 /var/www/netflow
chmod -R 775 /var/www/netflow/storage
```

## Support

For issues and questions:

- GitHub Issues: [Create an issue](https://github.com/superlitenets/php-ticket-superlite/issues)
- Email: support@netflow.com
- Documentation: https://docs.netflow.com

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Changelog

### v1.0.0 (2024)

- Initial release
- Multi-tenant support
- Full ISP management features
- Admin dashboard
- REST API
- Docker support

## Authors

- **Superlite Nets** - [GitHub](https://github.com/superlitenets)

## Acknowledgments

- Slim Framework
- PHP Community
- Open source contributors
