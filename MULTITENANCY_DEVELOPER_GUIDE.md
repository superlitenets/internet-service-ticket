# Multitenancy Developer Guide

This guide explains how to implement multitenancy-aware code in NetFlow.

## Quick Start

### 1. Understanding Tenant Context

Every request automatically identifies the tenant:

```php
use Core\TenantContext;

// Get current tenant ID
$tenant_id = TenantContext::getTenantId();

// Get full tenant info
$tenant = TenantContext::getTenant();

// Manually set tenant (for CLI/cron jobs)
TenantContext::setTenant(1);
```

### 2. Database Queries with Tenant Isolation

The Database class automatically filters queries by tenant_id:

```php
use Core\Database;

// Automatically filtered by tenant_id
$customers = Database::fetchAllWithTenant(
    'SELECT * FROM customers WHERE status = ?',
    ['active']
);

// This includes WHERE clause for tenant_id automatically
// Resulting SQL: SELECT * FROM customers WHERE tenant_id = ? AND status = ?
// With params: [1, 'active']
```

### 3. Insert Data with Tenant Context

```php
// Automatically adds tenant_id
Database::insert('customers', [
    'name' => 'New Customer',
    'email' => 'customer@example.com',
    'status' => 'active'
]);
// Adds tenant_id to the insert automatically
```

### 4. Update Data with Tenant Isolation

```php
// Automatically filters by tenant_id
Database::update('customers',
    ['status' => 'inactive'],
    ['id' => 5]
);
// SQL: UPDATE customers SET status = ? WHERE id = ? AND tenant_id = ?
```

### 5. Delete Data with Tenant Isolation

```php
// Automatically filters by tenant_id
Database::delete('customers', ['id' => 5]);
// SQL: DELETE FROM customers WHERE id = ? AND tenant_id = ?
```

## Working with Routes

### Creating Tenant-Aware Routes

```php
use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;
use Core\TenantContext;

$app->group('/api/customers', function (RouteCollectorProxy $group) {

    // List customers for current tenant
    $group->get('', function (Request $request, Response $response) {
        try {
            // Verify user is authenticated
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody($response->getBody()->write(json_encode([
                        'success' => false,
                        'message' => 'Unauthorized'
                    ])));
            }

            // Get current tenant
            $tenant_id = TenantContext::getTenantId();
            if (!$tenant_id) {
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json')
                    ->withBody($response->getBody()->write(json_encode([
                        'success' => false,
                        'message' => 'No tenant context'
                    ])));
            }

            // Fetch customers (automatically filtered by tenant_id)
            $customers = Database::fetchAllWithTenant(
                'SELECT * FROM customers WHERE status = ? ORDER BY created_at DESC',
                ['active']
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customers,
                'tenant_id' => $tenant_id
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Create customer
    $group->post('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $data = json_decode($request->getBody(), true);

            // Validate required fields
            if (!isset($data['name']) || !isset($data['email'])) {
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json')
                    ->withBody($response->getBody()->write(json_encode([
                        'success' => false,
                        'message' => 'Name and email are required'
                    ])));
            }

            // Insert customer (tenant_id added automatically)
            Database::insert('customers', [
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'status' => 'active',
                'created_by' => $user['id']
            ]);

            $customer_id = Database::lastInsertId();

            // Fetch created customer
            $customer = Database::fetchWithTenant(
                'SELECT * FROM customers WHERE id = ?',
                [$customer_id]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customer
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Update customer
    $group->put('/{id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            // Verify customer exists and belongs to tenant
            $customer = Database::fetchWithTenant(
                'SELECT * FROM customers WHERE id = ?',
                [$args['id']]
            );

            if (!$customer) {
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json')
                    ->withBody($response->getBody()->write(json_encode([
                        'success' => false,
                        'message' => 'Customer not found'
                    ])));
            }

            $data = json_decode($request->getBody(), true);

            // Update customer (tenant_id filtered automatically)
            Database::update('customers',
                [
                    'name' => $data['name'] ?? $customer['name'],
                    'email' => $data['email'] ?? $customer['email'],
                    'phone' => $data['phone'] ?? $customer['phone'],
                    'status' => $data['status'] ?? $customer['status'],
                    'updated_at' => new \DateTime()
                ],
                ['id' => $args['id']]
            );

            // Fetch updated customer
            $updated = Database::fetchWithTenant(
                'SELECT * FROM customers WHERE id = ?',
                [$args['id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $updated
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

});
```

