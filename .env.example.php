# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=netflow_db
DB_USER=netflow_user
DB_PASSWORD=your_secure_password_here
DB_TYPE=pgsql

# Application Configuration
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomai.com
APP_KEY=your_app_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRY=86400

# API Keys
MPESA_CONSUMER_KEY=your_mpesa_key
MPESA_CONSUMER_SECRET=your_mpesa_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey

SMS_API_KEY=your_sms_api_key
SMS_ENDPOINT=https://api.sms-provider.com

# MikroTik Configuration
MIKROTIK_API_HOST=localhost
MIKROTIK_API_PORT=8728
MIKROTIK_API_USER=admin
MIKROTIK_API_PASSWORD=

# Session Configuration
SESSION_TIMEOUT=3600
SESSION_NAME=netflow_session

# Mail Configuration (Optional)
MAIL_HOST=localhost
MAIL_PORT=587
MAIL_USER=
MAIL_PASSWORD=
MAIL_FROM=noreply@netflow.local

# File Uploads
MAX_UPLOAD_SIZE=10485760
UPLOAD_DIR=storage/uploads

# Logging
LOG_LEVEL=info
LOG_FILE=storage/logs/app.log
