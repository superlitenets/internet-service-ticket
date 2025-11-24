# NetFlow - ISP Management System (PHP Edition)

NetFlow is a comprehensive ISP (Internet Service Provider) management system built with PHP, designed for managing customers, billing, inventory, support tickets, and more. This PHP edition is fully optimized for cPanel hosting environments.

## 🎯 Features

### Core Functionality
- **Customer Management**: Manage customer profiles, packages, and billing information
- **Billing System**: Automated invoicing and payment processing
- **Lead Management**: Track and manage potential customers
- **Ticket System**: Support ticket management with replies and tracking
- **Inventory Management**: Track products and inventory levels
- **Attendance Tracking**: Employee attendance and HR management
- **Financial Reports**: Revenue analytics and customer statistics

### Payment Integration
- **M-Pesa Integration**: Mobile money payment processing
- **Payment Gateway**: Multiple payment method support
- **Invoice Management**: Automated invoice generation and tracking
- **Payment Tracking**: Monitor payment status and history

### Communication
- **SMS Integration**: Send SMS notifications to customers
- **Email Notifications**: Automated email alerts
- **Ticket Support**: Multi-channel customer support system

### Network Management
- **MikroTik Integration**: RouterOS device management
- **Bandwidth Monitoring**: Real-time bandwidth usage tracking
- **Network Analytics**: Performance monitoring and reporting

### Security
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin and user roles
- **Audit Logging**: Track all system changes
- **SSL/HTTPS Support**: Secure data transmission

## 📋 System Requirements

### Server Requirements
- **PHP**: 8.1 or higher
- **Database**: PostgreSQL 12+ or MySQL 8.0+
- **Web Server**: Apache 2.4+ (with mod_rewrite) or Nginx
- **Extensions**: PDO, JSON, CURL, OpenSSL

### Installation Requirements
- Composer (PHP dependency manager)
- SSH/Terminal access (for CLI setup) or cPanel File Manager (for web setup)

## 🚀 Quick Start

### Option 1: Automated Installation (Recommended)

```bash
# Run the cPanel installer
php install-cpanel.php

# Or via web browser:
# Visit: https://yourdomain.com/install-cpanel.php
```

### Option 2: Manual Installation

```bash
# 1. Install dependencies
composer install --no-dev --optimize-autoloader

# 2. Create environment file
cp .env.example.php .env
# Edit .env with your database credentials

# 3. Run database migrations
php database/migrate.php

# 4. Set file permissions
chmod 755 storage
chmod 755 storage/logs
chmod 755 storage/uploads
```

### Option 3: cPanel Automated Script

```bash
# Run the setup script (requires root/sudo access)
sudo bash setup-cpanel.sh cpanel_username
```

## 🏗️ Project Structure

```
netflow-php/
├── public/                 # Web root (served to users)
│   ├── index.php          # Application entry point
│   └── .htaccess          # Apache rewrite rules
├── app/                   # Application code
│   ├── routes.php         # Core API routes
│   ├── routes-extended.php # Additional routes
│   └── integrations.php   # External integrations
├── core/                  # Core classes
│   └── Database.php       # Database connection layer
├── helpers/               # Helper classes
│   └── Auth.php          # Authentication helper
├── database/              # Database files
│   ├── schema.sql        # Database schema
│   └── migrate.php       # Migration script
├── storage/               # Runtime files
│   ├── logs/             # Application logs
│   ├── uploads/          # User uploads
│   └── cache/            # Cached data
├── composer.json         # PHP dependencies
├── .env.example.php      # Environment template
├── install-cpanel.php    # Web installer
└── setup-cpanel.sh       # Bash setup script
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/leads/{id}` - Get lead details

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `GET /api/customers/{id}` - Get customer details
- `PUT /api/customers/{id}` - Update customer

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/{id}` - Get invoice

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments` - Create payment