## Common Patterns

### Pattern 1: Verify Resource Belongs to Tenant

```php
// Before updating/deleting, verify resource belongs to tenant
$resource = Database::fetchWithTenant(
    'SELECT * FROM table WHERE id = ?',
    [$id]
);

if (!$resource) {
    // Resource not found in current tenant
    return error('Not found');
}

// Safe to proceed
```

### Pattern 2: Join Queries with Tenant Isolation

```php
// Use table alias to properly filter by tenant_id
$results = Database::fetchAllWithTenant(
    'SELECT c.*, p.name as package_name
     FROM customers c
     LEFT JOIN packages p ON c.id = p.customer_id
     WHERE c.status = ?',
    ['active']
);

// Automatically adds: WHERE c.tenant_id = ? AND c.status = ?
```

### Pattern 3: Aggregation Queries

```php
// Count per tenant
$stats = Database::fetchWithTenant(
    'SELECT COUNT(*) as total,
            SUM(balance) as total_balance
     FROM customers
     WHERE status = ?',
    ['active']
);

// Automatically adds tenant_id filter
```

### Pattern 4: Batch Operations

```php
// Update multiple records within tenant
foreach ($ids as $id) {
    Database::update('customers',
        ['status' => 'active'],
        ['id' => $id]
    );
    // Each automatically filtered by tenant_id
}
```

### Pattern 5: Transaction with Tenant Safety

```php
try {
    Database::beginTransaction();

    // All operations are automatically tenant-aware
    Database::insert('invoices', [...]);
    $invoice_id = Database::lastInsertId();

    Database::insert('payments', [...]);

    Database::update('customers', [...], ['id' => $customer_id]);

    Database::commit();
} catch (\Exception $e) {
    Database::rollback();
    throw $e;
}
```

## Handling Cross-Tenant Operations

### Scenario: Admin Needs to Access Another Tenant

```php
// Temporarily switch tenant
$original_tenant = TenantContext::getTenantId();
TenantContext::setTenant($other_tenant_id);

// Do work for other tenant
$data = Database::fetchAllWithTenant('SELECT * FROM customers');

// Switch back
TenantContext::setTenant($original_tenant);
```

### Scenario: System Operation Outside Tenant Context

For batch jobs, migrations, or admin tasks:

```php
// Disable tenant isolation temporarily
Database::setTenantIsolation(false);

// Query all tenants
$tenants = Database::fetchAll('SELECT * FROM tenants');

foreach ($tenants as $tenant) {
    TenantContext::setTenant($tenant['id']);

    // Do per-tenant operations
    $customers = Database::fetchAllWithTenant('SELECT * FROM customers');

    // Process...
}

// Re-enable tenant isolation
Database::setTenantIsolation(true);
```

## Security Considerations

### 1. Never Disable Isolation in Production

```php
// DON'T DO THIS IN PRODUCTION
Database::setTenantIsolation(false);
Database::fetchAll('SELECT * FROM users'); // Could leak data!
```

### 2. Always Verify Tenant Context

```php
public function handleRequest() {
    $tenant = TenantContext::getTenant();
    if (!$tenant) {
        throw new \Exception('No tenant context');
    }

    // Safe to proceed
}
```

### 3. Validate User Belongs to Tenant

```php
$user = Auth::user();
$is_owner = TenantContext::userBelongsToTenant($user['id']);

if (!$is_owner) {
    throw new \Exception('User not in tenant');
}
```

### 4. Log Cross-Tenant Operations

```php
if ($TenantContext::getTenantId() !== $user['tenant_id']) {
    // Potential security issue - log it
    error_log("Cross-tenant operation attempted by user {$user['id']}");
}
```

## Testing Multitenancy

### Unit Test Pattern

