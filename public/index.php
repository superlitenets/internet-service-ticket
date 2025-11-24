<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Psr\Log\LogLevel;
use Core\TenantContext;

// Load environment variables
$dotenv = new \Dotenv\Dotenv(__DIR__ . '/..');
$dotenv->safeLoad();

// Create app
$app = AppFactory::create();

// Add middleware for tenant context identification
$app->add(function ($request, $handler) {
    // Identify tenant from various sources (JWT, subdomain, API key, headers)
    TenantContext::identify();

    return $handler->handle($request);
});

// Add middleware for CORS
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID, X-API-Key')
        ->withHeader('Content-Type', 'application/json');
});

// Add error handling middleware
$app->addErrorMiddleware($_ENV['APP_DEBUG'] ?? false, true, true);

// Add core routes
require_once __DIR__ . '/../app/routes.php';

// Add extended routes
require_once __DIR__ . '/../app/routes-extended.php';

// Add integration routes
require_once __DIR__ . '/../app/integrations.php';

// Add multitenancy routes
require_once __DIR__ . '/../app/multitenancy.php';

// Add ISP billing module routes
require_once __DIR__ . '/../app/isp-mikrotik.php';
require_once __DIR__ . '/../app/isp-billing.php';
require_once __DIR__ . '/../app/isp-monitoring.php';
require_once __DIR__ . '/../app/isp-reports.php';
require_once __DIR__ . '/../app/isp-customer-portal.php';

// Run app
$app->run();
