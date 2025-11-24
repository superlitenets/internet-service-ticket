<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Psr\Log\LogLevel;

// Load environment variables
$dotenv = new \Dotenv\Dotenv(__DIR__ . '/..');
$dotenv->safeLoad();

// Create app
$app = AppFactory::create();

// Add middleware for CORS
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
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

// Run app
$app->run();
