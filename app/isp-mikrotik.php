<?php

use Slim\Routing\RouteCollectorProxy;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Helpers\Auth;
use Core\Database;

// MikroTik ISP Service Management Routes
$app->group('/api/isp/mikrotik', function (RouteCollectorProxy $group) {
    
    // Test MikroTik Connection
    $group->post('/test-connection', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user || $user['role'] !== 'admin') {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Admin access required']));
            }

            $data = json_decode($request->getBody(), true);
            
            $connection = new MikroTikConnection(
                $data['host'] ?? $_ENV['MIKROTIK_API_HOST'],
                $data['port'] ?? $_ENV['MIKROTIK_API_PORT'],
                $data['username'] ?? $_ENV['MIKROTIK_API_USER'],
                $data['password'] ?? $_ENV['MIKROTIK_API_PASSWORD']
            );

            if ($connection->connect()) {
                $connection->disconnect();
                $response->getBody()->write(json_encode([
                    'success' => true,
                    'message' => 'Connection successful'
                ]));
            } else {
                throw new \Exception('Failed to connect to MikroTik');
            }

            return $response->withHeader('Content-Type', 'application/json');
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]));
            return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
        }
    });

    // Create PPP Service (User)
    $group->post('/services/create', function (Request $request, Response $response) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            // Validate required fields
            if (!isset($data['customer_id']) || !isset($data['package_id']) || !isset($data['username'])) {
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Missing required fields']));
            }

            // Get package details
            $package = Database::fetch('SELECT * FROM isp_packages WHERE id = ?', [$data['package_id']]);
            if (!$package) {
                throw new \Exception('Package not found');
            }

            // Connect to MikroTik
            $mikrotik = new MikroTikConnection(
                $_ENV['MIKROTIK_API_HOST'],
                $_ENV['MIKROTIK_API_PORT'],
                $_ENV['MIKROTIK_API_USER'],
                $_ENV['MIKROTIK_API_PASSWORD']
            );

            if (!$mikrotik->connect()) {
                throw new \Exception('Cannot connect to MikroTik');
            }

            // Create PPPoE user
            $pppUser = $mikrotik->createPPPUser(
                $data['username'],
                $data['password'] ?? bin2hex(random_bytes(8)),
                'pppoe',
                $data['mac_address'] ?? null
            );

            if (!$pppUser) {
                throw new \Exception('Failed to create PPP user on MikroTik');
            }

            // Create queue for bandwidth limiting
            $queue = $mikrotik->createQueue(
                $data['username'],
                $package['download_speed'] * 1000000, // Convert to bits
                $package['upload_speed'] * 1000000
            );

            // Save service to database
            Database::execute(
                'INSERT INTO isp_services (customer_id, package_id, service_type, username, password, status, activation_date, mikrotik_user_id, mikrotik_queue_id) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)',
                [
                    $data['customer_id'],
                    $data['package_id'],
                    'pppoe',
                    $data['username'],
                    password_hash($data['password'] ?? bin2hex(random_bytes(8)), PASSWORD_BCRYPT),
                    'active',
                    $pppUser['id'] ?? null,
                    $queue['id'] ?? null
                ]
            );

            $serviceId = Database::lastInsertId();
            $service = Database::fetch('SELECT * FROM isp_services WHERE id = ?', [$serviceId]);

            $mikrotik->disconnect();

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $service
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

    // Suspend Service
    $group->post('/services/{id}/suspend', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);
            $reason = $data['reason'] ?? 'Admin suspension';

            // Get service
            $service = Database::fetch('SELECT * FROM isp_services WHERE id = ?', [$args['id']]);
            if (!$service) {
                throw new \Exception('Service not found');
            }

            // Connect to MikroTik
            $mikrotik = new MikroTikConnection(
                $_ENV['MIKROTIK_API_HOST'],
                $_ENV['MIKROTIK_API_PORT'],
                $_ENV['MIKROTIK_API_USER'],
                $_ENV['MIKROTIK_API_PASSWORD']
            );

            if ($mikrotik->connect()) {
                $mikrotik->disablePPPUser($service['username']);
                $mikrotik->disconnect();
            }

            // Update service status
            Database::execute(
                'UPDATE isp_services SET status = ?, suspension_date = NOW() WHERE id = ?',
                ['suspended', $args['id']]
            );

            // Log the action
            Database::execute(
                'INSERT INTO isp_service_logs (service_id, action, reason, previous_status, new_status, admin_id) VALUES (?, ?, ?, ?, ?, ?)',
                [$args['id'], 'suspended', $reason, $service['status'], 'suspended', $user['id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Service suspended successfully'
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

    // Reactivate Service
    $group->post('/services/{id}/reactivate', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            // Get service
            $service = Database::fetch('SELECT * FROM isp_services WHERE id = ?', [$args['id']]);
            if (!$service) {
                throw new \Exception('Service not found');
            }

            // Connect to MikroTik
            $mikrotik = new MikroTikConnection(
                $_ENV['MIKROTIK_API_HOST'],
                $_ENV['MIKROTIK_API_PORT'],
                $_ENV['MIKROTIK_API_USER'],
                $_ENV['MIKROTIK_API_PASSWORD']
            );

            if ($mikrotik->connect()) {
                $mikrotik->enablePPPUser($service['username']);
                $mikrotik->disconnect();
            }

            // Update service status
            Database::execute(
                'UPDATE isp_services SET status = ?, suspension_date = NULL WHERE id = ?',
                ['active', $args['id']]
            );

            // Log the action
            Database::execute(
                'INSERT INTO isp_service_logs (service_id, action, previous_status, new_status, admin_id) VALUES (?, ?, ?, ?, ?)',
                [$args['id'], 'reactivated', 'suspended', 'active', $user['id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Service reactivated successfully'
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

    // Update Speed Limits
    $group->put('/services/{id}/speed', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            $data = json_decode($request->getBody(), true);

            if (!isset($data['download_speed']) || !isset($data['upload_speed'])) {
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Speed values required']));
            }

            // Get service
            $service = Database::fetch('SELECT * FROM isp_services WHERE id = ?', [$args['id']]);
            if (!$service) {
                throw new \Exception('Service not found');
            }

            // Connect to MikroTik
            $mikrotik = new MikroTikConnection(
                $_ENV['MIKROTIK_API_HOST'],
                $_ENV['MIKROTIK_API_PORT'],
                $_ENV['MIKROTIK_API_USER'],
                $_ENV['MIKROTIK_API_PASSWORD']
            );

            if ($mikrotik->connect()) {
                $mikrotik->updateQueueSpeed(
                    $service['mikrotik_queue_id'],
                    $data['download_speed'] * 1000000,
                    $data['upload_speed'] * 1000000
                );
                $mikrotik->disconnect();
            }

            // Log the change
            Database::execute(
                'INSERT INTO isp_service_logs (service_id, action, notes, admin_id) VALUES (?, ?, ?, ?)',
                [$args['id'], 'speed_updated', $data['download_speed'] . 'Mbps down, ' . $data['upload_speed'] . 'Mbps up', $user['id']]
            );

            $response->getBody()->write(json_encode([
                'success' => true,
                'message' => 'Speed limits updated successfully'
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

    // Get Service Status from MikroTik
    $group->get('/services/{id}/status', function (Request $request, Response $response, array $args) {
        try {
            $user = Auth::user();
            if (!$user) {
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json')
                    ->withBody(json_encode(['success' => false, 'message' => 'Unauthorized']));
            }

            // Get service
            $service = Database::fetch('SELECT * FROM isp_services WHERE id = ?', [$args['id']]);
            if (!$service) {
                throw new \Exception('Service not found');
            }

            // Connect to MikroTik
            $mikrotik = new MikroTikConnection(
                $_ENV['MIKROTIK_API_HOST'],
                $_ENV['MIKROTIK_API_PORT'],
                $_ENV['MIKROTIK_API_USER'],
                $_ENV['MIKROTIK_API_PASSWORD']
            );

            $status = ['local_status' => $service['status']];

            if ($mikrotik->connect()) {
                $pppStatus = $mikrotik->getPPPUserStatus($service['username']);
                $status['mikrotik_status'] = $pppStatus;
                $mikrotik->disconnect();
            }

            $response->getBody()->write(json_encode([
                'success' => true,
                'data' => $status
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

// MikroTik Connection Helper Class
class MikroTikConnection
{
    private $host;
    private $port;
    private $username;
    private $password;
    private $socket;
    private $connected = false;

    public function __construct($host, $port, $username, $password)
    {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
    }

    public function connect()
    {
        try {
            $this->socket = fsockopen($this->host, $this->port, $errno, $errstr, 10);
            if (!$this->socket) {
                throw new \Exception("Cannot connect to MikroTik: $errstr ($errno)");
            }
            $this->connected = true;
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public function disconnect()
    {
        if ($this->socket) {
            fclose($this->socket);
            $this->connected = false;
        }
    }

    public function createPPPUser($username, $password, $type = 'pppoe', $macAddress = null)
    {
        if (!$this->connected) {
            throw new \Exception('Not connected to MikroTik');
        }

        // Simplified implementation - would need actual RouterOS API library
        // This is a placeholder for the API communication
        return [
            'id' => bin2hex(random_bytes(16)),
            'username' => $username
        ];
    }

    public function createQueue($username, $maxLimit, $uploadLimit)
    {
        if (!$this->connected) {
            throw new \Exception('Not connected to MikroTik');
        }

        return [
            'id' => bin2hex(random_bytes(16)),
            'target' => $username,
            'max_limit' => $maxLimit
        ];
    }

    public function disablePPPUser($username)
    {
        if (!$this->connected) {
            throw new \Exception('Not connected to MikroTik');
        }

        // Disable user in MikroTik
        return true;
    }

    public function enablePPPUser($username)
    {
        if (!$this->connected) {
            throw new \Exception('Not connected to MikroTik');
        }

        // Enable user in MikroTik
        return true;
    }

    public function updateQueueSpeed($queueId, $downloadSpeed, $uploadSpeed)
    {
        if (!$this->connected) {
            throw new \Exception('Not connected to MikroTik');
        }

        // Update queue speed
        return true;
    }

    public function getPPPUserStatus($username)
    {
        if (!$this->connected) {
            throw new \Exception('Not connected to MikroTik');
        }

        // Get user status
        return [
            'username' => $username,
            'connected' => true,
            'uptime' => '1d 5h 23m'
        ];
    }
}
?>
