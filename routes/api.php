<?php
/**
 * API Routes - REST Endpoints
 */

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// API Health Check
$app->get('/api/health', function (Request $request, Response $response) {
    $data = [
        'success' => true,
        'message' => 'API is healthy',
        'timestamp' => date('Y-m-d H:i:s'),
        'version' => '1.0.0'
    ];
    $response->getBody()->write(json_encode($data));
    return $response->withHeader('Content-Type', 'application/json');
});

// Customers API
$app->group('/api/customers', function () use ($app) {
    
    // List customers
    $app->get('', function (Request $request, Response $response) {
        try {
            $db = $this->get('db');
            $tenantId = $this->getTenantId($request);
            
            $stmt = $db->prepare('SELECT * FROM customers WHERE tenant_id = ? LIMIT 100');
            $stmt->execute([$tenantId]);
            $customers = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customers
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    });
    
    // Get single customer
    $app->get('/{id}', function (Request $request, Response $response, $args) {
        try {
            $db = $this->get('db');
            $tenantId = $this->getTenantId($request);
            
            $stmt = $db->prepare('SELECT * FROM customers WHERE id = ? AND tenant_id = ?');
            $stmt->execute([$args['id'], $tenantId]);
            $customer = $stmt->fetch();
            
            if (!$customer) {
                return $this->errorResponse($response, 'Customer not found', 404);
            }
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customer
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    });
    
    // Create customer
    $app->post('', function (Request $request, Response $response) {
        try {
            $data = json_decode($request->getBody(), true);
            $db = $this->get('db');
            $tenantId = $this->getTenantId($request);
            
            $stmt = $db->prepare(
                'INSERT INTO customers (tenant_id, name, email, phone, address, city, country, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $tenantId,
                $data['name'] ?? '',
                $data['email'] ?? null,
                $data['phone'] ?? null,
                $data['address'] ?? null,
                $data['city'] ?? null,
                $data['country'] ?? null,
                'active'
            ]);
            
            $customerId = $db->lastInsertId();
            
            // Fetch created customer
            $stmt = $db->prepare('SELECT * FROM customers WHERE id = ?');
            $stmt->execute([$customerId]);
            $customer = $stmt->fetch();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customer
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    });
});

// Invoices API
$app->group('/api/invoices', function () use ($app) {
    
    // List invoices
    $app->get('', function (Request $request, Response $response) {
        try {
            $db = $this->get('db');
            $tenantId = $this->getTenantId($request);
            
            $stmt = $db->prepare('
                SELECT i.*, c.name as customer_name 
                FROM invoices i 
                LEFT JOIN customers c ON i.customer_id = c.id 
                WHERE i.tenant_id = ? 
                ORDER BY i.created_at DESC 
                LIMIT 100
            ');
            $stmt->execute([$tenantId]);
            $invoices = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $invoices
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    });
});

// Services API
$app->group('/api/services', function () use ($app) {
    
    // List services for a customer
    $app->get('/{customerId}', function (Request $request, Response $response, $args) {
        try {
            $db = $this->get('db');
            $tenantId = $this->getTenantId($request);
            
            $stmt = $db->prepare('
                SELECT s.*, p.name as package_name, p.download_speed, p.upload_speed 
                FROM services s 
                LEFT JOIN packages p ON s.package_id = p.id 
                WHERE s.customer_id = ? AND s.tenant_id = ?
            ');
            $stmt->execute([$args['customerId'], $tenantId]);
            $services = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $services
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    });
});

// Tickets API
$app->group('/api/tickets', function () use ($app) {
    
    // List tickets
    $app->get('', function (Request $request, Response $response) {
        try {
            $db = $this->get('db');
            $tenantId = $this->getTenantId($request);
            
            $stmt = $db->prepare('
                SELECT t.*, c.name as customer_name, u.full_name as assigned_user 
                FROM tickets t 
                LEFT JOIN customers c ON t.customer_id = c.id 
                LEFT JOIN users u ON t.assigned_to = u.id 
                WHERE t.tenant_id = ? 
                ORDER BY t.created_at DESC 
                LIMIT 100
            ');
            $stmt->execute([$tenantId]);
            $tickets = $stmt->fetchAll();
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $tickets
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    });
});

// Helper methods
$app->getContainer()->set('getTenantId', function () {
    return function (Request $request) {
        // Get tenant from header, JWT, or API key
        $header = $request->getHeaderLine('X-Tenant-ID');
        return $header ?: 1; // Default to first tenant
    };
});

$app->getContainer()->set('errorResponse', function () {
    return function (Response $response, $message, $code = 400) {
        $response->getBody()->write(json_encode([
            'success' => false,
            'message' => $message
        ]));
        return $response->withStatus($code)->withHeader('Content-Type', 'application/json');
    };
});
