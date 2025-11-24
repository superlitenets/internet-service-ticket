# Multitenancy Route Migration Guide

This guide explains how to migrate all routes to use tenant-aware database methods.

## Overview

To ensure proper tenant isolation, all database queries in routes must use the tenant-aware Database methods:

- `Database::fetchWithTenant()` instead of `Database::fetch()`
- `Database::fetchAllWithTenant()` instead of `Database::fetchAll()`
- `Database::insert()` instead of raw `INSERT` statements
- `Database::update()` instead of raw `UPDATE` statements
- `Database::delete()` instead of raw `DELETE` statements

## Already Migrated Routes

✅ `/api/auth/login`
✅ `/api/auth/register`
✅ `/api/auth/me`
✅ `/api/leads` (GET, POST, GET/:id)
✅ `/api/customers` (GET, POST, GET/:id, PUT/:id)
✅ `/api/invoices` (GET, POST)

## Remaining Routes to Migrate

### Step 1: Identify Routes to Update

Search for Database method calls in route files:

```bash
grep -r "Database::fetchAll\|Database::fetch\|Database::execute" app/
```

This will show all routes using non-tenant-aware methods.

### Step 2: Update Each Route

For each route found, replace:

**SELECT Queries:**
```php
// ❌ Before (no tenant filtering)
$data = Database::fetch('SELECT * FROM customers WHERE id = ?', [$id]);
$data = Database::fetchAll('SELECT * FROM invoices ORDER BY created_at DESC');

// ✅ After (automatic tenant filtering)
$data = Database::fetchWithTenant('SELECT * FROM customers WHERE id = ?', [$id]);
$data = Database::fetchAllWithTenant('SELECT * FROM invoices ORDER BY created_at DESC');
```

**INSERT Statements:**
```php
// ❌ Before (no tenant_id)
Database::execute(
    'INSERT INTO customers (name, email) VALUES (?, ?)',
    [$name, $email]
);

// ✅ After (tenant_id added automatically)
Database::insert('customers', [
    'name' => $name,
    'email' => $email,
]);
```

**UPDATE Statements:**
```php
// ❌ Before (no tenant filtering)
Database::execute(
    'UPDATE customers SET status = ? WHERE id = ?',
    ['active', $id]
);

// ✅ After (tenant_id filtered automatically)
Database::update('customers',
    ['status' => 'active'],
    ['id' => $id]
);
```

**DELETE Statements:**
```php
// ❌ Before (no tenant filtering)
Database::execute('DELETE FROM customers WHERE id = ?', [$id]);

// ✅ After (tenant_id filtered automatically)
Database::delete('customers', ['id' => $id]);
```

## Pattern Examples

### Example 1: Simple GET with Filter

**Before:**
```php
$group->get('/{id}', function (Request $request, Response $response, array $args) {
    try {
        $customer = Database::fetch(
            'SELECT * FROM customers WHERE id = ?',
            [$args['id']]
        );

        if (!$customer) {
            return $response->withStatus(404);
        }

        $response->getBody()->write(json_encode(['success' => true, 'data' => $customer]));
        return $response->withHeader('Content-Type', 'application/json');
    } catch (\Exception $e) {
        return $response->withStatus(500);
    }
});
```

**After:**
```php
$group->get('/{id}', function (Request $request, Response $response, array $args) {
    try {
        $customer = Database::fetchWithTenant(
            'SELECT * FROM customers WHERE id = ?',
            [$args['id']]
        );

        if (!$customer) {
            return $response->withStatus(404);
        }

        $response->getBody()->write(json_encode(['success' => true, 'data' => $customer]));
        return $response->withHeader('Content-Type', 'application/json');
    } catch (\Exception $e) {
        return $response->withStatus(500);
    }
});
```

### Example 2: List with Joins

**Before:**
```php
$tickets = Database::fetchAll(
    'SELECT t.*, c.name as customer_name FROM tickets t 
     LEFT JOIN customers c ON t.customer_id = c.id 
     WHERE t.status = ?
     ORDER BY t.created_at DESC',
    ['open']
);
```

