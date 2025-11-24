# NetFlow Configuration Guide

## Environment Variables

The `.env` file contains all configuration for your NetFlow installation. Create this file in the root directory based on `.env.example.php`.

## Application Settings

### APP_ENV
- **Type**: String
- **Values**: `production`, `development`, `testing`
- **Default**: `production`
- **Description**: Application environment mode
- **Note**: Use `development` for debugging, `production` for live systems

### APP_DEBUG
- **Type**: Boolean
- **Values**: `true`, `false`
- **Default**: `false`
- **Description**: Enable/disable debug mode
- **Warning**: Never enable in production!

### APP_URL
- **Type**: String
- **Example**: `https://yourdomain.com`
- **Description**: Your application's base URL
- **Note**: Must include protocol (https://)

### APP_KEY
- **Type**: String
- **Generated**: `php database/migrate.php` or installer
- **Description**: Application encryption key
- **Note**: Used for securing tokens and sessions

## Database Configuration

### DB_HOST
- **Type**: String
- **Default**: `localhost`
- **Description**: Database server hostname/IP
- **Examples**:
  - `localhost` - Local connection
  - `127.0.0.1` - Loopback IP
  - `db.example.com` - Remote server
  - `10.0.0.5` - Network IP

### DB_PORT
- **Type**: Integer
- **PostgreSQL Default**: `5432`
- **MySQL Default**: `3306`
- **Description**: Database server port

### DB_NAME
- **Type**: String
- **Default**: `netflow_db`
- **Description**: Database name
- **Note**: Must be created before installation

### DB_USER
- **Type**: String
- **Default**: `netflow_user`
- **Description**: Database username
- **Required Privileges**:
  - CREATE
  - SELECT
  - INSERT
  - UPDATE
  - DELETE
  - ALTER

### DB_PASSWORD
- **Type**: String
- **Description**: Database user password
- **Security**: Use strong passwords (12+ characters, mixed case, numbers, symbols)
- **URL Encoding**: Special characters must be URL-encoded
  - `#` → `%23`
  - `@` → `%40`
  - `!` → `%21`

### DB_TYPE
- **Type**: String
- **Values**: `pgsql`, `mysql`
- **Default**: `pgsql`
- **Description**: Database system type
- **Note**: PostgreSQL recommended for better features

## Authentication Settings

### JWT_SECRET
- **Type**: String
- **Length**: Minimum 32 characters
- **Description**: Secret key for JWT token signing
- **Generated**: Automatically by installer
- **Never**: Share or commit this to version control!

### JWT_ALGORITHM
- **Type**: String
- **Values**: `HS256`, `HS384`, `HS512`, `RS256`
- **Default**: `HS256`
- **Description**: JWT signing algorithm

### JWT_EXPIRY
- **Type**: Integer (seconds)
- **Default**: `86400` (24 hours)
- **Examples**:
  - `3600` = 1 hour
  - `86400` = 24 hours
  - `604800` = 7 days
- **Description**: Token expiration time

## Session Settings

### SESSION_TIMEOUT
- **Type**: Integer (seconds)
- **Default**: `3600` (1 hour)
- **Description**: Session inactivity timeout
- **Note**: User will be logged out after inactivity

### SESSION_NAME
- **Type**: String
- **Default**: `netflow_session`
- **Description**: Session cookie name
- **Note**: Change this in shared hosting environments

## File Upload Settings

### MAX_UPLOAD_SIZE
- **Type**: Integer (bytes)
- **Default**: `10485760` (10 MB)
- **Examples**:
  - `1048576` = 1 MB
  - `5242880` = 5 MB
  - `10485760` = 10 MB
  - `52428800` = 50 MB

### UPLOAD_DIR
- **Type**: String (path)
- **Default**: `storage/uploads`
- **Description**: Directory for user file uploads
- **Note**: Must be writable by PHP

## Logging Settings

### LOG_LEVEL
- **Type**: String
- **Values**: `debug`, `info`, `warning`, `error`, `critical`
- **Default**: `info`
- **Description**: Minimum log level to record

### LOG_FILE
- **Type**: String (path)
- **Default**: `storage/logs/app.log`
- **Description**: Application log file location
- **Note**: Must be writable by PHP

## M-Pesa Integration

### MPESA_CONSUMER_KEY
- **Type**: String
- **Source**: M-Pesa Developer Portal
- **Description**: M-Pesa API consumer key

### MPESA_CONSUMER_SECRET
- **Type**: String
- **Source**: M-Pesa Developer Portal
- **Description**: M-Pesa API consumer secret
- **Security**: Keep secret!

### MPESA_SHORTCODE
- **Type**: String
- **Example**: `174379`
- **Description**: Your M-Pesa business shortcode

### MPESA_PASSKEY
- **Type**: String
- **Description**: M-Pesa STK Push passkey
- **Source**: M-Pesa Developer Portal

### MPESA_ENVIRONMENT
- **Type**: String
- **Values**: `sandbox`, `production`
- **Default**: `sandbox`
- **Description**: M-Pesa API environment

## SMS Integration

### SMS_API_KEY
- **Type**: String
- **Description**: SMS provider API key
- **Supported Providers**:
  - Africa's Talking
  - Twilio
  - Nexmo
  - AWS SNS

### SMS_ENDPOINT
- **Type**: String
- **Example**: `https://api.sms-provider.com/send`
- **Description**: SMS API endpoint URL

## MikroTik Integration

### MIKROTIK_API_HOST
- **Type**: String
- **Default**: `localhost`
- **Description**: MikroTik RouterOS API hostname/IP

### MIKROTIK_API_PORT
- **Type**: Integer
- **Default**: `8728`
- **Description**: MikroTik API port
- **Note**: Secure API uses port 8729

### MIKROTIK_API_USER
- **Type**: String
- **Description**: MikroTik API username
- **Required Permissions**:
  - Read system resources
  - Read interface data
  - Read IP firewall
  - Read queues

### MIKROTIK_API_PASSWORD
- **Type**: String
- **Description**: MikroTik API user password
- **Security**: Use strong password

## Email Configuration (Optional)

### MAIL_HOST
- **Type**: String
- **Example**: `smtp.gmail.com`
- **Description**: SMTP server hostname

### MAIL_PORT
- **Type**: Integer
- **Default**: `587` (TLS) or `465` (SSL)
- **Description**: SMTP server port

### MAIL_USER
- **Type**: String
- **Description**: SMTP authentication username

### MAIL_PASSWORD
- **Type**: String
- **Description**: SMTP authentication password

### MAIL_FROM
- **Type**: String
- **Example**: `noreply@yourdomain.com`
- **Description**: Default sender email address

## Advanced Settings

### APP_TIMEZONE
- **Type**: String
- **Default**: `UTC`
- **Examples**: `Africa/Nairobi`, `America/New_York`
- **Reference**: https://www.php.net/manual/en/timezones.php

### CACHE_DRIVER
- **Type**: String
- **Values**: `file`, `redis`, `memcached`
- **Default**: `file`
- **Description**: Cache storage driver

### QUEUE_DRIVER
- **Type**: String
- **Values**: `sync`, `database`, `redis`
- **Default**: `sync`
- **Description**: Job queue driver

## Security Best Practices

### 1. Environment File Protection
```bash
# Make .env readable only by owner
chmod 600 .env

# Prevent .env from being served
# (Already configured in .htaccess)
```

### 2. Database Password Security
- Use strong passwords (minimum 12 characters)
- Include uppercase, lowercase, numbers, and symbols
- Regenerate passwords every 90 days
- Never reuse old passwords

### 3. API Key Security
- Regenerate API keys annually
- Immediately revoke compromised keys
- Store in environment variables only
- Never log API keys

### 4. JWT Secret
- Generate with cryptographically secure method
- Minimum 32 characters
- Rotate annually
- Different secret for each environment

### 5. HTTPS Only
- Always use HTTPS in production
- Enable HSTS header
- Renew SSL certificate before expiration

## Database-Specific Configuration

### PostgreSQL

**Connection String:**
```env
DB_TYPE=pgsql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=netflow_db
DB_USER=netflow_user
DB_PASSWORD=your_password
```

**Recommended Settings:**
```sql
-- Connection pooling
max_connections = 100

-- Query optimization
shared_buffers = 256MB
work_mem = 16MB

-- Logging
log_connections = on
log_statement = 'all'
```

### MySQL

**Connection String:**
```env
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_NAME=netflow_db
DB_USER=netflow_user
DB_PASSWORD=your_password
```

**Recommended Settings:**
```sql
-- Performance
max_connections = 100
query_cache_size = 256MB

-- Charset
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci
```

## Configuration Examples

### Development Environment
```env
APP_ENV=development
APP_DEBUG=true
LOG_LEVEL=debug
DB_HOST=localhost
JWT_EXPIRY=86400
```

### Production Environment
```env
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=warning
DB_HOST=db.prod.example.com
JWT_EXPIRY=3600
APP_URL=https://yourdomain.com
```

### High-Traffic Production
```env
CACHE_DRIVER=redis
QUEUE_DRIVER=redis
DB_HOST=db.prod.example.com
DB_REPLICA=replica.prod.example.com
LOG_LEVEL=error
JWT_EXPIRY=1800
```

## Troubleshooting Configuration Issues

### Database Connection Failed
1. Verify hostname, port, and database name
2. Check database user exists and has proper privileges
3. Test from command line:
   ```bash
   psql -h localhost -U netflow_user -d netflow_db
   ```

### JWT Token Errors
1. Ensure JWT_SECRET is set and consistent
2. Check JWT_EXPIRY is reasonable
3. Verify time sync between servers

### M-Pesa Integration Not Working
1. Verify API credentials are correct
2. Check sandbox vs. production environment
3. Ensure shortcode and passkey match

### File Upload Failures
1. Check directory permissions (755)
2. Verify disk space available
3. Confirm MAX_UPLOAD_SIZE matches web server limit

### Email Not Sending
1. Verify SMTP credentials
2. Check firewall allows SMTP port
3. Test SMTP connection manually

## Configuration Validation

Run this command to validate your configuration:

```bash
php -r "require 'vendor/autoload.php'; 
\$dotenv = new \Dotenv\Dotenv(__DIR__);
\$dotenv->load();
echo 'Environment: ' . \$_ENV['APP_ENV'] . PHP_EOL;
echo 'Database: ' . \$_ENV['DB_NAME'] . '@' . \$_ENV['DB_HOST'] . PHP_EOL;
echo 'Configuration loaded successfully!';
"
```

---

For more help, see [CPANEL_INSTALLATION.md](CPANEL_INSTALLATION.md) or contact support.
