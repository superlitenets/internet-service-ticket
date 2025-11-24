# Multitenancy Setup Guide

This guide walks you through enabling and configuring multitenancy in NetFlow.

## Prerequisites

- PostgreSQL database with NetFlow schema installed
- PHP 7.4+ with PDO extension
- Existing NetFlow installation

## Step 1: Run Migration

Apply the multitenancy schema changes to your database:

```bash
# Using psql
psql -U netflow_user -d netflow_db < database/multitenancy-migration.sql

# Or using PHP script
php database/migrate.php
```

Verify the migration was successful:

```bash
psql -U netflow_user -d netflow_db -c "\dt tenants"
psql -U netflow_user -d netflow_db -c "\d users" | grep tenant_id
```

## Step 2: Create Initial Tenants

Create tenants for your organization(s):

### Option A: Via API

Create a superadmin user first (if not exists):

```php
// database/create-admin.php
$hashedPassword = password_hash('admin123', PASSWORD_BCRYPT);
Database::execute(
  'INSERT INTO users (username, email, password, full_name, role, tenant_id) VALUES (?, ?, ?, ?, ?, ?)',
  ['admin', 'admin@example.com', $hashedPassword, 'Admin', 'admin', 1]
);
```

Then use the API:

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }' | jq .data.token

# Create tenant (replace TOKEN with response)
curl -X POST http://localhost:3000/api/tenants/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ACME ISP",
    "slug": "acme-isp",
    "subdomain": "acme"
  }'
```

### Option B: Via Database

Insert directly:

```sql
INSERT INTO tenants (name, slug, subdomain, is_default, status) VALUES
  ('ACME ISP', 'acme-isp', 'acme', false, 'active'),
  ('Global Telecom', 'global-telecom', 'global', false, 'active'),
  ('Default Tenant', 'default', 'default', true, 'active');

-- Verify
SELECT * FROM tenants;
```

## Step 3: Migrate Existing Data

If migrating from single to multi-tenant setup:

### Assign Users to Tenant

```sql
-- Get the default/first tenant
SELECT id FROM tenants ORDER BY id LIMIT 1;

-- Assign all users to tenant
UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Verify
SELECT COUNT(*) as users_assigned FROM users WHERE tenant_id = 1;
```

### Assign All Data Tables

```sql
-- Customers
UPDATE customers SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Leads
UPDATE leads SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Packages
UPDATE packages SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Invoices
UPDATE invoices SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Continue for all tenant-aware tables...
```

Or use a script:

```php
<?php
$tenant_tables = [
    'users', 'leads', 'customers', 'packages', 'customer_packages',
    'invoices', 'payments', 'employees', 'attendance', 'inventory',
    'tickets', 'ticket_replies', 'settings', 'audit_logs',
    'isp_packages', 'isp_services', 'isp_billing_cycles'
];

foreach ($tenant_tables as $table) {
    Database::execute("UPDATE $table SET tenant_id = 1 WHERE tenant_id IS NULL");
}
?>
```

## Step 4: Configure DNS/Subdomains

For subdomain-based tenant detection:

### Local Development

Add to `/etc/hosts`:

```
127.0.0.1 localhost
127.0.0.1 acme.localhost
127.0.0.1 global.localhost
```

### Production

Create DNS records for each tenant:

```
acme.myapp.com          A  192.168.1.100
global.myapp.com        A  192.168.1.100
*.myapp.com             A  192.168.1.100
```

Configure web server to handle all subdomains:

**Nginx:**
```nginx
server {
    server_name ~^(?<tenant>.+)\.myapp\.com$ myapp.com;
    
    location / {
        # Pass to PHP
        fastcgi_pass php-fpm;
    }
}
```

**Apache:**
```apache
<VirtualHost *:80>
    ServerName myapp.com
    ServerAlias *.myapp.com
    
    DocumentRoot /var/www/netflow/public
</VirtualHost>
```

## Step 5: Test Multitenancy

### Test 1: Create Tenant-Specific Users

```bash
# Create user for ACME ISP (via acme.myapp.com subdomain)
curl -X POST http://acme.localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "acme_admin",
    "email": "admin@acme.local",
    "password": "password123",
    "full_name": "ACME Admin"
  }'

# Create user for Global Telecom (via global.myapp.com subdomain)
curl -X POST http://global.localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "global_admin",
    "email": "admin@global.local",
    "password": "password123",
    "full_name": "Global Admin"
  }'
```

### Test 2: Verify Data Isolation

```bash
# Login as ACME user
TOKEN1=$(curl -X POST http://acme.localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme.local",
    "password": "password123"
  }' | jq -r '.data.token')