**After:**
```php
$tickets = Database::fetchAllWithTenant(
    'SELECT t.*, c.name as customer_name FROM tickets t 
     LEFT JOIN customers c ON t.customer_id = c.id 
     WHERE t.status = ?
     ORDER BY t.created_at DESC',
    ['open']
);
// The middleware automatically adds: WHERE t.tenant_id = ? AND t.status = ?
```

### Example 3: Create with Related Data

**Before:**
```php
Database::execute(
    'INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)',
    [$customer_id, $total, 'pending']
);

$orderId = Database::lastInsertId();
$order = Database::fetch('SELECT * FROM orders WHERE id = ?', [$orderId]);
```

**After:**
```php
Database::insert('orders', [
    'customer_id' => $customer_id,
    'total' => $total,
    'status' => 'pending',
]);

$orderId = Database::lastInsertId();
$order = Database::fetchWithTenant('SELECT * FROM orders WHERE id = ?', [$orderId]);
```

### Example 4: Update with Validation

**Before:**
```php
// Verify exists before updating
$ticket = Database::fetch('SELECT * FROM tickets WHERE id = ?', [$id]);
if (!$ticket) {
    return $response->withStatus(404);
}

// Update
Database::execute(
    'UPDATE tickets SET status = ?, updated_at = NOW() WHERE id = ?',
    ['resolved', $id]
);

// Fetch updated
$updated = Database::fetch('SELECT * FROM tickets WHERE id = ?', [$id]);
```

**After:**
```php
// Verify exists before updating (automatic tenant filtering)
$ticket = Database::fetchWithTenant('SELECT * FROM tickets WHERE id = ?', [$id]);
if (!$ticket) {
    return $response->withStatus(404);
}

// Update (automatic tenant filtering)
Database::update('tickets',
    ['status' => 'resolved', 'updated_at' => new \DateTime()],
    ['id' => $id]
);

// Fetch updated (automatic tenant filtering)
$updated = Database::fetchWithTenant('SELECT * FROM tickets WHERE id = ?', [$id]);
```

## Files to Update

Based on the current structure, update these route files:

1. **app/routes.php** - ✅ Partially done (auth, leads, customers)
   - [ ] Update remaining routes (packages, etc.)
   
2. **app/routes-extended.php** - ⚠️ Partially done (invoices)
   - [ ] Update employees, attendance, inventory, tickets, ticket_replies
   
3. **app/isp-mikrotik.php**
   - [ ] Update all ISP MikroTik routes
   
4. **app/isp-billing.php**
   - [ ] Update all ISP billing routes
   
5. **app/isp-monitoring.php**
   - [ ] Update all ISP monitoring routes
   
6. **app/isp-reports.php**
   - [ ] Update all ISP reports routes
   
7. **app/isp-customer-portal.php**
   - [ ] Update all customer portal routes
   
8. **app/integrations.php**
   - [ ] Update integration routes

## Automated Migration Script

To help with migration, use this grep command to find all routes that need updating:

```bash
# Find all Database::fetch calls (non-tenant-aware)
grep -n "Database::fetch(" app/*.php | grep -v "fetchWithTenant\|fetchAllWithTenant"

# Find all Database::execute calls (may need updating)
grep -n "Database::execute(" app/*.php

# Find all INSERT statements
grep -n "INSERT INTO" app/*.php

# Find all UPDATE statements
grep -n "UPDATE " app/*.php

# Find all DELETE statements
grep -n "DELETE FROM" app/*.php
```

## Testing After Migration

### 1. Test Data Isolation

```bash
# Create test accounts for different tenants
# Verify each user only sees their tenant's data

# Tenant 1
curl -X GET http://tenant1.localhost:3000/api/customers \
  -H "Authorization: Bearer TOKEN1"

# Tenant 2
curl -X GET http://tenant2.localhost:3000/api/customers \
  -H "Authorization: Bearer TOKEN2"

# Results should be different
```

