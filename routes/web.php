<?php
/**
 * Web Routes - HTML Pages
 */

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

// Public landing page
$app->get('/', function (Request $request, Response $response) {
    $html = file_get_contents(BASE_PATH . '/views/pages/landing.html');
    $response->getBody()->write($html);
    return $response->withHeader('Content-Type', 'text/html');
});

// Login page
$app->get('/login', function (Request $request, Response $response) {
    $html = file_get_contents(BASE_PATH . '/views/pages/login.html');
    $response->getBody()->write($html);
    return $response->withHeader('Content-Type', 'text/html');
});

// Register page
$app->get('/register', function (Request $request, Response $response) {
    $html = file_get_contents(BASE_PATH . '/views/pages/register.html');
    $response->getBody()->write($html);
    return $response->withHeader('Content-Type', 'text/html');
});

// Dashboard (requires authentication)
$app->get('/dashboard', function (Request $request, Response $response) {
    // Check authentication
    $token = $this->getAuthToken($request);
    if (!$token) {
        return $response->withStatus(302)->withHeader('Location', '/login');
    }
    
    $html = file_get_contents(BASE_PATH . '/views/pages/dashboard.html');
    $response->getBody()->write($html);
    return $response->withHeader('Content-Type', 'text/html');
});

// Admin dashboard (requires admin authentication)
$app->get('/admin', function (Request $request, Response $response) {
    $token = $this->getAuthToken($request);
    if (!$token || !$this->isAdmin($token)) {
        return $response->withStatus(302)->withHeader('Location', '/login');
    }
    
    $html = file_get_contents(BASE_PATH . '/views/admin/dashboard.html');
    $response->getBody()->write($html);
    return $response->withHeader('Content-Type', 'text/html');
});

// Helper methods
$app->getContainer()->set('getAuthToken', function () {
    return function (Request $request) {
        $authHeader = $request->getHeaderLine('Authorization');
        if (preg_match('/Bearer\s+(.*)/', $authHeader, $matches)) {
            return $matches[1];
        }
        return null;
    };
});

$app->getContainer()->set('isAdmin', function () {
    return function ($token) {
        // Verify token and check if user is admin
        // Implementation depends on JWT library
        return false;
    };
});