# Get ACME customers
curl -X GET http://acme.localhost:3000/api/customers \
  -H "Authorization: Bearer $TOKEN1" | jq '.'

# Login as Global user
TOKEN2=$(curl -X POST http://global.localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@global.local",
    "password": "password123"
  }' | jq -r '.data.token')

# Get Global customers
curl -X GET http://global.localhost:3000/api/customers \
  -H "Authorization: Bearer $TOKEN2" | jq '.'

# Results should be different - each tenant sees only their data
```

### Test 3: API Key Access

```bash
# Create API key for ACME
ACME_KEY=$(curl -X POST http://acme.localhost:3000/api/tenant-api-keys/create \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"key_name": "ACME Integration"}' | jq -r '.data.api_key')

# Use API key
curl -X GET http://acme.localhost:3000/api/customers \
  -H "X-API-Key: $ACME_KEY" | jq '.'

# Try same key on different tenant (should fail)
curl -X GET http://global.localhost:3000/api/customers \
  -H "X-API-Key: $ACME_KEY" | jq '.'
```

## Step 6: Configure Application

### Environment Variables

No changes needed to existing `.env` configuration.

### Update Installation Wizard

For the web installer (`install-cpanel.php`), add tenant creation:

```php
// After database setup
$tenant = TenantContext::createTenant([
    'name' => $_POST['company_name'] ?? 'Default Company',
    'slug' => strtolower(preg_replace('/[^a-z0-9]+/', '-', $_POST['company_name'])),
    'subdomain' => strtolower(preg_replace('/[^a-z0-9]+/', '-', $_POST['company_name']))
]);

$_SESSION['tenant_id'] = $tenant['id'];
```

### Update Cron Jobs

Modify cron jobs to work with tenant context:

```php
// cron/isp-billing-automation.php
use Core\TenantContext;

// Process each active tenant
$tenants = Database::fetchAllWithTenantIsolationDisabled(
  'SELECT id FROM tenants WHERE status = ?',
  ['active']
);

foreach ($tenants as $tenant) {
    TenantContext::setTenant($tenant['id']);
    // Run billing logic
}
```

## Step 7: Production Deployment

### Database Backup

```bash
# Backup entire database
pg_dump -U netflow_user netflow_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
pg_dump -U netflow_user -t tenants -t users netflow_db > tenants_backup.sql
```

### Security Considerations

1. **API Keys**: Store in secure vault (HashiCorp Vault, AWS Secrets Manager)
2. **Tenant Isolation**: Always verify tenant context in production
3. **CORS**: Update CORS headers to include tenant subdomains
4. **Rate Limiting**: Implement per-tenant rate limiting
5. **Audit Logs**: Log all cross-tenant access attempts

### Monitoring

Set up alerts for:
- Unusual access patterns
- Cross-tenant query attempts
- API key usage spikes
- Failed authentication attempts

## Troubleshooting

### Issue: "No tenant context" errors

**Solution:** Verify tenant identification method:

```bash
# Check JWT token
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <token>" | jq '.'

# Check subdomain configuration
host acme.myapp.com
nslookup global.myapp.com

# Check X-Tenant-ID header
curl -X GET http://localhost:3000/api/customers \
  -H "X-Tenant-ID: 1"
```

### Issue: Data isolation not working

**Verify migration:**
```bash
psql -U netflow_user -d netflow_db -c "
  SELECT column_name FROM information_schema.columns 
  WHERE table_name = 'customers' AND column_name = 'tenant_id'
"
```

**Check tenant isolation is enabled:**
```php
// In your code
echo \Core\Database::$enforce_tenant_isolation ? 'Enabled' : 'Disabled';
```

### Issue: Users can't access tenant data

**Verify user has tenant_id:**
```bash
psql -U netflow_user -d netflow_db -c "
  SELECT id, email, tenant_id FROM users WHERE email = 'user@example.com'
"
```

**Verify JWT includes tenant_id:**
```php
$token = Auth::generateToken($user);
$decoded = Auth::verifyToken($token);
echo json_encode($decoded);
```

## Next Steps

1. Review [MULTITENANCY.md](MULTITENANCY.md) for API documentation
2. Implement tenant-specific features
3. Set up monitoring and alerts
4. Create tenant management UI
5. Implement billing per tenant
6. Add tenant-specific branding/customization

## Support

For issues or questions:
1. Check logs: `tail -f /var/log/netflow.log`
2. Enable debug mode: `APP_DEBUG=true` in `.env`
3. Review database queries: Enable query logging in PostgreSQL
4. Contact support with relevant logs and configuration
