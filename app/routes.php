<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;

// Auth Routes
$app->group('/api/auth', function (RouteCollectorProxy $group) {
    $group->post('/login', function (Request $request, Response $response) {
        try {
            $data = json_decode($request->getBody(), true);

            if (!isset($data['email']) || !isset($data['password'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Email and password are required',
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $result = Auth::login($data['email'], $data['password']);

            if (!$result) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Invalid credentials',
                ]));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $result,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Login failed: ' . $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->post('/register', function (Request $request, Response $response) {
        try {
            $data = json_decode($request->getBody(), true);

            if (!isset($data['email']) || !isset($data['password']) || !isset($data['username'])) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Email, username, and password are required',
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $result = Auth::register($data);

            if (!$result) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Registration failed - user may already exist',
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $result,
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->get('/me', function (Request $request, Response $response) {
        $user = Auth::user();

        if (!$user) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => 'Unauthorized',
            ]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode([
            'success' => true,
            'data' => $user,
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });
});

// Leads Routes
$app->group('/api/leads', function (RouteCollectorProxy $group) {
    $group->get('', function (Request $request, Response $response) {
        try {
            $leads = Database::fetchAllWithTenant('SELECT * FROM leads ORDER BY created_at DESC LIMIT 100');

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $leads,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->post('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            Database::insert('leads', [
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'company' => $data['company'] ?? null,
                'status' => $data['status'] ?? 'new',
                'source' => $data['source'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $user['id'],
            ]);

            $leadId = Database::lastInsertId();
            $lead = Database::fetchWithTenant('SELECT * FROM leads WHERE id = ?', [$leadId]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $lead,
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->get('/{id}', function (Request $request, Response $response, array $args) {
        try {
            $lead = Database::fetchWithTenant('SELECT * FROM leads WHERE id = ?', [$args['id']]);

            if (!$lead) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Lead not found',
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $lead,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
});

// Customers Routes
$app->group('/api/customers', function (RouteCollectorProxy $group) {
    $group->get('', function (Request $request, Response $response) {
        try {
            $customers = Database::fetchAllWithTenant('SELECT * FROM customers ORDER BY created_at DESC LIMIT 100');

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customers,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->post('', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            Database::insert('customers', [
                'name' => $data['name'],
                'email' => $data['email'] ?? null,
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'city' => $data['city'] ?? null,
                'country' => $data['country'] ?? null,
                'account_type' => $data['account_type'] ?? 'retail',
                'status' => $data['status'] ?? 'active',
                'created_by' => $user['id'],
            ]);

            $customerId = Database::lastInsertId();
            $customer = Database::fetchWithTenant('SELECT * FROM customers WHERE id = ?', [$customerId]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customer,
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->get('/{id}', function (Request $request, Response $response, array $args) {
        try {
            $customer = Database::fetchWithTenant('SELECT * FROM customers WHERE id = ?', [$args['id']]);

            if (!$customer) {
                $response->getBody()->write(json_encode([
                    'success' => false,
                    'message' => 'Customer not found',
                ]));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customer,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    $group->put('/{id}', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            Database::update('customers',
                [
                    'name' => $data['name'] ?? null,
                    'email' => $data['email'] ?? null,
                    'phone' => $data['phone'] ?? null,
                    'address' => $data['address'] ?? null,
                    'city' => $data['city'] ?? null,
                    'country' => $data['country'] ?? null,
                    'account_type' => $data['account_type'] ?? null,
                    'status' => $data['status'] ?? null,
                    'updated_at' => new \DateTime(),
                ],
                ['id' => $args['id']]
            );

            $customer = Database::fetch('SELECT * FROM customers WHERE id = ?', [$args['id']]);

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $customer,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage(),
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });
});

// Health check
$app->get('/api/health', function (Request $request, Response $response) {
    $response->getBody()->write(json_encode([
        'success' => true,
        'message' => 'API is healthy',
        'timestamp' => date('Y-m-d H:i:s'),
    ]));
    return $response->withHeader('Content-Type', 'application/json');
});
