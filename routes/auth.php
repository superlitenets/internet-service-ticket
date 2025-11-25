<?php
/**
 * Authentication Routes
 */

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$app->group('/api/auth', function () use ($app) {
    
    // Register
    $app->post('/register', function (Request $request, Response $response) {
        try {
            $data = json_decode($request->getBody(), true);
            $db = $this->get('db');
            $config = $this->get('config');
            $tenantId = $this->getTenantId($request);
            
            // Validation
            if (empty($data['email']) || empty($data['password']) || empty($data['full_name'])) {
                return $this->errorResponse($response, 'Missing required fields', 400);
            }
            
            // Check if user exists
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$data['email']]);
            if ($stmt->fetch()) {
                return $this->errorResponse($response, 'Email already registered', 409);
            }
            
            // Insert user
            $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
            $stmt = $db->prepare(
                'INSERT INTO users (tenant_id, email, password, full_name, username, role, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $tenantId,
                $data['email'],
                $hashedPassword,
                $data['full_name'],
                $data['email'], // Use email as username
                'user',
                'active'
            ]);
            
            $userId = $db->lastInsertId();
            
            // Generate JWT token
            $issuedAt = time();
            $expire = $issuedAt + $config['jwt']['expiry'];
            $payload = [
                'iat' => $issuedAt,
                'exp' => $expire,
                'user_id' => $userId,
                'email' => $data['email'],
                'full_name' => $data['full_name'],
                'tenant_id' => $tenantId,
                'role' => 'user'
            ];
            
            $token = JWT::encode($payload, $config['jwt']['secret'], $config['jwt']['algorithm']);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $userId,
                        'email' => $data['email'],
                        'full_name' => $data['full_name']
                    ]
                ]
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    });
    
    // Login
    $app->post('/login', function (Request $request, Response $response) {
        try {
            $data = json_decode($request->getBody(), true);
            $db = $this->get('db');
            $config = $this->get('config');
            
            // Validation
            if (empty($data['email']) || empty($data['password'])) {
                return $this->errorResponse($response, 'Email and password required', 400);
            }
            
            // Find user
            $stmt = $db->prepare('SELECT * FROM users WHERE email = ? AND status = ?');
            $stmt->execute([$data['email'], 'active']);
            $user = $stmt->fetch();
            
            if (!$user || !password_verify($data['password'], $user['password'])) {
                return $this->errorResponse($response, 'Invalid credentials', 401);
            }
            
            // Update last login
            $stmt = $db->prepare('UPDATE users SET last_login = NOW() WHERE id = ?');
            $stmt->execute([$user['id']]);
            
            // Generate JWT token
            $issuedAt = time();
            $expire = $issuedAt + $config['jwt']['expiry'];
            $payload = [
                'iat' => $issuedAt,
                'exp' => $expire,
                'user_id' => $user['id'],
                'email' => $user['email'],
                'full_name' => $user['full_name'],
                'tenant_id' => $user['tenant_id'],
                'role' => $user['role']
            ];
            
            $token = JWT::encode($payload, $config['jwt']['secret'], $config['jwt']['algorithm']);
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user['id'],
                        'email' => $user['email'],
                        'full_name' => $user['full_name'],
                        'role' => $user['role']
                    ]
                ]
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, $e->getMessage(), 500);
        }
    });
    
    // Get current user
    $app->get('/me', function (Request $request, Response $response) {
        try {
            $token = $this->getToken($request);
            if (!$token) {
                return $this->errorResponse($response, 'Unauthorized', 401);
            }
            
            $config = $this->get('config');
            $decoded = JWT::decode($token, new Key($config['jwt']['secret'], $config['jwt']['algorithm']));
            
            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => (array)$decoded
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            return $this->errorResponse($response, 'Invalid token', 401);
        }
    });
    
    // Logout
    $app->post('/logout', function (Request $request, Response $response) {
        // Client-side logout - just remove token from client
        $response->getBody()->write(json_encode([
            'success' => true,
            'message' => 'Logged out successfully'
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });
});

// Helper methods
$app->getContainer()->set('getToken', function () {
    return function (Request $request) {
        $authHeader = $request->getHeaderLine('Authorization');
        if (preg_match('/Bearer\s+(.*)/', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    };
});