### 2. Test with API Keys

```bash
# Create API keys for different tenants
# Verify each key only works for its tenant

ACME_KEY=$(curl -X POST http://acme.localhost:3000/api/tenant-api-keys/create ...)
GLOBAL_KEY=$(curl -X POST http://global.localhost:3000/api/tenant-api-keys/create ...)

# ACME key should work for ACME
curl -X GET http://acme.localhost:3000/api/customers \
  -H "X-API-Key: $ACME_KEY"

# ACME key should NOT work for Global
curl -X GET http://global.localhost:3000/api/customers \
  -H "X-API-Key: $ACME_KEY"
```

### 3. Unit Tests

```php
class TenantRoutesTest extends TestCase {
    
    public function testLeadsListFilters ByTenant() {
        // Create two tenants
        $tenant1 = createTestTenant('Tenant 1');
        $tenant2 = createTestTenant('Tenant 2');
        
        // Create leads in each tenant
        switchTenant($tenant1);
        createLead('Lead 1');
        
        switchTenant($tenant2);
        createLead('Lead 2');
        
        // Verify filtering
        switchTenant($tenant1);
        $leads = listLeads();
        $this->assertEquals(1, count($leads));
        $this->assertEquals('Lead 1', $leads[0]['name']);
        
        switchTenant($tenant2);
        $leads = listLeads();
        $this->assertEquals(1, count($leads));
        $this->assertEquals('Lead 2', $leads[0]['name']);
    }
}
```

## Quick Reference

| Operation | Non-Tenant-Aware | Tenant-Aware | Auto Filters |
|-----------|------------------|--------------|--------------|
| Fetch one | `fetch()` | `fetchWithTenant()` | ✅ YES |
| Fetch all | `fetchAll()` | `fetchAllWithTenant()` | ✅ YES |
| Insert | `execute('INSERT')` | `insert()` | ✅ YES |
| Update | `execute('UPDATE')` | `update()` | ✅ YES |
| Delete | `execute('DELETE')` | `delete()` | ✅ YES |

## Common Mistakes to Avoid

### ❌ Mistake 1: Checking tenant manually

```php
// DON'T DO THIS
$customer = Database::fetchWithTenant('SELECT * FROM customers WHERE tenant_id = ? AND id = ?', [$tenant_id, $id]);

// Adds tenant_id twice - redundant
```

### ❌ Mistake 2: Mixing tenant-aware and non-tenant-aware

```php
// DON'T DO THIS
$customer = Database::fetch('SELECT * FROM customers WHERE id = ?', [$id]); // No tenant check
$update = Database::update('customers', [...], ['id' => $id]); // Has tenant check
```

### ❌ Mistake 3: Not checking for null/404

```php
// DON'T DO THIS
$customer = Database::fetchWithTenant('SELECT * FROM customers WHERE id = ?', [$id]);
$name = $customer['name']; // Could be null!

// DO THIS
$customer = Database::fetchWithTenant('SELECT * FROM customers WHERE id = ?', [$id]);
if (!$customer) {
    return $response->withStatus(404);
}
$name = $customer['name'];
```

## Support

If you encounter issues during migration:

1. Check logs: `tail -f /var/log/netflow.log`
2. Enable debug: `APP_DEBUG=true` in `.env`
3. Review MULTITENANCY_DEVELOPER_GUIDE.md for examples
4. Test manually with curl commands

## Completion Checklist

- [ ] Update routes.php
- [ ] Update routes-extended.php
- [ ] Update isp-mikrotik.php
- [ ] Update isp-billing.php
- [ ] Update isp-monitoring.php
- [ ] Update isp-reports.php
- [ ] Update isp-customer-portal.php
- [ ] Update integrations.php
- [ ] Run tests with multiple tenants
- [ ] Verify no data leakage between tenants
- [ ] Update documentation
