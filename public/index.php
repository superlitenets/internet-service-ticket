<?php
/**
 * NetFlow ISP Management System
 * Main Application Entry Point
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Define base path
define('BASE_PATH', dirname(__DIR__));
define('PUBLIC_PATH', __DIR__);

// Load environment variables
if (file_exists(BASE_PATH . '/.env')) {
    $env = parse_ini_file(BASE_PATH . '/.env');
    foreach ($env as $key => $value) {
        putenv("$key=$value");
    }
}

// Set timezone
date_default_timezone_set(getenv('APP_TIMEZONE') ?: 'UTC');

// Autoload classes
require_once BASE_PATH . '/vendor/autoload.php';

// Load configuration
$config = [
    'db' => [
        'host' => getenv('DB_HOST'),
        'port' => getenv('DB_PORT'),
        'database' => getenv('DB_NAME'),
        'username' => getenv('DB_USER'),
        'password' => getenv('DB_PASSWORD'),
        'charset' => getenv('DB_CHARSET') ?: 'utf8mb4',
    ],
    'app' => [
        'name' => getenv('APP_NAME'),
        'url' => getenv('APP_URL'),
        'debug' => getenv('APP_DEBUG') === 'true',
    ],
    'jwt' => [
        'secret' => getenv('JWT_SECRET'),
        'algorithm' => getenv('JWT_ALGORITHM') ?: 'HS256',
        'expiry' => (int)getenv('JWT_EXPIRY') ?: 86400,
    ],
];

// Create Slim app
$app = \Slim\Factory\AppFactory::create();

// Add error middleware
$app->addErrorMiddleware(
    $config['app']['debug'],
    true,
    true
);

// Add CORS middleware
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    return $response
        ->withHeader('Access-Control-Allow-Origin', '*')
        ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID, X-API-Key')
        ->withHeader('Content-Type', 'application/json');
});

// Store config in container
$container = $app->getContainer();
$container->set('config', $config);

// Register database service
$container->set('db', function ($c) {
    $config = $c->get('config')['db'];
    try {
        $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset={$config['charset']}";
        $pdo = new PDO($dsn, $config['username'], $config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        return $pdo;
    } catch (PDOException $e) {
        die('Database connection failed: ' . $e->getMessage());
    }
});

// Routes
require_once BASE_PATH . '/routes/web.php';
require_once BASE_PATH . '/routes/api.php';
require_once BASE_PATH . '/routes/auth.php';
require_once BASE_PATH . '/routes/admin.php';

// Run the app
$app->run();
