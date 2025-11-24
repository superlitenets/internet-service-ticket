# NetFlow cPanel Installation Guide

## Overview

NetFlow is now available as a PHP application optimized for cPanel hosting environments. This guide will help you install and configure NetFlow on your cPanel server.

## System Requirements

- **PHP**: 8.1 or higher
- **Database**: PostgreSQL 12+ or MySQL 8.0+
- **Extensions**: 
  - PDO (PHP Data Objects)
  - PDO PostgreSQL/MySQL driver
  - JSON
  - CURL
  - OpenSSL
- **Web Server**: Apache 2.4+ (with mod_rewrite) or Nginx
- **Composer**: For dependency management

## Installation Methods

### Method 1: Automated cPanel Installer (Recommended)

1. **Upload the application files to your hosting:**
   ```bash
   # Via FTP/SFTP or cPanel File Manager
   # Upload all files to your public_html directory
   ```

2. **Run the installation wizard:**
   ```bash
   # Via SSH (if available)
   php install-cpanel.php
   
   # Or via web browser
   # Visit: https://yourdomain.com/install-cpanel.php
   ```

3. **Follow the interactive prompts:**
   - Accept terms
   - Verify system requirements
   - Configure database connection
   - Create admin account
   - Review application settings
   - Complete installation

### Method 2: Manual Installation (Advanced)

1. **Upload files to public_html:**
   ```bash
   cd ~/public_html
   wget https://github.com/yourusername/netflow-php/archive/main.zip
   unzip main.zip
   mv netflow-php-main/* .
   ```

2. **Install dependencies using cPanel Terminal:**
   ```bash
   cd ~/public_html
   composer install --no-dev --optimize-autoloader
   ```

3. **Create .env file:**
   ```bash
   cp .env.example.php .env
   # Edit .env with your database credentials
   nano .env
   ```

4. **Create database:**
   - Via cPanel > MySQL® Databases
   - Create new database
   - Create new user
   - Assign user to database (with all privileges)

5. **Run database migrations:**
   ```bash
   php database/migrate.php
   ```

6. **Set permissions:**
   ```bash
   chmod 755 public
   chmod 755 storage
   chmod 755 storage/logs
   chmod 755 storage/uploads
   ```

7. **Create admin user (optional):**
   ```bash
   php database/create-admin.php
   ```

## cPanel Configuration

### 1. Set Up Document Root

In cPanel:
- Go to **Addon Domains** or **Parked Domains**
- Add your domain pointing to the `public_html/public` directory

### 2. Enable mod_rewrite

1. Go to **Home** > **Performance** > **Apache Modules**
2. Search for `mod_rewrite`
3. Ensure it's enabled (checkmark visible)

### 3. Configure PHP Settings

1. Go to **Home** > **Select PHP Version**
2. Choose PHP 8.1 or higher
3. Click **Switch to PHP-FPM** (if available)
4. Enable extensions:
   - PDO
   - pdo_pgsql (or pdo_mysql)
   - json
   - curl
   - openssl

### 4. Set Up Database

#### Using PostgreSQL:

1. Go to **Home** > **PostgreSQL®** (if available)
2. Create new database
3. Create database user
4. Assign user to database

#### Using MySQL:

1. Go to **Home** > **MySQL® Databases**
2. Create new database (e.g., `yourusername_netflow`)
3. Create new user (e.g., `yourusername_netflow_user`)
4. Assign user with all privileges

### 5. Configure SSL Certificate

1. Go to **Home** > **AutoSSL** or **SSL/TLS Manager**
2. Install a free SSL certificate from Let's Encrypt
3. Update your `.env` file:
   ```env
   APP_URL=https://yourdomain.com
   ```

## Post-Installation

### 1. Access the Application

- Visit: `https://yourdomain.com`
- Login with your admin credentials

### 2. Configure Additional Settings

1. Go to Settings panel
2. Update:
   - Company information
   - API keys (M-Pesa, SMS, MikroTik)
   - Email settings
   - Payment gateway settings

### 3. Set Up Cron Jobs

In cPanel > Cron Jobs, add the following:

**Daily backup:**
```bash
0 2 * * * cd ~/public_html && php cron/backup.php
```

**Weekly stats update:**
```bash
0 3 * * 0 cd ~/public_html && php cron/update-stats.php
```

**Billing automation:**
```bash
0 0 1 * * cd ~/public_html && php cron/billing.php
```

## Troubleshooting

### Issue: 500 Internal Server Error

**Solution:**
1. Check error logs: `~/public_html/storage/logs/app.log`
2. Verify database credentials in `.env`
3. Ensure all directories have correct permissions
4. Check PHP error logs: `~/logs/error_log`

### Issue: Database Connection Failed

**Solution:**
1. Verify database credentials in cPanel
2. Check database hostname (usually localhost)
3. Ensure database user has all privileges
4. Test connection: `php -r "require 'vendor/autoload.php'; Core\Database::connect();"`

### Issue: mod_rewrite not working

**Solution:**
1. Verify mod_rewrite is enabled in cPanel
2. Check if `.htaccess` is in `public_html/public/`
3. Verify file permissions: `chmod 644 .htaccess`

### Issue: Permission Denied

**Solution:**
```bash
# Fix permissions
chmod 755 storage
chmod 755 storage/logs
chmod 755 storage/uploads
chmod 755 storage/cache
chmod 644 public/.htaccess
chmod 644 .env
```

### Issue: Composer Not Found

**Solution:**
1. Contact your hosting provider to install Composer
2. Or use an alternative package manager
3. Or manually upload vendor directory

## Security Best Practices

1. **Keep .env secure:**
   ```bash
   chmod 600 .env
   chmod 600 .env.example.php
   ```

2. **Disable directory listing:**
   - Already configured in `.htaccess`

3. **Enable security headers:**
   - Already configured in `.htaccess`

4. **Regular backups:**
   - Use cPanel backups
   - Export database regularly

5. **Keep PHP updated:**
   - Use latest PHP version in cPanel
   - Enable security patches

6. **Monitor error logs:**
   - Check `~/logs/error_log` regularly
   - Review `storage/logs/app.log`

## Backup and Restore

### Backup via cPanel

1. Go to **Home** > **Backup Wizard**
2. Select **Backup**
3. Choose backup type (Full, Database, Home Directory)
4. Monitor backup progress

### Manual Backup

```bash
# Backup database
mysqldump -u yourusername_netflow_user -p yourusername_netflow > backup_database.sql

# Backup files
tar -czf backup_files.tar.gz ~/public_html
```

### Restore

```bash
# Restore database
mysql -u yourusername_netflow_user -p yourusername_netflow < backup_database.sql

# Restore files
tar -xzf backup_files.tar.gz -C ~/
```

## Support and Documentation

- **Documentation**: https://netflow.local/docs
- **GitHub Repository**: https://github.com/yourusername/netflow-php
- **Issues/Support**: https://github.com/yourusername/netflow-php/issues

## Uninstallation

1. **Via cPanel:**
   - Go to **Addon Domains** and delete the domain
   - Go to **MySQL® Databases** and drop the database
   - Delete the domain directory via File Manager

2. **Via SSH:**
   ```bash
   rm -rf ~/public_html
   # Database cleanup via MySQL commands
   ```

## License

NetFlow is released under the MIT License. See LICENSE file for details.
