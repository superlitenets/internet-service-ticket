# NetFlow Multitenancy Implementation

## Overview

NetFlow now supports **multitenancy with a single database**, allowing multiple distinct tenants (ISPs, organizations, or clients) to use the same application instance while maintaining complete data isolation.

## Architecture

### Single Database, Multiple Tenants

The multitenancy model uses:

- **One database** shared by all tenants
- **Tenant isolation** via `tenant_id` column on all data tables
- **Automatic filtering** of queries by tenant context
- **Multiple identification methods** for tenant determination

### Key Components

1. **TenantContext** (`core/TenantContext.php`)
   - Identifies current tenant from requests
   - Manages tenant state and caching
   - Supports multiple tenant identification methods

2. **Enhanced Database Class** (`core/Database.php`)
   - Automatically adds `tenant_id` filtering to queries
   - Provides tenant-aware insert, update, delete operations
   - Includes helper methods for multitenancy

3. **Multitenancy API** (`app/multitenancy.php`)
   - Tenant management endpoints
   - API key generation and management
   - Tenant settings configuration

## Tenant Identification

The system identifies tenants from multiple sources in this order:

### 1. JWT Token

The JWT token includes a `tenant_id` claim:

```json
{
  "user_id": 123,
  "username": "john",
  "email": "john@example.com",
  "role": "admin",
  "tenant_id": 1
}
```

**Header:** `Authorization: Bearer <token>`

### 2. API Key

Use API keys for programmatic access:

**Header:** `X-API-Key: <api_key>`

### 3. Subdomain

Automatic tenant detection from subdomain:

**Examples:**

- `tenant1.myapp.com` → tenant1
- `acme.myapp.com` → acme

Common subdomains are skipped: `www`, `api`, `admin`, `mail`, `ftp`

### 4. Direct Header

Explicitly specify tenant ID:

**Header:** `X-Tenant-ID: 1`

## Database Schema

### Tenants Table

```sql
CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    subdomain VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    is_default BOOLEAN DEFAULT false,
    features TEXT, -- JSON of enabled features
    max_users INTEGER DEFAULT 10,
    max_customers INTEGER DEFAULT 100,
    storage_limit INTEGER DEFAULT 5120, -- MB
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tenant-Aware Tables

All major tables include a `tenant_id` column:

- users
- leads
- customers
- packages
- invoices
- payments
- employees
- attendance
- inventory
- tickets
- ticket_replies
- settings
- audit_logs
- isp_packages
- isp_services
- isp_billing_cycles
- isp_usage_logs
- isp_service_logs
- isp_dunning_logs
- isp_configurations
- mikrotik_connections
- isp_overage_pricing
- isp_service_changes
- isp_usage_alerts
- isp_promotions
- isp_performance_metrics

### Tenant API Keys Table

```sql
CREATE TABLE tenant_api_keys (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id),
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    secret_key VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Database Migration

Run the multitenancy migration to add tenant support:

```bash
# Using psql
psql -U netflow_user -d netflow_db -f database/multitenancy-migration.sql

# Or through the application
php database/migrate.php
```

## API Endpoints

### Tenant Management

#### Get Current Tenant Info

```
GET /api/tenants/info
Authorization: Bearer <token>
X-Tenant-ID: 1

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Acme ISP",
    "slug": "acme-isp",
    "subdomain": "acme",
    "status": "active",
    "is_default": false,
    "features": "{\"billing\": true, \"monitoring\": true}",
    "max_users": 10,
    "max_customers": 100,
    "storage_limit": 5120
  }
}
```

#### Create New Tenant

```
POST /api/tenants/create
Authorization: Bearer <admin_token>

Body:
{
  "name": "NewCorp ISP",
  "slug": "newcorp",
  "subdomain": "newcorp"
}

Response:
{
  "success": true,
  "data": {
    "id": 2,
    "name": "NewCorp ISP",
    "slug": "newcorp",
    "subdomain": "newcorp",
    "status": "active"
  }
}
```

#### Get Tenant by Slug

```
GET /api/tenants/{slug}

Response:
{
  "success": true,
  "data": { ... }
}
```

#### Update Tenant Settings

```
PUT /api/tenants/settings
Authorization: Bearer <token>
X-Tenant-ID: 1

Body:
{
  "name": "Updated Name",
  "max_users": 50,
  "features": "{\"billing\": true, \"monitoring\": true, \"reports\": true}"
}

Response:
{
  "success": true,
  "data": { ... }
}
```

### API Key Management

#### List API Keys

```
GET /api/tenant-api-keys
Authorization: Bearer <token>
X-Tenant-ID: 1

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key_name": "Integration Key",
      "api_key": "abc123...",
      "is_active": true,
      "last_used": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-01T08:00:00Z"
    }
  ]
}
```

#### Create API Key

```
POST /api/tenant-api-keys/create
Authorization: Bearer <token>
X-Tenant-ID: 1

Body:
{
  "key_name": "Third Party API"
}

Response:
{
  "success": true,
  "data": {
    "key_name": "Third Party API",
    "api_key": "abc123...",
    "secret_key": "xyz789...",
    "note": "Store these credentials securely..."
  }
}
```

#### Revoke API Key

```
DELETE /api/tenant-api-keys/{id}
Authorization: Bearer <token>
X-Tenant-ID: 1

Response:
{
  "success": true,
  "message": "API key revoked"
}
```

## Usage Examples

