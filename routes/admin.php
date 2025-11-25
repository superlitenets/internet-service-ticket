<?php
/**
 * Admin Routes
 */

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

$app->group('/api/admin', function () use ($app) {
    
    // Tenants Management
    $app->group('/tenants', function () use ($app) {
        
        // List all tenants
        $app->get('', function (Request $request, Response $response) {
            try {
                $db = $this->get('db');
                $stmt = $db->prepare('SELECT * FROM tenants ORDER BY created_at DESC');
                $stmt->execute();
                $tenants = $stmt->fetchAll();
                
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'data' => $tenants
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (Exception $e) {
                return $this->errorResponse($response, $e->getMessage(), 500);
            }
        });
        
        // Create tenant
        $app->post('', function (Request $request, Response $response) {
            try {
                $data = json_decode($request->getBody(), true);
                $db = $this->get('db');
                
                $slug = strtolower(preg_replace('/[^a-z0-9-]/', '-', $data['name']));
                
                $stmt = $db->prepare(
                    'INSERT INTO tenants (name, slug, subdomain, status) VALUES (?, ?, ?, ?)'
                );
                $stmt->execute([
                    $data['name'],
                    $slug,
                    $data['subdomain'] ?? $slug,
                    'active'
                ]);
                
                $tenantId = $db->lastInsertId();
                
                $stmt = $db->prepare('SELECT * FROM tenants WHERE id = ?');
                $stmt->execute([$tenantId]);
                $tenant = $stmt->fetch();
                
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'data' => $tenant
                ]));
                return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
            } catch (Exception $e) {
                return $this->errorResponse($response, $e->getMessage(), 500);
            }
        });
    });
    
    // Users Management
    $app->group('/users', function () use ($app) {
        
        // List all users
        $app->get('', function (Request $request, Response $response) {
            try {
                $db = $this->get('db');
                $tenantId = $this->getTenantId($request);
                
                $stmt = $db->prepare(
                    'SELECT id, username, email, full_name, role, status, created_at FROM users WHERE tenant_id = ? ORDER BY created_at DESC'
                );
                $stmt->execute([$tenantId]);
                $users = $stmt->fetchAll();
                
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'data' => $users
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (Exception $e) {
                return $this->errorResponse($response, $e->getMessage(), 500);
            }
        });
        
        // Update user role
        $app->put('/{id}', function (Request $request, Response $response, $args) {
            try {
                $data = json_decode($request->getBody(), true);
                $db = $this->get('db');
                $tenantId = $this->getTenantId($request);
                
                $stmt = $db->prepare('UPDATE users SET role = ?, status = ? WHERE id = ? AND tenant_id = ?');
                $stmt->execute([
                    $data['role'] ?? 'user',
                    $data['status'] ?? 'active',
                    $args['id'],
                    $tenantId
                ]);
                
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'User updated'
                ]));
                return $response->withHeader('Content-Type', 'application/json');
            } catch (Exception $e) {
                return $this->errorResponse($response, $e->getMessage(), 500);
            }
        });
    });
    
    // Dashboard Statistics
    $app->get('/stats', function (Request $request, Response $response) {
        try {
            $db = $this->get('db');
            $tenantId = $this->getTenantId($request);
            
            // Total customers
            $stmt = $db->prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?');
            $stmt->execute([$tenantId]);
            $customers = $stmt->fetch();
            
            // Total active services
            $stmt = $db->prepare('SELECT COUNT(*) as count FROM services WHERE tenant_id = ? AND status = ?');
            $stmt->execute([$tenantId, 'active']);
            $services = $stmt->fetch();
            
            // Total revenue (unpaid invoices)
            $stmt = $db->prepare('SELECT COALESCE(SUM(total), 0) as amount FROM invoices WHERE tenant_id = ? AND status = ?');
            $stmt->execute([$tenantId, 'unpaid']);
            $revenue = $stmt->fetch();
            
            // Open tickets
            $stmt = $db->prepare('SELECT COUNT(*) as count FROM tickets WHERE tenant_id = ? AND status IN (?, ?)');
            $stmt->execute([$tenantId, 'open', 'pending']);
            $tickets = $stmt->fetch();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => [
                    'total_customers' => $customers['count'],
                    'active_services' => $services['count'],
                    'pending_revenue' => $revenue['amount'],
                    'open_tickets' => $tickets['count']
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    });
});