```php
class MultitenancyTest extends TestCase {

    public function testTenantIsolation() {
        // Create two tenants
        $tenant1 = TenantContext::createTenant(['name' => 'Tenant 1']);
        $tenant2 = TenantContext::createTenant(['name' => 'Tenant 2']);

        // Create users in each tenant
        TenantContext::setTenant($tenant1['id']);
        Database::insert('users', ['email' => 'user1@t1.com', ...]);

        TenantContext::setTenant($tenant2['id']);
        Database::insert('users', ['email' => 'user2@t2.com', ...]);

        // Verify tenant1 can't see tenant2 data
        TenantContext::setTenant($tenant1['id']);
        $users = Database::fetchAllWithTenant('SELECT * FROM users');
        $this->assertEquals(1, count($users));
        $this->assertEquals('user1@t1.com', $users[0]['email']);
    }

    public function testAPIKeyIsolation() {
        $key1 = generateAPIKey($tenant1['id']);
        $key2 = generateAPIKey($tenant2['id']);

        // Key1 should only work for tenant1
        $result = useAPIKey($key1, 'GET /api/customers');
        $this->assertTrue($result['success']);

        // Key1 should fail for tenant2
        TenantContext::setTenant($tenant2['id']);
        $result = useAPIKey($key1, 'GET /api/customers');
        $this->assertFalse($result['success']);
    }
}
```

## Performance Tips

### 1. Use Tenant-Aware Indexes

```sql
-- Already created by migration
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);

-- For frequently filtered columns, use composite
CREATE INDEX idx_customers_tenant_status
ON customers(tenant_id, status);
```

### 2. Batch Load Data

```php
// Good - single query
$customers = Database::fetchAllWithTenant(
    'SELECT * FROM customers WHERE status = ? LIMIT ?',
    ['active', 100]
);

// Avoid - N+1 queries
$customers = Database::fetchAllWithTenant('SELECT * FROM customers');
foreach ($customers as $c) {
    $invoices = Database::fetchAllWithTenant(
        'SELECT * FROM invoices WHERE customer_id = ?',
        [$c['id']]
    ); // Repeated queries
}
```

### 3. Cache Tenant Data

```php
// Cache tenant info after first load
$tenant = TenantContext::getTenant(); // Cached after first call
$tenant = TenantContext::getTenant(); // Returns cached value

// Clear if needed
TenantContext::clearCache();
```

## Debugging

### Enable Query Logging

```php
// In Database class - temporarily add logging
public static function queryWithTenant($sql, $params) {
    error_log("SQL: $sql");
    error_log("Params: " . json_encode($params));
    error_log("Tenant: " . TenantContext::getTenantId());
    return self::queryWithTenant($sql, $params);
}
```

### Check Tenant Identification

```php
// Debug tenant identification
$tenant_id = TenantContext::getTenantId();
$tenant = TenantContext::getTenant();

error_log("Tenant ID: $tenant_id");
error_log("Tenant: " . json_encode($tenant));
```

### Verify Data Isolation

```php
// Check if record belongs to tenant
Database::setTenantIsolation(false);
$record = Database::fetch('SELECT * FROM customers WHERE id = ?', [$id]);
$correct_tenant = $record['tenant_id'] === TenantContext::getTenantId();
Database::setTenantIsolation(true);

assert($correct_tenant, 'Record does not belong to tenant!');
```

## Common Issues

### Issue: "No tenant context" in routes

**Solution:** Ensure JWT includes tenant_id claim

```php
// Check token
$token = Auth::getTokenFromHeader();
$decoded = Auth::verifyToken($token);
echo json_encode($decoded); // Should include tenant_id
```

### Issue: Data appears in wrong tenant

**Solution:** Verify tenant_id in database

```sql
SELECT id, email, tenant_id FROM users WHERE email = 'user@example.com';
```

### Issue: Query includes duplicate WHERE clauses

**Solution:** Use fetchWithTenant, not regular fetch

```php
// Wrong
$data = Database::fetch(
    'SELECT * FROM customers WHERE tenant_id = ? AND status = ?',
    [$tenant_id, 'active']
);
// Adds tenant_id again, resulting in duplicate

// Right
$data = Database::fetchWithTenant(
    'SELECT * FROM customers WHERE status = ?',
    ['active']
);
// Tenant_id added automatically
```

## Best Practices Summary

✓ Always use `fetchWithTenant`, `insert`, `update`, `delete` methods
✓ Never manually add tenant_id checks
✓ Always verify user belongs to tenant
✓ Use transactions for multi-step operations
✓ Log unexpected tenant context issues
✓ Test with multiple tenants
✓ Document tenant-specific behavior
✓ Review security regularly