### Tickets
- `GET /api/tickets` - List support tickets
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/{id}` - Get ticket details
- `POST /api/tickets/{id}/replies` - Add ticket reply

### Integrations
- `POST /api/integrations/mpesa/payment` - Initiate M-Pesa payment
- `POST /api/integrations/sms/send` - Send SMS
- `GET /api/integrations/mikrotik/interfaces` - Get MikroTik interfaces
- `GET /api/integrations/mikrotik/bandwidth-usage` - Get bandwidth stats

### Reports & Statistics
- `GET /api/stats/dashboard` - Dashboard statistics
- `GET /api/reports/revenue` - Revenue report
- `GET /api/reports/customers` - Customer statistics

## ⚙️ Configuration

### Environment Variables

Create a `.env` file based on `.env.example.php`:

```env
# Application
APP_ENV=production
APP_URL=https://yourdomain.com
APP_KEY=your_secret_key

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=netflow_db
DB_USER=netflow_user
DB_PASSWORD=your_password
DB_TYPE=pgsql  # or mysql

# JWT
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_EXPIRY=86400

# M-Pesa
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey

# SMS
SMS_API_KEY=your_api_key
SMS_ENDPOINT=https://api.sms-provider.com

# MikroTik
MIKROTIK_API_HOST=localhost
MIKROTIK_API_PORT=8728
MIKROTIK_API_USER=admin
MIKROTIK_API_PASSWORD=password
```

## 🔐 Security

### Best Practices

1. **Environment Variables**: Keep `.env` file secure
   ```bash
   chmod 600 .env
   ```

2. **SSL Certificate**: Always use HTTPS
   - Update `APP_URL` to use `https://`
   - Configure SSL in your web server

3. **Database Backups**: Regular automated backups
   ```bash
   mysqldump -u user -p database > backup.sql
   ```

4. **Keep Updated**: Regularly update dependencies
   ```bash
   composer update
   ```

5. **Monitoring**: Check logs regularly
   ```bash
   tail -f storage/logs/app.log
   ```

## 📝 Usage Examples

### Login

```bash
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Create Customer

```bash
curl -X POST https://yourdomain.com/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+254712345678",
    "account_type": "retail"
  }'
```

### Send SMS

```bash
curl -X POST https://yourdomain.com/api/integrations/sms/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone": "+254712345678",
    "message": "Your invoice is ready for payment"
  }'
```

## 🆘 Troubleshooting

### Database Connection Error
1. Check database credentials in `.env`
2. Verify database user has correct permissions
3. Ensure database server is running

### mod_rewrite Not Working
1. Enable mod_rewrite in Apache
2. Check `.htaccess` is in `public/` directory
3. Verify file permissions: `chmod 644 .htaccess`

### Permission Denied
```bash
chmod 755 storage
chmod 755 storage/logs
chmod 755 storage/uploads
chmod 644 public/.htaccess
```

### Composer Not Found
Contact your hosting provider to install Composer, or use manual deployment.

## 📖 Documentation

- [cPanel Installation Guide](CPANEL_INSTALLATION.md)
- [API Documentation](API.md) *(Coming Soon)*
- [Configuration Guide](CONFIG.md) *(Coming Soon)*

## 🤝 Support

For issues, questions, or feature requests:
- GitHub Issues: https://github.com/yourusername/netflow-php/issues
- Email: support@netflow.local
- Documentation: https://netflow.local/docs

## 📄 License

NetFlow is released under the MIT License. See [LICENSE](LICENSE) file for details.

## 🎓 Credits

Built with:
- **Slim Framework** - PHP microframework
- **PostgreSQL** - Database system
- **JWT** - Secure authentication
- **M-Pesa API** - Payment processing
- **MikroTik API** - Network management

## 🚧 Roadmap

- [ ] Web dashboard UI
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Multi-currency support
- [ ] Automated billing
- [ ] Customer portal
- [ ] API documentation portal
- [ ] Webhook support

## 📞 Contact

- Project Lead: Your Name
- Email: your.email@example.com
- Organization: Your Organization