### 1. Login and Get JWT Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@acme.com",
    "password": "password123"
  }'
```

Response includes JWT with `tenant_id`:

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "acme_user",
      "email": "user@acme.com",
      "tenant_id": 1
    }
  }
}
```

### 2. Use Token for Subsequent Requests

```bash
curl -X GET http://localhost:3000/api/customers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

All customer data is automatically filtered by the user's tenant_id.

### 3. Use API Key for Integration

```bash
# Create API key
curl -X POST http://localhost:3000/api/tenant-api-keys/create \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"key_name": "Billing Integration"}'

# Use API key
curl -X GET http://localhost:3000/api/isp/billing/cycles/1 \
  -H "X-API-Key: <api_key_from_response>"
```

### 4. Specify Tenant via Header

```bash
curl -X GET http://localhost:3000/api/customers \
  -H "X-Tenant-ID: 2"
```

### 5. Subdomain-Based Access

```bash
# Access tenant1's data
curl -X GET http://tenant1.myapp.com/api/customers \
  -H "Authorization: Bearer <token>"

# Access tenant2's data
curl -X GET http://tenant2.myapp.com/api/customers \
  -H "Authorization: Bearer <token>"
```

## Configuration

### Environment Variables

No special environment variables required for multitenancy. The system works with existing configuration:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=netflow_db
DB_USER=netflow_user
DB_PASSWORD=your_password
DB_TYPE=pgsql
JWT_SECRET=your_jwt_secret
JWT_ALGORITHM=HS256
JWT_EXPIRY=86400
```

### Enable/Disable Tenant Isolation

For installation or administrative tasks, temporarily disable tenant isolation:

```php
use Core\Database;

// Disable tenant isolation for setup
Database::setTenantIsolation(false);

// Your code here...
Database::execute("INSERT INTO tenants...");

// Re-enable tenant isolation
Database::setTenantIsolation(true);
```

## User Registration

Users register to a tenant context:

```bash
curl -X POST http://acme.myapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "newuser@acme.com",
    "password": "password123",
    "full_name": "New User"
  }'
```

The user is automatically assigned to the tenant context identified from:

1. JWT token (if provided)
2. Subdomain (if accessing via subdomain)
3. X-Tenant-ID header
4. Default tenant (created if not found)

## Best Practices

### 1. Always Identify Tenant

Ensure tenant context is identified before processing requests. The middleware in `public/index.php` handles this automatically.

### 2. Use Tenant-Aware Methods

Use the tenant-aware database methods:

```php
// Good
$customers = Database::fetchAllWithTenant(
  'SELECT * FROM customers WHERE status = ?',
  ['active']
);

// Also works (automatic filtering)
$data = Database::fetchAll('SELECT * FROM customers');
```

### 3. Secure API Keys

- Store API keys securely
- Rotate keys regularly
- Revoke unused keys
- Monitor `last_used` timestamp

### 4. Prevent Tenant Leakage

Never disable tenant isolation in production code:

```php
// DON'T DO THIS IN PRODUCTION
Database::setTenantIsolation(false);
```

### 5. Test Tenant Isolation

Write tests to verify data isolation:

```php
// Test that tenant1 user can't see tenant2 data
$user1 = Auth::login('user1@tenant1.com', 'password');
$customers = fetchCustomers(); // Should only show tenant1 customers

$user2 = Auth::login('user2@tenant2.com', 'password');
$customers = fetchCustomers(); // Should only show tenant2 customers
```

## Troubleshooting

### No Tenant Context Found

If requests return "No tenant context":

1. Ensure JWT token includes `tenant_id` claim
2. Check subdomain configuration
3. Verify X-Tenant-ID header is present
4. Check tenant exists and is active

### Data Isolation Not Working

1. Verify `tenant_id` columns exist in database
2. Check that `Database::setTenantIsolation(true)` is set
3. Ensure migration was applied: `database/multitenancy-migration.sql`
4. Verify tenant context is identified before queries

### API Key Not Working

1. Verify API key exists and is active
2. Check `X-API-Key` header spelling
3. Ensure API key hasn't expired
4. Verify tenant is active

## Performance Considerations

### Indexes

The migration creates indexes on `tenant_id` for optimal query performance:

```sql
CREATE INDEX idx_<table>_tenant_id ON <table>(tenant_id);
```

### Composite Indexes

For frequently filtered columns, consider composite indexes:

```sql
CREATE INDEX idx_customers_tenant_status
ON customers(tenant_id, status);
```

### Query Optimization

Tenant filtering happens at the database level:

```sql
-- Automatically generated
SELECT * FROM customers WHERE tenant_id = 1 AND status = 'active'
```

## Migration from Single to Multi-Tenant

1. Create default tenant:

   ```php
   TenantContext::createTenant(['name' => 'Default', 'slug' => 'default', 'is_default' => true]);
   ```

2. Assign all existing data to default tenant:

   ```sql
   UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;
   UPDATE customers SET tenant_id = 1 WHERE tenant_id IS NULL;
   -- Repeat for all tenant-aware tables
   ```

3. Enable tenant isolation in application

## Future Enhancements

- [ ] Tenant usage metrics and analytics
- [ ] Auto-scaling per tenant
- [ ] Custom branding per tenant
- [ ] Role-based access control (RBAC) per tenant
- [ ] Tenant-specific features/modules
- [ ] Data export/import per tenant
- [ ] Tenant suspension/termination
- [ ] Multi-language support per tenant
