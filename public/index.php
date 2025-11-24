<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Psr\Log\LogLevel;

// Load environment variables
$dotenv = new \Dotenv\Dotenv(__DIR__ . '/..');
$dotenv->safeLoad();

// Create app
$app = AppFactory::create();

// Add routes
require_once __DIR__ . '/../app/routes.php';

// Run app
$app->run();
