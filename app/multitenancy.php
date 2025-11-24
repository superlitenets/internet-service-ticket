<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;
use Core\TenantContext;

// Multitenancy Management Routes
$app->group('/api/tenants', function (RouteCollectorProxy $group) {

    // Get current tenant info
    $group->get('/info', function (Request $request, Response $response) {
        try {
            $tenant = TenantContext::getTenant();
            
            if (!$tenant) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'No tenant context'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $tenant
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

    // Create new tenant (admin only)
    $group->post('/create', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user || $user['role'] !== 'admin') {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Admin access required'
                ]));
                return $response->withStatus(403)->withHeader('Content-Type', 'application/json');
            }

            $data = json_decode($request->getBody(), true);

            if (!isset($data['name'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Tenant name is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Disable tenant isolation for creating tenant
            Database::setTenantIsolation(false);

            $tenant = TenantContext::createTenant([
                'name' => $data['name'],
                'slug' => $data['slug'] ?? null,
                'subdomain' => $data['subdomain'] ?? null,
            ]);

            Database::setTenantIsolation(true);

            if (!$tenant) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Failed to create tenant'
                ]));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $tenant
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

    // Get tenant by slug
    $group->get('/{slug}', function (Request $request, Response $response, array $args) {
        try {
            Database::setTenantIsolation(false);
            $tenant = TenantContext::getTenantBySlug($args['slug']);
            Database::setTenantIsolation(true);

            if (!$tenant) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Tenant not found'
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $tenant
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

    // Update tenant settings
    $group->put('/settings', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Unauthorized'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $tenant_id = TenantContext::getTenantId();
            if (!$tenant_id) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'No tenant context'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $data = json_decode($request->getBody(), true);
            $allowed_fields = ['name', 'features', 'max_users', 'max_customers', 'storage_limit'];
            
            $update_data = [];
            foreach ($allowed_fields as $field) {
                if (isset($data[$field])) {
                    $update_data[$field] = $data[$field];
                }
            }

            if (empty($update_data)) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'No valid fields to update'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $update_data['updated_at'] = new \DateTime();

            Database::update('tenants', $update_data, ['id' => $tenant_id]);

            $tenant = TenantContext::getTenant();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $tenant
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

// Tenant API Keys Management
$app->group('/api/tenant-api-keys', function (RouteCollectorProxy $group) {

    // List API keys
    $group->get('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Unauthorized'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $tenant_id = TenantContext::getTenantId();
            if (!$tenant_id) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'No tenant context'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $keys = Database::fetchAllWithTenant(
                'SELECT id, key_name, api_key, is_active, last_used, created_at FROM tenant_api_keys WHERE tenant_id = ? ORDER BY created_at DESC',
                [$tenant_id]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $keys
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

    // Create new API key
    $group->post('/create', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Unauthorized'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $tenant_id = TenantContext::getTenantId();
            if (!$tenant_id) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'No tenant context'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $data = json_decode($request->getBody(), true);
            if (!isset($data['key_name'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Key name is required'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            // Generate API key and secret
            $api_key = bin2hex(random_bytes(32));
            $secret_key = bin2hex(random_bytes(32));

            Database::insert('tenant_api_keys', [
                'tenant_id' => $tenant_id,
                'key_name' => $data['key_name'],
                'api_key' => $api_key,
                'secret_key' => $secret_key,
                'is_active' => true
            ]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'key_name' => $data['key_name'],
                    'api_key' => $api_key,
                    'secret_key' => $secret_key,
                    'note' => 'Store these credentials securely. The secret key will not be shown again.'
                ]
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

    // Revoke API key
    $group->delete('/{id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Unauthorized'
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $tenant_id = TenantContext::getTenantId();
            if (!$tenant_id) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'No tenant context'
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            Database::delete('tenant_api_keys', ['id' => $args['id'], 'tenant_id' => $tenant_id]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'API key revoked'
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
